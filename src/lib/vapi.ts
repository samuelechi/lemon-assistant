const VAPI_API_KEY = process.env.VAPI_API_KEY!
const VAPI_BASE = "https://api.vapi.ai"

export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM" // Rachel — fallback for all plans

export type AssistantConfig = {
  businessName: string
  aiName: string
  businessType: string
  hoursStart: string
  hoursEnd: string
  workingDays: string[]
  meetingTypes: string[]
  meetingDuration: number
  about?: string
  businessId?: string
  appUrl?: string
  voiceId?: string // Pro only — ElevenLabs voice ID
}

function buildSystemPrompt({
  businessName, aiName, businessType,
  hoursStart, hoursEnd, workingDays,
  meetingTypes, meetingDuration, about,
}: AssistantConfig): string {
  return `
You are ${aiName}, a professional and friendly AI receptionist for ${businessName}${businessType ? `, a ${businessType}` : ""}.

${about ? `About this business: ${about}` : ""}

## Today's date
The current date is {{"now" | date: "%A, %B %d, %Y"}} (raw timestamp: {{now}}). Treat this as today.
When the caller mentions a day or date (e.g. "next Tuesday", "the 15th"), resolve it to an absolute
date in the current year or later. Always pass dates to tools in YYYY-MM-DD format with the correct
current year, and never book a date in the past.

## Your job:
1. Greet the caller warmly and professionally
2. Ask for their full name
3. Ask for the reason for their call
4. If they want to book an appointment, use the checkAvailability tool to find open slots
5. Offer the available slots to the caller
6. Confirm the best mobile number to text the confirmation to. If they're happy
   to use the number they're calling from, that's fine — otherwise ask for one.
7. Use the bookAppointment tool to confirm the booking, passing callerPhone
8. Tell them they will receive an SMS confirmation at that number
9. Thank them and end the call

## Business hours:
Open ${hoursStart} to ${hoursEnd}, ${workingDays.join(", ")}.

## Appointment types offered:
${meetingTypes.join(", ")} — each ${meetingDuration} minutes long.

## Rules:
- Never give medical, legal, or financial advice
- If caller sounds like an emergency, tell them to call 911 immediately
- If asked about pricing, say the team will discuss that at the appointment
- Keep responses short and natural — this is a phone call
- Always confirm appointment details before ending
- If someone asks for the owner or staff, say they are unavailable and offer to book or take a message
- Always be warm, calm, and professional
  `.trim()
}

function buildTools(businessId?: string, appUrl?: string) {
  return businessId && appUrl ? [
    {
      type: "function",
      function: {
        name: "checkAvailability",
        description: "Check available appointment slots for a given date",
        parameters: {
          type: "object",
          properties: {
            date: {
              type: "string",
              description: "The date to check in YYYY-MM-DD format",
            },
          },
          required: ["date"],
        },
      },
      server: {
        url: `${appUrl}/api/calendar/availability?businessId=${businessId}`,
      },
    },
    {
      type: "function",
      function: {
        name: "bookAppointment",
        description: "Book an appointment for the caller",
        parameters: {
          type: "object",
          properties: {
            callerName: { type: "string", description: "Full name of the caller" },
            callerPhone: { type: "string", description: "Phone number of the caller" },
            date: { type: "string", description: "Date in YYYY-MM-DD format" },
            time: { type: "string", description: "Time slot e.g. 2:00 PM" },
            type: { type: "string", description: "Type of appointment" },
          },
          required: ["callerName", "date", "time"],
        },
      },
      server: {
        url: `${appUrl}/api/calendar/book?businessId=${businessId}`,
      },
    },
  ] : []
}

function buildVoice(voiceId?: string) {
  return {
    provider: "11labs",
    voiceId: voiceId || DEFAULT_VOICE_ID,
  }
}

export async function createVapiAssistant(config: AssistantConfig) {
  const { businessName, aiName, businessId, appUrl, voiceId } = config
  const systemPrompt = buildSystemPrompt(config)
  const tools = buildTools(businessId, appUrl)

  const res = await fetch(`${VAPI_BASE}/assistant`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${businessName} — ${aiName}`,
      firstMessage: `Thank you for calling ${businessName}, this is ${aiName} speaking. How can I help you today?`,
      serverUrl: `${appUrl}/api/vapi/webhook`,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        systemPrompt,
        tools,
      },
      voice: buildVoice(voiceId),
      endCallMessage: "Thank you for calling. Have a wonderful day!",
      recordingEnabled: true,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en",
      },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error("Vapi create assistant error:", JSON.stringify(data, null, 2))
    throw new Error(data.message || data.error || JSON.stringify(data))
  }
  return data
}

export async function createVapiPhoneNumber(assistantId: string, appUrl?: string) {
  const serverUrl = appUrl
    ? `${appUrl}/api/vapi/webhook`
    : `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`

  const res = await fetch(`${VAPI_BASE}/phone-number`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider: "vapi",
      assistantId,
      serverUrl,
      name: "LemonAssistant number",
      numberDesiredAreaCode: "651",
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error("Vapi create phone error:", JSON.stringify(data, null, 2))
    throw new Error(data.message || data.error || JSON.stringify(data))
  }
  return data
}

export async function updateVapiAssistant(assistantId: string, config: AssistantConfig) {
  const { businessName, aiName, businessId, appUrl, voiceId } = config
  const systemPrompt = buildSystemPrompt(config)
  const tools = buildTools(businessId, appUrl)

  const res = await fetch(`${VAPI_BASE}/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${businessName} — ${aiName}`,
      firstMessage: `Thank you for calling ${businessName}, this is ${aiName} speaking. How can I help you today?`,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        systemPrompt,
        tools,
      },
      voice: buildVoice(voiceId),
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error("Vapi update assistant error:", JSON.stringify(data, null, 2))
    throw new Error(data.message || data.error || JSON.stringify(data))
  }
  return data
}