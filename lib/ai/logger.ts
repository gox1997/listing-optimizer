// lib/ai/logger.ts
//
// Structured logger for the AI pipeline.
// Uses a lightweight JSON logger — no external dependencies required.
// Every log line is a valid JSON object parseable by Datadog, Axiom,
// Grafana Loki, or any structured log aggregator.
//
// Usage:
//   const log = createRequestLogger(requestId);
//   log.info({ step: "keyword" }, "Keyword intelligence succeeded");
//   emitMetric(log, { name: "pipeline.duration", value: 420, unit: "ms" });
//
// To add Prometheus: replace emitMetric with a push to a prom-client counter/histogram.
// To add pino: swap createRequestLogger to return a pino child logger.

/* ------------------------------------------------------------------ */
/*  Log levels                                                          */
/* ------------------------------------------------------------------ */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const CONFIGURED_LEVEL: LogLevel =
    (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_RANK[level] >= LOG_LEVEL_RANK[CONFIGURED_LEVEL];
}

/* ------------------------------------------------------------------ */
/*  RequestLogger — bound to a requestId, service name, and timestamp  */
/* ------------------------------------------------------------------ */

export type LogContext = Record<string, unknown>;

export class RequestLogger {
    private readonly base: LogContext;

    constructor(requestId: string, extra?: LogContext) {
        this.base = {
            service: "listing-optimizer",
            requestId,
            env: process.env.NODE_ENV ?? "development",
            ...extra,
        };
    }

    debug(ctx: LogContext, msg: string): void {
        this.write("debug", ctx, msg);
    }

    info(ctx: LogContext, msg: string): void {
        this.write("info", ctx, msg);
    }

    warn(ctx: LogContext, msg: string): void {
        this.write("warn", ctx, msg);
    }

    error(ctx: LogContext, msg: string): void {
        this.write("error", ctx, msg);
    }

    /** Returns a child logger with additional fixed context merged in */
    child(extra: LogContext): RequestLogger {
        return new RequestLogger(this.base.requestId as string, {
            ...this.base,
            ...extra,
        });
    }

    private write(level: LogLevel, ctx: LogContext, msg: string): void {
        if (!shouldLog(level)) return;

        const line = JSON.stringify({
            level,
            time: new Date().toISOString(),
            msg,
            ...this.base,
            ...ctx,
        });

        // Route to correct console method so serverless platforms colour-code correctly
        if (level === "error") {
            console.error(line);
        } else if (level === "warn") {
            console.warn(line);
        } else {
            console.log(line);
        }
    }
}

/* ------------------------------------------------------------------ */
/*  Factory                                                             */
/* ------------------------------------------------------------------ */

export function createRequestLogger(requestId: string): RequestLogger {
    return new RequestLogger(requestId);
}

/* ------------------------------------------------------------------ */
/*  Metric emission                                                     */
/* ------------------------------------------------------------------ */

export type MetricUnit = "ms" | "tokens" | "count" | "bytes";

export type Metric = {
    name: string;
    value: number;
    unit: MetricUnit;
    tags?: Record<string, string | number | boolean>;
};

/**
 * emitMetric
 *
 * Emits a structured metric as a log line.
 * The `metric` field makes these lines queryable independently of
 * regular log lines in any aggregator that supports JSON field filtering.
 *
 * Example Datadog query: @metric.name:pipeline.duration
 * Example Loki query:    {service="listing-optimizer"} | json | metric_name="pipeline.duration"
 */
export function emitMetric(log: RequestLogger, metric: Metric): void {
    log.info({ metric }, `metric:${metric.name}=${metric.value}${metric.unit}`);
}
