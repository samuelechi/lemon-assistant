import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const userId = searchParams.get("state")
    const error = searchParams.get("error")

    if (error || !code || !userId) {
        return NextResponse.redirect(
            new URL("/dashboard?calendar=error", req.url)
        )
    }

    try {
        // Exchange code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
                grant_type: "authorization_code",
            }),
        })

        const tokens = await tokenRes.json()
        if (!tokenRes.ok) throw new Error(tokens.error)

        // Save tokens to business
        await supabase
            .from("businesses")
            .update({
                calendar_type: "google",
                calendar_token: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expiry_date: Date.now() + tokens.expires_in * 1000,
                },
            })
            .eq("user_id", userId)

        return NextResponse.redirect(
            new URL("/dashboard?calendar=connected", req.url)
        )
    } catch (err) {
        console.error("Google OAuth error:", err)
        return NextResponse.redirect(
            new URL("/dashboard?calendar=error", req.url)
        )
    }
}