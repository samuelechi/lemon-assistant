"use client"
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
                    {[
                        { id: "google", label: "Google Calendar", icon: "🗓️", desc: "Bookings appear automatically in Google Calendar" },
                        { id: "builtin", label: "Built-in calendar", icon: "⚡", desc: "View all bookings inside LemonAssistant dashboard" },
                    ].map(cal => (
                        <div key={cal.id} className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                            <span className="text-2xl">{cal.icon}</span>
                            <div className="flex-1">
                                <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{cal.label}</p>
                                <p className="text-2xs text-ink-3 font-sans mt-0.5">{cal.desc}</p>
                            </div>
                            {cal.id === "google" ? (
                                <a href="/api/auth/google">
                                    <Button variant={business?.calendar_type === "google" ? "gold" : "outline"} size="sm">
                                        {business?.calendar_type === "google" ? "Connected ✓" : "Connect"}
                                    </Button>
                                </a>
                            ) : (
                                <Button variant={business?.calendar_type === "builtin" ? "gold" : "secondary"} size="sm"
                                    onClick={business?.calendar_type !== "builtin" ? onSwitchToBuiltin : undefined}
                                    disabled={saving || business?.calendar_type === "builtin"}>
                                    {business?.calendar_type === "builtin" ? "Active" : "Use this"}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}