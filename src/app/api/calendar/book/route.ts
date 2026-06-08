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

        // Vapi wraps arguments inside message.toolCallList
        const toolCall = body?.message?.toolCallList?.[0]
        const args = toolCall?.function?.arguments ?? body

        const { callerName, callerPhone, date, time, type } = args

        if (!businessId || !callerName || !date || !time) {
            return NextResponse.json({
                results: [{ toolCallId: toolCall?.id ?? "", result: "Missing required fields: need callerName, date, and time." }]
            })
        }

        // Check slot is still available
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
                results: [{ toolCallId: toolCall?.id ?? "", result: "Sorry, that time slot was just booked. Please check availability again for another time." }]
            })
        }

        // Get business details
        const { data: business } = await supabase
            .from("businesses")
            .select("name, meeting_duration, calendar_type, calendar_token")
            .eq("id", businessId)
            .single()

        if (!business) {
            return NextResponse.json({
                results: [{ toolCallId: toolCall?.id ?? "", result: "Business not found." }]
            })
        }

        // Book in our database
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

        // Also create Google Calendar event if connected
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
                toolCallId: toolCall?.id ?? "",
                result: `Appointment confirmed! ${callerName} is booked for ${type || "an appointment"} on ${date} at ${time}.`
            }]
        })
    } catch (err) {
        console.error("Booking error:", err)
        return NextResponse.json({
            results: [{ toolCallId: "", result: "Failed to book appointment. Please try again." }]
        })
    }
}