"use client";

import { useState } from "react";

type Step = "reason" | "offer" | "confirm" | "done";

const REASONS = [
    { value: "too_expensive", label: "It's too expensive" },
    { value: "missing_features", label: "Missing a feature I need" },
    { value: "not_using", label: "I'm not using it enough" },
    { value: "switched", label: "Switched to another tool" },
    { value: "other", label: "Other" },
];

export default function CancelFlow({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState<Step>("reason");
    const [reason, setReason] = useState<string>("");
    const [feedback, setFeedback] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [periodEnd, setPeriodEnd] = useState<string | null>(null);

    async function handlePause() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/billing/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "pause" }),
            });
            if (!res.ok) throw new Error("Failed to pause");
            setStep("done");
        } catch {
            setError("Something went wrong pausing your account. Try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/billing/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "cancel", reason, feedback }),
            });
            if (!res.ok) throw new Error("Failed to cancel");
            const data = await res.json();
            setPeriodEnd(data.current_period_end);
            setStep("done");
        } catch {
            setError("Something went wrong canceling. Try again or contact support.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-lg bg-[var(--color-cream,#FAFAF5)] p-6 shadow-lg">
                {step === "reason" && (
                    <>
                        <h2 className="mb-2 font-serif text-xl text-[#0F0F0D]">
                            Before you go
                        </h2>
                        <p className="mb-4 text-sm text-[#0F0F0D]/70">
                            Mind telling us why you're canceling? It helps us improve.
                        </p>
                        <div className="mb-4 space-y-2">
                            {REASONS.map((r) => (
                                <label
                                    key={r.value}
                                    className="flex items-center gap-2 text-sm text-[#0F0F0D]"
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={r.value}
                                        checked={reason === r.value}
                                        onChange={() => setReason(r.value)}
                                    />
                                    {r.label}
                                </label>
                            ))}
                        </div>
                        <textarea
                            className="mb-4 w-full rounded border border-[#0F0F0D]/20 p-2 text-sm"
                            placeholder="Anything else? (optional)"
                            rows={2}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                        <div className="flex justify-between">
                            <button onClick={onClose} className="text-sm text-[#0F0F0D]/60">
                                Never mind
                            </button>
                            <button
                                disabled={!reason}
                                onClick={() => setStep("offer")}
                                className="rounded bg-[#C49A00] px-4 py-2 text-sm text-white disabled:opacity-40"
                            >
                                Continue
                            </button>
                        </div>
                    </>
                )}

                {step === "offer" && (
                    <>
                        <h2 className="mb-2 font-serif text-xl text-[#0F0F0D]">
                            Want to pause instead?
                        </h2>
                        <p className="mb-4 text-sm text-[#0F0F0D]/70">
                            You can pause billing for 30 days — no charges, and your setup,
                            call history, and number stay intact. You can resume anytime.
                        </p>
                        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handlePause}
                                disabled={loading}
                                className="rounded bg-[#C49A00] px-4 py-2 text-sm text-white disabled:opacity-60"
                            >
                                {loading ? "Pausing..." : "Pause for 30 days"}
                            </button>
                            <button
                                onClick={() => setStep("confirm")}
                                disabled={loading}
                                className="rounded border border-[#0F0F0D]/20 px-4 py-2 text-sm text-[#0F0F0D]"
                            >
                                No thanks, cancel anyway
                            </button>
                            <button
                                onClick={onClose}
                                className="text-sm text-[#0F0F0D]/60"
                            >
                                Never mind
                            </button>
                        </div>
                    </>
                )}

                {step === "confirm" && (
                    <>
                        <h2 className="mb-2 font-serif text-xl text-[#0F0F0D]">
                            Confirm cancellation
                        </h2>
                        <p className="mb-4 text-sm text-[#0F0F0D]/70">
                            Your subscription will stay active until the end of your
                            current billing period. After that, your AI receptionist and
                            phone number will stop working.
                        </p>
                        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                        <div className="flex justify-between">
                            <button
                                onClick={() => setStep("offer")}
                                disabled={loading}
                                className="text-sm text-[#0F0F0D]/60"
                            >
                                Go back
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-60"
                            >
                                {loading ? "Canceling..." : "Confirm cancellation"}
                            </button>
                        </div>
                    </>
                )}

                {step === "done" && (
                    <>
                        <h2 className="mb-2 font-serif text-xl text-[#0F0F0D]">
                            {periodEnd ? "Cancellation scheduled" : "You're paused"}
                        </h2>
                        <p className="mb-4 text-sm text-[#0F0F0D]/70">
                            {periodEnd
                                ? `Your plan stays active until ${new Date(
                                    periodEnd
                                ).toLocaleDateString()}. You can reactivate anytime before then from Settings.`
                                : "Billing is paused for 30 days. You can resume anytime from Settings."}
                        </p>
                        <button
                            onClick={onClose}
                            className="rounded bg-[#0F0F0D] px-4 py-2 text-sm text-white"
                        >
                            Close
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}