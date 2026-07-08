// Calendly integration. Unlike Google Calendar, Calendly's public API cannot
// create a booking on a caller's behalf — it can only report availability and
// hand back a scheduling link. The caller must open that link and confirm the
// time themselves. See src/app/api/calendar/send-link/route.ts for the tool
// that texts this link to the caller mid-call.

const CALENDLY_API = "https://api.calendly.com"

export type CalendlySlot = {
    startTime: string // ISO string, e.g. "2026-07-15T14:00:00.000000Z"
    label: string      // human readable, e.g. "2:00 PM"
}

// Fetch available start times for a single event type on a given date.
// Calendly's API only allows windows up to 7 days, so we ask for just the
// single day (start of day -> end of day) in the business's local time.
export async function getCalendlyAvailability(
    personalAccessToken: string,
    eventTypeUri: string,
    date: string, // YYYY-MM-DD
    timezone: string = "America/Winnipeg"
): Promise<CalendlySlot[]> {
    try {
        const startTime = new Date(`${date}T00:00:00`).toISOString()
        const endTime = new Date(`${date}T23:59:59`).toISOString()

        const url = new URL(`${CALENDLY_API}/event_type_available_times`)
        url.searchParams.set("event_type", eventTypeUri)
        url.searchParams.set("start_time", startTime)
        url.searchParams.set("end_time", endTime)

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${personalAccessToken}` },
        })

        if (!res.ok) {
            console.error("Calendly availability error:", await res.text())
            return []
        }

        const data = await res.json()
        const slots: CalendlySlot[] = (data.collection || []).map((s: { start_time: string }) => {
            const d = new Date(s.start_time)
            const label = d.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                timeZone: timezone,
            })
            return { startTime: s.start_time, label }
        })

        return slots
    } catch (err) {
        console.error("Calendly availability fetch failed:", err)
        return []
    }
}

// Create a single-use scheduling link for an event type. This is the URL we
// text the caller — it takes them straight to Calendly's booking page for
// that event type. Calendly does not support pre-selecting a specific time
// via the public API, so the caller picks their confirmed slot again there;
// the AI should mention the specific time it found so there's no confusion.
export async function createCalendlySchedulingLink(
    personalAccessToken: string,
    eventTypeUri: string
): Promise<string | null> {
    try {
        const res = await fetch(`${CALENDLY_API}/scheduling_links`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${personalAccessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                max_event_count: 1,
                owner: eventTypeUri,
                owner_type: "EventType",
            }),
        })

        if (!res.ok) {
            console.error("Calendly scheduling link error:", await res.text())
            return null
        }

        const data = await res.json()
        return data?.resource?.booking_url || null
    } catch (err) {
        console.error("Calendly scheduling link fetch failed:", err)
        return null
    }
}

// Validate a Personal Access Token by hitting /users/me — used when the
// business owner connects Calendly in Settings, so we can confirm the token
// works before saving it.
export async function verifyCalendlyToken(personalAccessToken: string): Promise<{
    valid: boolean
    userUri?: string
    error?: string
}> {
    try {
        const res = await fetch(`${CALENDLY_API}/users/me`, {
            headers: { Authorization: `Bearer ${personalAccessToken}` },
        })
        if (!res.ok) {
            return { valid: false, error: "Invalid token or insufficient permissions." }
        }
        const data = await res.json()
        return { valid: true, userUri: data?.resource?.uri }
    } catch {
        return { valid: false, error: "Could not reach Calendly." }
    }
}

// List event types for the connected user, so the Settings UI can let the
// owner pick which one their AI should book against.
export async function listCalendlyEventTypes(personalAccessToken: string, userUri: string): Promise<
    { uri: string; name: string; durationMinutes: number; schedulingUrl: string }[]
> {
    try {
        const url = new URL(`${CALENDLY_API}/event_types`)
        url.searchParams.set("user", userUri)
        url.searchParams.set("active", "true")

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${personalAccessToken}` },
        })
        if (!res.ok) return []

        const data = await res.json()
        return (data.collection || []).map((e: { uri: string; name: string; duration: number; scheduling_url: string }) => ({
            uri: e.uri,
            name: e.name,
            durationMinutes: e.duration,
            schedulingUrl: e.scheduling_url,
        }))
    } catch (err) {
        console.error("Calendly event types fetch failed:", err)
        return []
    }
}