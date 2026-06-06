import { google } from "googleapis"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        process.env.GOOGLE_REDIRECT_URI!
    )
}

async function getAuthenticatedClient(businessId: string) {
    const { data: business } = await supabase
        .from("businesses")
        .select("calendar_token")
        .eq("id", businessId)
        .single()

    if (!business?.calendar_token) throw new Error("No Google Calendar connected")

    const oauth2Client = getOAuthClient()
    oauth2Client.setCredentials(business.calendar_token)

    // Auto refresh token if expired
    oauth2Client.on("tokens", async (tokens) => {
        if (tokens.refresh_token) {
            await supabase
                .from("businesses")
                .update({
                    calendar_token: {
                        ...business.calendar_token,
                        access_token: tokens.access_token,
                        expiry_date: tokens.expiry_date,
                    },
                })
                .eq("id", businessId)
        }
    })

    return oauth2Client
}

export async function getGoogleCalendarEvents(
    businessId: string,
    date: string
): Promise<string[]> {
    try {
        const auth = await getAuthenticatedClient(businessId)
        const calendar = google.calendar({ version: "v3", auth })

        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const { data } = await calendar.events.list({
            calendarId: "primary",
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
        })

        // Return booked time slots
        return (data.items || []).map(event => {
            const start = event.start?.dateTime || event.start?.date
            if (!start) return ""
            const d = new Date(start)
            return `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, "0")} ${d.getHours() < 12 ? "AM" : "PM"}`
        }).filter(Boolean)
    } catch (err) {
        console.error("Google Calendar events error:", err)
        return []
    }
}

export async function createGoogleCalendarEvent(
    businessId: string,
    {
        callerName,
        callerPhone,
        date,
        time,
        type,
        duration,
        businessName,
    }: {
        callerName: string
        callerPhone: string
        date: string
        time: string
        type: string
        duration: number
        businessName: string
    }
) {
    try {
        const auth = await getAuthenticatedClient(businessId)
        const calendar = google.calendar({ version: "v3", auth })

        // Parse time
        const [timePart, period] = time.split(" ")
        const [hours, minutes] = timePart.split(":").map(Number)
        let hour24 = hours
        if (period === "PM" && hours !== 12) hour24 += 12
        if (period === "AM" && hours === 12) hour24 = 0

        const startDate = new Date(date)
        startDate.setHours(hour24, minutes, 0, 0)
        const endDate = new Date(startDate)
        endDate.setMinutes(endDate.getMinutes() + duration)

        const event = await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary: `${type} — ${callerName}`,
                description: `Booked via LemonAssistant\nCaller: ${callerName}\nPhone: ${callerPhone}`,
                start: { dateTime: startDate.toISOString() },
                end: { dateTime: endDate.toISOString() },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: "email", minutes: 24 * 60 },
                        { method: "popup", minutes: 30 },
                    ],
                },
            },
        })

        return event.data
    } catch (err) {
        console.error("Google Calendar create event error:", err)
        throw err
    }
}