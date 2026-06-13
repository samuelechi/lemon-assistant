import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createGoogleCalendarEvent } from "@/lib/google-calendar"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")

    try {
        const body = await req.json()

        const toolCall = body?.message?.toolCallList?.[0]
        const toolCallId = toolCall?.id ?? ""
        const rawArgs = toolCall?.function?.arguments
        const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs
        const { callerName, callerPhone, date, time, type } = args ?? {}

        console.log("BOOK:", { businessId, callerName, date, time, toolCallId })

        if (!businessId || !callerName || !date || !time) {
            return NextResponse.json({
                results: [{ toolCallId, result: "Missing required fields." }]
            })
        }

        const { data: existing } = await supabase
            .from("appointments")
            .select("id")
            .eq("business_id", businessId)
            .eq("date", date)
            .eq("time", time)
            .neq("status", "cancelled")
            .maybeSingle()

        if (existing) {
            return NextResponse.json({
                results: [{ toolCallId, result: "That time slot is already booked. Please check availability again." }]
            })
        }

        const { data: business } = await supabase
            .from("businesses")
            .select("name, meeting_duration, calendar_type, calendar_token")
            .eq("id", businessId)
            .single()

        if (!business) {
            return NextResponse.json({
                results: [{ toolCallId, result: "Business not found." }]
            })
        }

        const { data: appointment, error } = await supabase
            .from("appointments")
            .insert({
                business_id: businessId,
                caller_name: callerName,
                caller_phone: callerPhone || "",
                date,
                time,
                type: type || "Appointment",
                status: "confirmed",
            })
            .select()
            .single()

        if (error) throw error

        if (business.calendar_type === "google" && business.calendar_token) {
            await createGoogleCalendarEvent(businessId, {
                callerName,
                callerPhone: callerPhone || "",
                date,
                time,
                type: type || "Appointment",
                duration: business.meeting_duration || 30,
                businessName: business.name,
            })
        }

        return NextResponse.json({
            results: [{
                toolCallId,
                result: `Appointment confirmed! ${callerName} is booked for ${type || "an appointment"} on ${date} at ${time}.`
            }]
        })
    } catch (err) {
        console.error("Booking error:", err)
        return NextResponse.json({
            results: [{ toolCallId: "", result: "Failed to book the appointment. Please try again." }]
        })
    }
}