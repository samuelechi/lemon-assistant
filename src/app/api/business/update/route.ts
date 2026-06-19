import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { updateVapiAssistant } from "@/lib/vapi"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await req.json()
        const { ai_name, ai_greeting, name, type, about, hours_start, hours_end, notification_phone } = body

        // Normalize the notification number to E.164 so Twilio accepts it.
        // Accepts a bare 10-digit NANP number or a leading "1", else passes
        // through (already-+ prefixed numbers are kept as-is).
        let normalizedPhone: string | undefined
        if (notification_phone !== undefined) {
            const raw = String(notification_phone).trim()
            if (raw === "") {
                normalizedPhone = "" // allow clearing it
            } else if (raw.startsWith("+")) {
                normalizedPhone = raw.replace(/[^\d+]/g, "")
            } else {
                const digits = raw.replace(/\D/g, "")
                if (digits.length === 10) normalizedPhone = `+1${digits}`
                else if (digits.length === 11 && digits.startsWith("1")) normalizedPhone = `+${digits}`
                else normalizedPhone = `+${digits}`
            }
        }

        const { data: business } = await supabase
            .from("businesses")
            .select("id, vapi_assistant_id, name, ai_name, type, about, hours_start, hours_end, working_days, meeting_types, meeting_duration")
            .eq("user_id", user.id)
            .single()

        if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 })

        // Update Supabase
        await supabase
            .from("businesses")
            .update({
                ...(ai_name && { ai_name }),
                ...(ai_greeting && { ai_greeting }),
                ...(name && { name }),
                ...(type && { type }),
                ...(about !== undefined && { about }),
                ...(hours_start && { hours_start }),
                ...(hours_end && { hours_end }),
                ...(normalizedPhone !== undefined && { notification_phone: normalizedPhone }),
            })
            .eq("user_id", user.id)

        // Update Vapi assistant in place (prompt + tools + greeting). Uses the
        // new values where provided, falling back to the stored business values.
        // Never recreates — the phone number is untouched.
        if (business.vapi_assistant_id) {
            await updateVapiAssistant(business.vapi_assistant_id, {
                businessName: name ?? business.name,
                aiName: ai_name ?? business.ai_name,
                businessType: type ?? business.type ?? "",
                hoursStart: hours_start ?? business.hours_start,
                hoursEnd: hours_end ?? business.hours_end,
                workingDays: business.working_days || [],
                meetingTypes: business.meeting_types || [],
                meetingDuration: business.meeting_duration || 30,
                about: about ?? business.about ?? "",
                businessId: business.id,
                appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            })
        }

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}