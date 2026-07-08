import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { verifyCalendlyToken, listCalendlyEventTypes } from "@/lib/calendly"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { token } = await req.json()
        if (!token || typeof token !== "string") {
            return NextResponse.json({ error: "Missing Calendly token" }, { status: 400 })
        }

        const check = await verifyCalendlyToken(token)
        if (!check.valid || !check.userUri) {
            return NextResponse.json({ error: check.error || "Invalid Calendly token" }, { status: 400 })
        }

        const eventTypes = await listCalendlyEventTypes(token, check.userUri)
        if (eventTypes.length === 0) {
            return NextResponse.json({ error: "No active event types found on this Calendly account" }, { status: 400 })
        }

        return NextResponse.json({ eventTypes })
    } catch (err) {
        console.error("Calendly verify error:", err)
        return NextResponse.json({ error: "Failed to verify Calendly token" }, { status: 500 })
    }
}