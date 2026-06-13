import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        req.cookies.set(name, value)
                        res.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = req.nextUrl

    // Protect dashboard and onboarding
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
        if (!user) {
            return NextResponse.redirect(new URL("/login", req.url))
        }
    }

    // Redirect logged-in users away from auth pages
    if (pathname === "/login" || pathname === "/signup") {
        if (user) {
            return NextResponse.redirect(new URL("/dashboard", req.url))
        }
    }

    return res
}

export const config = {
    matcher: ["/dashboard/:path*", "/onboarding/:path*", "/login", "/signup"],
}