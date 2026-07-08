"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"

type Availability = { day: string; start: string; end: string; active: boolean }
type Business = { calendar_type: string }

type Props = {
    isDark: boolean; business: Business | null; saving: boolean
    availability: Availability[]; blockDate: string; blockReason: string
    blockedDates: { id: string; date: string; reason: string }[]
    onAvailabilityChange: (updated: Availability[]) => void
    onBlockDateChange: (val: string) => void
    onBlockReasonChange: (val: string) => void
    onSaveAvailability: () => void
    onBlockDate: () => void
    onRemoveBlockedDate: (id: string) => void
    onSwitchToBuiltin: () => void
}

// ─── Calendly Connect ──────────────────────────────────────────────────────
// Calendly can't auto-book (see src/lib/calendly.ts), so this only collects
// a Personal Access Token + which event type to check availability against.
// The AI texts callers a link to confirm — it never books directly for them.

type CalendlyEventType = { uri: string; name: string; durationMinutes: number; schedulingUrl: string }

function CalendlyConnect({ isDark, isActive, saving }: { isDark: boolean; isActive: boolean; saving: boolean }) {
    const [expanded, setExpanded] = useState(false)
    const [token, setToken] = useState("")
    const [eventTypes, setEventTypes] = useState<CalendlyEventType[] | null>(null)
    const [selectedUri, setSelectedUri] = useState("")
    const [step, setStep] = useState<"token" | "pick" | "done">("token")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const inputCls = `w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`

    async function handleVerify() {
        if (!token.trim()) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/calendly/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: token.trim() }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Failed to verify token")
                return
            }
            setEventTypes(data.eventTypes)
            setStep("pick")
        } catch {
            setError("Failed to reach Calendly. Try again.")
        } finally {
            setLoading(false)
        }
    }

    async function handleConnect() {
        if (!selectedUri) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/calendly/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: token.trim(), eventTypeUri: selectedUri }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Failed to connect Calendly")
                return
            }
            setStep("done")
        } catch {
            setError("Something went wrong. Try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`flex flex-col gap-4 px-5 py-4 rounded-xl border ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
            <div className="flex items-center gap-4">
                <span className="text-2xl">📅</span>
                <div className="flex-1">
                    <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Calendly</p>
                    <p className="text-2xs text-ink-3 font-sans mt-0.5">
                        AI checks availability, then texts the caller a link to confirm their spot
                    </p>
                </div>
                <Button
                    variant={isActive ? "gold" : "outline"}
                    size="sm"
                    onClick={() => setExpanded(v => !v)}
                    disabled={saving}
                >
                    {isActive ? "Connected ✓" : expanded ? "Cancel" : "Connect"}
                </Button>
            </div>

            {expanded && !isActive && (
                <div className={`rounded-lg p-4 ${isDark ? "bg-[#0F0F0D]" : "bg-cream"}`}>
                    {step === "token" && (
                        <>
                            <label className="block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase">
                                Calendly Personal Access Token
                            </label>
                            <input
                                type="password"
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                placeholder="Paste your token here"
                                className={inputCls}
                            />
                            <p className="text-2xs text-ink-3 font-sans mt-1.5">
                                Found in Calendly under Integrations → API & Webhooks → Personal Access Tokens.
                                Requires a paid Calendly plan.
                            </p>
                            {error && <p className="text-2xs text-red-500 font-sans mt-2">{error}</p>}
                            <Button variant="gold" size="sm" className="mt-4" disabled={loading || !token.trim()} onClick={handleVerify}>
                                {loading ? "Verifying..." : "Continue"}
                            </Button>
                        </>
                    )}

                    {step === "pick" && eventTypes && (
                        <>
                            <label className="block text-2xs font-sans font-500 text-ink-3 mb-2 tracking-[0.1em] uppercase">
                                Which event type should your AI book against?
                            </label>
                            <div className="space-y-2 mb-4">
                                {eventTypes.map(et => (
                                    <div
                                        key={et.uri}
                                        onClick={() => setSelectedUri(et.uri)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedUri === et.uri
                                            ? "border-gold bg-gold-pale"
                                            : isDark ? "border-[#2A2A26]" : "border-border"}`}
                                    >
                                        <p className={`text-xs font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{et.name}</p>
                                        <p className="text-2xs font-sans text-ink-3">{et.durationMinutes} minutes</p>
                                    </div>
                                ))}
                            </div>
                            {error && <p className="text-2xs text-red-500 font-sans mb-2">{error}</p>}
                            <Button variant="gold" size="sm" disabled={loading || !selectedUri} onClick={handleConnect}>
                                {loading ? "Connecting..." : "Connect Calendly"}
                            </Button>
                        </>
                    )}

                    {step === "done" && (
                        <p className="text-xs font-sans text-green-600">
                            Connected! Refresh the page to see it reflected everywhere.
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

export function CalendarTab({
    isDark, business, saving, availability, blockDate, blockReason, blockedDates,
    onAvailabilityChange, onBlockDateChange, onBlockReasonChange,
    onSaveAvailability, onBlockDate, onRemoveBlockedDate, onSwitchToBuiltin
}: Props) {
    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease] max-w-2xl">
            <div className={`rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Your availability</h3>
                <p className="text-xs font-sans text-ink-3 mb-6">Set when your AI can book appointments.</p>
                <div className="space-y-3">
                    {availability.map((a, i) => (
                        <div key={a.day} className={`p-4 rounded-lg border ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                            <div className="flex items-center justify-between mb-3">
                                <p className={`text-xs font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{a.day}</p>
                                <button
                                    onClick={() => onAvailabilityChange(availability.map((d, j) => j === i ? { ...d, active: !d.active } : d))}
                                    className={`flex-shrink-0 w-10 h-5 rounded-full transition-colors ${a.active ? "bg-gold" : isDark ? "bg-[#2A2A26]" : "bg-cream-2"}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${a.active ? "translate-x-5" : "translate-x-0"}`} />
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="time" value={a.start} onChange={e => onAvailabilityChange(availability.map((d, j) => j === i ? { ...d, start: e.target.value } : d))} disabled={!a.active} className={`flex-1 min-w-0 px-3 py-1.5 text-xs font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors disabled:opacity-40 ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`} />
                                <span className="text-ink-3 text-xs flex-shrink-0">→</span>
                                <input type="time" value={a.end} onChange={e => onAvailabilityChange(availability.map((d, j) => j === i ? { ...d, end: e.target.value } : d))} disabled={!a.active} className={`flex-1 min-w-0 px-3 py-1.5 text-xs font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors disabled:opacity-40 ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`} />
                            </div>
                        </div>
                    ))}
                </div>
                <Button variant="gold" size="sm" className="mt-6" disabled={saving} onClick={onSaveAvailability}>
                    {saving ? "Saving..." : "Save availability"}
                </Button>
            </div>

            <div className={`rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Block dates</h3>
                <p className="text-xs font-sans text-ink-3 mb-5">Add holidays or days off — the AI won&apos;t book these dates.</p>
                <div className="flex gap-3 flex-wrap mb-4">
                    <input type="date" value={blockDate} onChange={e => onBlockDateChange(e.target.value)}
                        className={`flex-1 min-w-32 px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8]" : "bg-white border-border text-ink"}`} />
                    <input type="text" placeholder="Reason (optional)" value={blockReason} onChange={e => onBlockReasonChange(e.target.value)}
                        className={`flex-1 min-w-32 px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`} />
                    <Button variant="gold" size="sm" onClick={onBlockDate} disabled={saving || !blockDate}>Block</Button>
                </div>
                {blockedDates.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-2xs font-sans text-ink-3 uppercase tracking-wider mb-2">Blocked dates</p>
                        {blockedDates.map(b => (
                            <div key={b.id} className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${isDark ? "border-[#2A2A26] bg-[#0F0F0D]" : "border-border bg-cream"}`}>
                                <div>
                                    <p className={`text-xs font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{b.date}</p>
                                    {b.reason && <p className="text-2xs font-sans text-ink-3">{b.reason}</p>}
                                </div>
                                <button onClick={() => onRemoveBlockedDate(b.id)} className="text-ink-3 hover:text-red-500 transition-colors text-lg leading-none">×</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={`rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                <h3 className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Calendar connection</h3>
                <p className="text-xs font-sans text-ink-3 mb-5">Connect your calendar so appointments sync automatically.</p>
                <div className="space-y-3">
                    {/* Built-in calendar */}
                    <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                        <span className="text-2xl">⚡</span>
                        <div className="flex-1">
                            <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Built-in calendar</p>
                            <p className="text-2xs text-ink-3 font-sans mt-0.5">View all bookings inside LemonAssistant dashboard</p>
                        </div>
                        <Button variant={business?.calendar_type === "builtin" ? "gold" : "secondary"} size="sm"
                            onClick={business?.calendar_type !== "builtin" ? onSwitchToBuiltin : undefined}
                            disabled={saving || business?.calendar_type === "builtin"}>
                            {business?.calendar_type === "builtin" ? "Active" : "Use this"}
                        </Button>
                    </div>

                    {/* Google Calendar — now live */}
                    <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                        <span className="text-2xl">🗓️</span>
                        <div className="flex-1">
                            <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Google Calendar</p>
                            <p className="text-2xs text-ink-3 font-sans mt-0.5">Bookings appear automatically in Google Calendar</p>
                        </div>
                        <a href="/api/auth/google">
                            <Button variant={business?.calendar_type === "google" ? "gold" : "outline"} size="sm">
                                {business?.calendar_type === "google" ? "Connected ✓" : "Connect"}
                            </Button>
                        </a>
                    </div>

                    {/* Calendly — new */}
                    <CalendlyConnect isDark={isDark} isActive={business?.calendar_type === "calendly"} saving={saving} />
                </div>
            </div>
        </div>
    )
}