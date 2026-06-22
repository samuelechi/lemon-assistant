import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ELEVENLABS_VOICES } from "@/lib/elevenlabs-voices"

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // Check subscription plan
        const { data: sub } = await supabase
            .from("subscriptions")
            .select("plan, status")
            .eq("user_id", user.id)
            .single()

        const isPro = sub?.status === "active" && sub?.plan === "pro"

        return NextResponse.json({ voices: ELEVENLABS_VOICES, isPro })
    } catch (err) {
        console.error("GET /api/voices error:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}