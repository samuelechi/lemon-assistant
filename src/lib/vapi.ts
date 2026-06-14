const VAPI_API_KEY = process.env.VAPI_API_KEY!
const VAPI_BASE = "https://api.vapi.ai"

export async function createVapiAssistant({
  businessName, aiName, businessType,
  hoursStart, hoursEnd, workingDays,
  meetingTypes, meetingDuration, about,
  businessId, appUrl,
}: {
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
}) {
  const systemPrompt = `
You are ${aiName}, a professional and friendly AI receptionist for ${businessName}${businessType ? `, a ${businessType}` : ""}.

${about ? `About this business: ${about}` : ""}

## Your job:
1. Greet the caller warmly and professionally
2. Ask for their full name
3. Ask for the reason for their call
4. If they want to book an appointment, use the checkAvailability tool to find open slots
5. Offer the available slots to the caller
6. Use the bookAppointment tool to confirm the booking
7. Tell them they will receive an SMS confirmation
8. Thank them and end the call

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

  const tools = businessId && appUrl ? [
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
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
      },
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

export async function createVapiPhoneNumber(assistantId: string) {
  const res = await fetch(`${VAPI_BASE}/phone-number`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider: "vapi",
      assistantId,
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

export async function updateVapiAssistant(
  assistantId: string,
  updates: {
    businessName?: string
    aiName?: string
    businessType?: string
    hoursStart?: string
    hoursEnd?: string
    workingDays?: string[]
    meetingTypes?: string[]
    meetingDuration?: number
    about?: string
  }
) {
  const res = await fetch(`${VAPI_BASE}/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstMessage: updates.businessName && updates.aiName
        ? `Thank you for calling ${updates.businessName}, this is ${updates.aiName} speaking. How can I help you today?`
        : undefined,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error("Vapi update assistant error:", JSON.stringify(data, null, 2))
    throw new Error(data.message || data.error || JSON.stringify(data))
  }
  return data
}