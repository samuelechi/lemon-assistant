import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VAPI_API_KEY = process.env.VAPI_API_KEY!
const VAPI_BASE = "https://api.vapi.ai"

// Twilio country codes supported
const COUNTRY_CODES: Record<string, string> = {
    CA: "CA",
    US: "US",
    GB: "GB",
    IE: "IE",
    AU: "AU",
    NZ: "NZ",
}

// Fallback numbers per country if local search fails
const COUNTRY_FALLBACK_CITY: Record<string, string> = {
    CA: "416", // Toronto
    US: "212", // New York
    GB: "",    // UK uses no area code in Twilio search
    IE: "",
    AU: "",
    NZ: "",
}

async function patchVapiAssistant(userId: string, maxDurationSeconds: number) {
    try {
        const { data: business } = await supabase
            .from("businesses")
            .select("vapi_assistant_id")
            .eq("user_id", userId)
            .single()

        if (!business?.vapi_assistant_id) return

        await fetch(`${VAPI_BASE}/assistant/${business.vapi_assistant_id}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${VAPI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ maxDurationSeconds }),
        })

        console.log(`Patched assistant ${business.vapi_assistant_id} → maxDurationSeconds: ${maxDurationSeconds}`)
    } catch (err) {
        console.error("Failed to patch Vapi assistant:", err)
    }
}

async function provisionPhoneNumber(userId: string, country: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!
    const authToken = process.env.TWILIO_AUTH_TOKEN!
    const countryCode = COUNTRY_CODES[country] || "US"
    const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`

    try {
        const { data: business } = await supabase
            .from("businesses")
            .select("id, vapi_assistant_id, phone_number")
            .eq("user_id", userId)
            .single()

        if (!business?.vapi_assistant_id) {
            console.error("No Vapi assistant found for user:", userId)
            return
        }

        if (business.phone_number) {
            console.log("Business already has a phone number, skipping provisioning")
            return
        }

        // Search for available local number in the country
        const searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/${countryCode}/Local.json?SmsEnabled=true&VoiceEnabled=true&Limit=1`
        const searchRes = await fetch(searchUrl, { headers: { Authorization: authHeader } })

        if (!searchRes.ok) throw new Error(`Twilio search failed: ${await searchRes.text()}`)

        const searchData = await searchRes.json()
        let numberToBuy = searchData.available_phone_numbers?.[0]?.phone_number

        // Fallback: try with a major city area code for CA/US
        if (!numberToBuy && COUNTRY_FALLBACK_CITY[countryCode]) {
            const fallbackUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/${countryCode}/Local.json?AreaCode=${COUNTRY_FALLBACK_CITY[countryCode]}&SmsEnabled=true&VoiceEnabled=true&Limit=1`
            const fallbackRes = await fetch(fallbackUrl, { headers: { Authorization: authHeader } })
            const fallbackData = await fallbackRes.json()
            numberToBuy = fallbackData.available_phone_numbers?.[0]?.phone_number
        }

        // Last resort: try US
        if (!numberToBuy) {
            console.log(`No numbers for ${countryCode}, falling back to US`)
            const usRes = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/US/Local.json?SmsEnabled=true&VoiceEnabled=true&Limit=1`,
                { headers: { Authorization: authHeader } }
            )
            const usData = await usRes.json()
            numberToBuy = usData.available_phone_numbers?.[0]?.phone_number
        }

        if (!numberToBuy) throw new Error("No phone numbers available in any region")

        // Purchase the number
        const buyRes = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
            {
                method: "POST",
                headers: { Authorization: authHeader, "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ PhoneNumber: numberToBuy }).toString(),
            }
        )

        if (!buyRes.ok) throw new Error(`Twilio purchase failed: ${await buyRes.text()}`)
        const buyData = await buyRes.json()

        const appUrl = process.env.NEXT_PUBLIC_APP_URL!

        // Import into Vapi and link to assistant
        const importRes = await fetch(`${VAPI_BASE}/phone-number`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${VAPI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                provider: "twilio",
                number: buyData.phone_number,
                twilioAccountSid: accountSid,
                twilioAuthToken: authToken,
                assistantId: business.vapi_assistant_id,
                serverUrl: `${appUrl}/api/vapi/webhook`,
            }),
        })

        if (!importRes.ok) throw new Error(`Vapi import failed: ${await importRes.text()}`)
        const vapiPhone = await importRes.json()

        await supabase.from("businesses").update({
            phone_number: buyData.phone_number,
            vapi_phone_id: vapiPhone.id,
        }).eq("user_id", userId)

        console.log(`Provisioned ${buyData.phone_number} (${countryCode}) for user ${userId}`)
    } catch (err) {
        console.error("Phone provisioning failed:", err)
    }
}

export async function POST(req: NextRequest) {
    const body = await req.text()
    const sig = req.headers.get("stripe-signature")!

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
        console.error("Webhook signature error:", err)
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.userId
                const businessId = session.metadata?.businessId
                const country = session.metadata?.country || "US"
                const type = session.metadata?.type

                if (!userId || !businessId) break

                if (type === "trial_activation") {
                    await provisionPhoneNumber(userId, country)
                    break
                }

                // Subscription upgrade
                const plan = session.metadata?.plan
                const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

                await supabase.from("subscriptions").upsert({
                    user_id: userId,
                    business_id: businessId,
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: subscription.id,
                    plan: plan || "growth",
                    status: "active",
                    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                }, { onConflict: "user_id" })

                await patchVapiAssistant(userId, 600)
                await provisionPhoneNumber(userId, country)
                break
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription
                const { data: sub } = await supabase
                    .from("subscriptions")
                    .select("user_id")
                    .eq("stripe_subscription_id", subscription.id)
                    .single()

                if (!sub) break

                const updatedPlan = subscription.items.data[0]?.price.metadata?.plan || "growth"

                await supabase.from("subscriptions").update({
                    status: subscription.status === "active" ? "active" : "inactive",
                    plan: updatedPlan,
                    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                }).eq("stripe_subscription_id", subscription.id)

                await patchVapiAssistant(sub.user_id, subscription.status === "active" ? 600 : 10)
                break
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription

                const { data: sub } = await supabase
                    .from("subscriptions")
                    .select("user_id")
                    .eq("stripe_subscription_id", subscription.id)
                    .single()

                await supabase.from("subscriptions").update({
                    status: "cancelled",
                }).eq("stripe_subscription_id", subscription.id)

                if (sub?.user_id) {
                    await patchVapiAssistant(sub.user_id, 10)
                }
                break
            }
        }

        return NextResponse.json({ received: true })
    } catch (err) {
        console.error("Webhook error:", err)
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
    }
}