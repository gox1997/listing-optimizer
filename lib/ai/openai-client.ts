import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
    throw new Error(
        "Missing environment variable: OPENAI_API_KEY\n" +
            "Add it to your .env.local file.",
    );
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30_000, // 30 seconds — fail fast before serverless function times out
    maxRetries: 0, // We handle retries ourselves in ai.service.ts
});
export const AI_MODEL = "gpt-4o-mini" as const;
export const MAX_TOKENS = 2000 as const;
export const TEMPERATURE = 0.7 as const;
