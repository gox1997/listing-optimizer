import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(
                    cookiesToSet: {
                        name: string;
                        value: string;
                        options: CookieOptions;
                    }[],
                ) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value),
                    );
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options),
                    );
                },
            },
        },
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Define which routes require authentication
    const isAppPage =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/generate") ||
        pathname.startsWith("/history") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/upgrade") ||
        pathname.startsWith("/bulk") ||
        pathname.startsWith("/onboarding");

    // Unauthenticated users trying to access app pages → redirect to /auth
    if (isAppPage && !user) {
        return NextResponse.redirect(new URL("/auth", request.url));
    }

    // Authenticated users visiting /auth → redirect to dashboard
    if (pathname === "/auth" && user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Authenticated users who haven't completed onboarding (and not already there)
    if (user && pathname !== "/onboarding" && isAppPage) {
        const { data: profile } = await supabase
            .from("user_profiles")
            .select("onboarding_completed")
            .eq("id", user.id)
            .single();

        if (profile && !profile.onboarding_completed) {
            return NextResponse.redirect(new URL("/onboarding", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
