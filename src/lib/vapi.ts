const VAPI_API_KEY = process.env.VAPI_API_KEY!
const VAPI_BASE = "https://api.vapi.ai"

export const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

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
  voiceId?: string    // Pro only
  language?: string   // Pro only
  reviewUrl?: string  // Pro only
  calendarType?: string // "builtin" | "google" | "calendly"
}

export type SupportedLanguage = {
  code: string
  label: string
  flag: string
  greeting: string
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", label: "English", flag: "🇺🇸", greeting: "English" },
  { code: "fr", label: "French", flag: "🇫🇷", greeting: "French (Français)" },
  { code: "es", label: "Spanish", flag: "🇪🇸", greeting: "Spanish (Español)" },
  { code: "de", label: "German", flag: "🇩🇪", greeting: "German (Deutsch)" },
  { code: "pt", label: "Portuguese", flag: "🇧🇷", greeting: "Portuguese (Português)" },
  { code: "it", label: "Italian", flag: "🇮🇹", greeting: "Italian (Italiano)" },
  { code: "nl", label: "Dutch", flag: "🇳🇱", greeting: "Dutch (Nederlands)" },
  { code: "pl", label: "Polish", flag: "🇵🇱", greeting: "Polish (Polski)" },
  { code: "hi", label: "Hindi", flag: "🇮🇳", greeting: "Hindi (हिन्दी)" },
  { code: "ja", label: "Japanese", flag: "🇯🇵", greeting: "Japanese (日本語)" },
  { code: "zh", label: "Chinese (Mandarin)", flag: "🇨🇳", greeting: "Mandarin Chinese (普通话)" },
  { code: "ar", label: "Arabic", flag: "🇸🇦", greeting: "Arabic (العربية)" },
]

export const DEFAULT_LANGUAGE = "en"

function buildJobSteps(calendarType?: string): string {
  if (calendarType === "calendly") {
    return `
6. Confirm the best mobile number to text the booking link to. If they're
   happy to use the number they're calling from, that's fine — otherwise ask
   for one.
7. Use the sendBookingLink tool, passing callerPhone and the time they chose
8. Tell them they'll receive a text with a link to confirm and lock in that time
9. Thank them and end the call`.trim()
  }
  return `
6. Confirm the best mobile number to text the confirmation to. If they're happy
   to use the number they're calling from, that's fine — otherwise ask for one.
7. Use the bookAppointment tool to confirm the booking, passing callerPhone
8. Tell them they will receive an SMS confirmation at that number
9. Thank them and end the call`.trim()
}

function buildSystemPrompt({
  businessName, aiName, businessType,
  hoursStart, hoursEnd, workingDays,
  meetingTypes, meetingDuration, about, language, reviewUrl, calendarType,
}: AssistantConfig): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === language) ?? SUPPORTED_LANGUAGES[0]
  const langInstruction = language && language !== "en"
    ? `\n## Language\nConduct the entire conversation in ${lang.greeting}. Greet the caller in ${lang.greeting} and stay in that language throughout.\n`
    : ""

  const reviewInstruction = reviewUrl
    ? `\n## Review request\nAfter successfully booking an appointment, before ending the call, ask the caller: "Would you like me to send you a link to leave us a review? It only takes a minute and really helps us." If they say yes, use the requestReview tool to send them the link. If they say no, thank them and end the call normally.\n`
    : ""

  return `
You are ${aiName}, a professional and friendly AI receptionist for ${businessName}${businessType ? `, a ${businessType}` : ""}.

${about ? `About this business: ${about}` : ""}
${langInstruction}${reviewInstruction}
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
${buildJobSteps(calendarType)}

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

function buildTools(businessId?: string, appUrl?: string, reviewUrl?: string, calendarType?: string) {
  if (!businessId || !appUrl) return []

  const tools: object[] = [
    {
      type: "function",
      function: {
        name: "checkAvailability",
        description: "Check available appointment slots for a given date",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "The date to check in YYYY-MM-DD format" },
          },
          required: ["date"],
        },
      },
      server: { url: `${appUrl}/api/calendar/availability?businessId=${businessId}` },
    },
  ]

  if (calendarType === "calendly") {
    tools.push({
      type: "function",
      function: {
        name: "sendBookingLink",
        description: "Text the caller a link to confirm and lock in their chosen appointment time",
        parameters: {
          type: "object",
          properties: {
            callerPhone: { type: "string", description: "Phone number to text the booking link to" },
            time: { type: "string", description: "The time slot the caller chose, e.g. 2:00 PM" },
          },
          required: ["callerPhone", "time"],
        },
      },
      server: { url: `${appUrl}/api/calendar/send-link?businessId=${businessId}` },
    })
  } else {
    tools.push({
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
      server: { url: `${appUrl}/api/calendar/book?businessId=${businessId}` },
    })
  }

  if (reviewUrl) {
    tools.push({
      type: "function",
      function: {
        name: "requestReview",
        description: "Send the caller an SMS with a link to leave a review",
        parameters: {
          type: "object",
          properties: {
            callerPhone: { type: "string", description: "Phone number to send the review link to" },
          },
          required: ["callerPhone"],
        },
      },
      server: { url: `${appUrl}/api/review/request?businessId=${businessId}` },
    })
  }

  return tools
}

function buildVoice(voiceId?: string) {
  return { provider: "11labs", voiceId: voiceId || DEFAULT_VOICE_ID }
}

function buildTranscriber(language?: string) {
  return { provider: "deepgram", model: "nova-2", language: language || DEFAULT_LANGUAGE }
}

export async function createVapiAssistant(config: AssistantConfig) {
  const { businessName, aiName, businessId, appUrl, voiceId, language, reviewUrl, calendarType } = config
  const systemPrompt = buildSystemPrompt(config)
  const tools = buildTools(businessId, appUrl, reviewUrl, calendarType)

  const res = await fetch(`${VAPI_BASE}/assistant`, {
    method: "POST",
    headers: { Authorization: `Bearer ${VAPI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `${businessName} — ${aiName}`,
      firstMessage: `Thank you for calling ${businessName}, this is ${aiName} speaking. How can I help you today?`,
      serverUrl: `${appUrl}/api/vapi/webhook`,
      model: { provider: "openai", model: "gpt-4o-mini", systemPrompt, tools },
      voice: buildVoice(voiceId),
      endCallMessage: "Thank you for calling. Have a wonderful day!",
      recordingEnabled: true,
      transcriber: buildTranscriber(language),
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
    headers: { Authorization: `Bearer ${VAPI_API_KEY}`, "Content-Type": "application/json" },
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
  const { businessName, aiName, businessId, appUrl, voiceId, language, reviewUrl, calendarType } = config
  const systemPrompt = buildSystemPrompt(config)
  const tools = buildTools(businessId, appUrl, reviewUrl, calendarType)

  const res = await fetch(`${VAPI_BASE}/assistant/${assistantId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${VAPI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `${businessName} — ${aiName}`,
      firstMessage: `Thank you for calling ${businessName}, this is ${aiName} speaking. How can I help you today?`,
      model: { provider: "openai", model: "gpt-4o-mini", systemPrompt, tools },
      voice: buildVoice(voiceId),
      transcriber: buildTranscriber(language),
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error("Vapi update assistant error:", JSON.stringify(data, null, 2))
    throw new Error(data.message || data.error || JSON.stringify(data))
  }
  return data
}
