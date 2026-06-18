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
                const plan = session.metadata?.plan

                if (!userId || !businessId) break

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

                // FIX: Read plan from price metadata so upgrades via the
                // Stripe portal are synced correctly. Falls back to "growth"
                // only if metadata wasn't set — which it now is on both prices.
                const updatedPlan =
                    subscription.items.data[0]?.price.metadata?.plan || "growth"

                await supabase.from("subscriptions").update({
                    status: subscription.status === "active" ? "active" : "inactive",
                    plan: updatedPlan,
                    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                }).eq("stripe_subscription_id", subscription.id)

                await patchVapiAssistant(
                    sub.user_id,
                    subscription.status === "active" ? 600 : 10
                )
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