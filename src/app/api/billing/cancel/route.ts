import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-05-27.dahlia",
});

// POST /api/billing/cancel
// body: { action: "cancel" | "pause" | "downgrade", reason?: string, feedback?: string }
export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { action, reason, feedback } = await req.json();

        // Get the subscription tied to this user
        const { data: subscription, error: subError } = await supabase
            .from("subscriptions")
            .select("id, business_id, stripe_subscription_id")
            .eq("user_id", user.id)
            .single();

        if (subError || !subscription?.stripe_subscription_id) {
            return NextResponse.json(
                { error: "No active subscription found" },
                { status: 404 }
            );
        }

        const subscriptionId = subscription.stripe_subscription_id;

        if (action === "cancel") {
            const updated = await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
                cancellation_details: {
                    comment: feedback || undefined,
                    feedback: mapReasonToStripeFeedback(reason),
                },
            });

            // Log the cancellation reason for your own records
            await supabase.from("cancellations").insert({
                business_id: subscription.business_id,
                reason: reason || null,
                feedback: feedback || null,
                created_at: new Date().toISOString(),
            });

            return NextResponse.json({
                status: "scheduled_for_cancellation",
                current_period_end: updated.items.data[0]?.current_period_end
                    ? new Date(updated.items.data[0].current_period_end * 1000).toISOString()
                    : null,
            });
        }

        if (action === "pause") {
            // Pauses billing, keeps subscription alive, no access during pause
            await stripe.subscriptions.update(subscriptionId, {
                pause_collection: {
                    behavior: "void",
                    resumes_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
                },
            });

            return NextResponse.json({ status: "paused", resumes_in_days: 30 });
        }

        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    } catch (err) {
        console.error("Billing cancel error:", err);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}

// GET /api/billing/cancel — undo a scheduled cancellation
export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { data: subscription } = await supabase
            .from("subscriptions")
            .select("stripe_subscription_id")
            .eq("user_id", user.id)
            .single();

        if (!subscription?.stripe_subscription_id) {
            return NextResponse.json({ error: "No subscription found" }, { status: 404 });
        }

        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: false,
        });

        return NextResponse.json({ status: "cancellation_reversed" });
    } catch (err) {
        console.error("Billing reactivate error:", err);
        return NextResponse.json({ error: "Failed to reactivate" }, { status: 500 });
    }
}

function mapReasonToStripeFeedback(
    reason?: string
): Stripe.SubscriptionUpdateParams.CancellationDetails.Feedback | undefined {
    const map: Record<string, Stripe.SubscriptionUpdateParams.CancellationDetails.Feedback> = {
        too_expensive: "too_expensive",
        missing_features: "missing_features",
        not_using: "unused",
        switched: "switched_service",
        other: "other",
    };
    return reason ? map[reason] : undefined;
}