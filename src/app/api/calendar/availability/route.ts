import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getGoogleCalendarEvents } from "@/lib/google-calendar"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkMinuteLimit(businessId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Get subscription
    const { data: business } = await supabase
        .from("businesses")
        .select("user_id")
        .eq("id", businessId)
        .single()

    if (!business) return { allowed: false, reason: "Business not found." }

    const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", business.user_id)
        .maybeSingle()

    const planLimits: Record<string, number> = {
        growth: 250,
        pro: 600,
        trial: 13,
    }

    const isActive = sub?.status === "active"
    const plan = isActive ? sub!.plan : "trial"
    const limit = planLimits[plan] ?? 13

    // Paid plans reset monthly. Trial is a lifetime cap — count all calls ever.
    let query = supabase
        .from("calls")
        .select("duration_seconds")
        .eq("business_id", businessId)

    if (isActive) {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        query = query.gte("created_at", startOfMonth)
    }

    const { data: calls } = await query

    const minutesUsed = Math.round(
        (calls || []).reduce((sum, c) => sum + (c.duration_seconds || 0), 0) / 60
    )

    if (minutesUsed >= limit) {
        const reason = isActive
            ? `Your ${plan} plan's ${limit} minutes have been used for this month. Please upgrade or wait until next month.`
            : `Your free trial of ${limit} minutes has been used. Please upgrade to continue.`
        return { allowed: false, reason }
    }

    return { allowed: true }
}

async function getAvailability(businessId: string, date: string) {
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

    const { data: business } = await supabase
        .from("businesses")
        .select("meeting_duration, hours_start, hours_end, calendar_type, calendar_token")
        .eq("id", businessId)
        .single()

    if (!business) return null

    const { data: blocked } = await supabase
        .from("blocked_dates")
        .select("id")
        .eq("business_id", businessId)
        .eq("date", date)
        .maybeSingle()

    if (blocked) {
        return { available: [], message: "This date is unavailable" }
    }

    const { data: availability } = await supabase
        .from("availability")
        .select("start_time, end_time")
        .eq("business_id", businessId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)

    const slots: string[] = []
    const duration = business.meeting_duration || 30

    const timeRanges = availability && availability.length > 0
        ? availability
        : [{ start_time: business.hours_start || "09:00", end_time: business.hours_end || "17:00" }]

    for (const range of timeRanges) {
        const [startH, startM] = range.start_time.split(":").map(Number)
        const [endH, endM] = range.end_time.split(":").map(Number)
        let current = startH * 60 + startM
        const end = endH * 60 + endM

        while (current + duration <= end) {
            const h = Math.floor(current / 60)
            const m = current % 60
            const timeStr = `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`
            slots.push(timeStr)
            current += duration
        }
    }

    const { data: booked } = await supabase
        .from("appointments")
        .select("time")
        .eq("business_id", businessId)
        .eq("date", date)
        .neq("status", "cancelled")

    const bookedTimes = new Set(booked?.map(b => b.time) || [])

    if (business.calendar_type === "google" && business.calendar_token) {
        const googleBooked = await getGoogleCalendarEvents(businessId, date)
        googleBooked.forEach(t => bookedTimes.add(t))
    }

    const available = slots.filter(s => !bookedTimes.has(s))
    return { available, date, dayOfWeek }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")
    const date = searchParams.get("date")

    if (!businessId || !date) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 })
    }

    try {
        const result = await getAvailability(businessId, date)
        if (!result) return NextResponse.json({ error: "Business not found" }, { status: 404 })
        return NextResponse.json(result)
    } catch (err) {
        console.error("Availability error:", err)
        return NextResponse.json({ error: "Failed to get availability" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")

    try {
        const body = await req.json()

        const toolCall = body?.message?.toolCallList?.[0]
        const toolCallId = toolCall?.id ?? ""
        const rawArgs = toolCall?.function?.arguments
        const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs
        const date = args?.date

        console.log("toolCallId:", toolCallId, "date:", date, "businessId:", businessId)

        if (!businessId || !date) {
            return NextResponse.json({
                results: [{ toolCallId, result: "Missing businessId or date." }]
            })
        }

        // 🔒 Minute enforcement
        const { allowed, reason } = await checkMinuteLimit(businessId)
        if (!allowed) {
            console.log("Minute limit reached for business:", businessId, reason)
            return NextResponse.json({
                results: [{
                    toolCallId,
                    result: "I'm sorry, this service is temporarily unavailable. Please contact the business directly to book an appointment."
                }]
            })
        }

        const result = await getAvailability(businessId, date)

        if (!result) {
            return NextResponse.json({
                results: [{ toolCallId, result: "Business not found." }]
            })
        }

        const message = result.available.length === 0
            ? "There are no available slots on that date. Would you like to try a different day?"
            : `Available times on ${date}: ${result.available.join(", ")}. Which time works for you?`

        return NextResponse.json({
            results: [{ toolCallId, result: message }]
        })
    } catch (err) {
        console.error("Availability POST error:", err)
        return NextResponse.json({
            results: [{ toolCallId: "", result: "Failed to check availability. Please try again." }]
        })
    }
}