import { NextRequest, NextResponse } from "next/server"
import { createVapiAssistant } from "@/lib/vapi"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const VAPI_API_KEY = process.env.VAPI_API_KEY!
const VAPI_BASE = "https://api.vapi.ai"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: business } = await supabase
            .from("businesses")
            .select("*")
            .eq("user_id", user.id)
            .single()

        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

        // Delete old assistant if exists
        if (business.vapi_assistant_id) {
            await fetch(`${VAPI_BASE}/assistant/${business.vapi_assistant_id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${VAPI_API_KEY}` },
            }).catch(() => { })
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

        // Create assistant only — no phone number during trial
        const assistant = await createVapiAssistant({
            businessName: business.name,
            aiName: business.ai_name,
            businessType: business.type,
            hoursStart: business.hours_start,
            hoursEnd: business.hours_end,
            workingDays: business.working_days,
            meetingTypes: business.meeting_types,
            meetingDuration: business.meeting_duration,
            about: business.about,
            businessId: business.id,
            appUrl,
            calendarType: business.calendar_type,
        })

        await supabase
            .from("businesses")
            .update({ vapi_assistant_id: assistant.id })
            .eq("user_id", user.id)

        return NextResponse.json({ assistantId: assistant.id })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        console.error("Vapi create error:", message, err)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}