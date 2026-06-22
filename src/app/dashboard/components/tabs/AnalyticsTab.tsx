"use client"
import { Phone, CheckCircle2, Clock, Zap, BarChart3 } from "lucide-react"
import { StatCard } from "../StatCard"
import { EmptyState } from "../EmptyState"

type Call = { id: string; appointment_booked: boolean; urgent: boolean; duration_seconds: number; created_at: string }
type Business = { phone_number: string | null }

type Props = {
    isDark: boolean; calls: Call[]; business: Business | null
    minutesUsed: number; bookingRate: number
}

export function AnalyticsTab({ isDark, calls, business, minutesUsed, bookingRate }: Props) {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const weekData = weekDays.map((day, i) => {
        const d = new Date(); d.setDate(d.getDate() - d.getDay() + i)
        const dateStr = d.toISOString().split("T")[0]
        return { day, calls: calls.filter(c => c.created_at?.startsWith(dateStr)).length }
    })
    const maxCalls = Math.max(...weekData.map(d => d.calls), 1)

    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard isDark={isDark} icon={<Phone size={16} />} label="Total calls" value={String(calls.length)} sub="All time" accent />
                <StatCard isDark={isDark} icon={<CheckCircle2 size={16} />} label="Bookings" value={String(calls.filter(c => c.appointment_booked).length)} sub={`${bookingRate}% booking rate`} />
                <StatCard isDark={isDark} icon={<Clock size={16} />} label="Minutes used" value={String(minutesUsed)} sub="All time" />
                <StatCard isDark={isDark} icon={<Zap size={16} />} label="Urgent calls" value={String(calls.filter(c => c.urgent).length)} sub="Flagged as urgent" />
            </div>

            <div className={`rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                <h3 className={`font-serif text-lg mb-6 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Calls this week</h3>
                {calls.length === 0 ? (
                    <EmptyState isDark={isDark} icon={<BarChart3 size={20} />} title="No data yet" sub="Call analytics will appear here once calls start coming in." />
                ) : (
                    <div className="flex items-end gap-3 h-40">
                        {weekData.map(d => (
                            <div key={d.day} className="group flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <span className={`text-2xs font-sans font-600 text-gold transition-opacity ${d.calls > 0 ? "opacity-0 group-hover:opacity-100" : "opacity-0"}`}>{d.calls}</span>
                                <div className="w-full bg-gradient-to-t from-[#A07E00] via-gold to-[#E6BE2E] rounded-t-md transition-all duration-500 group-hover:brightness-110 shadow-[0_2px_8px_-2px_rgba(196,154,0,0.4)]"
                                    style={{ height: d.calls > 0 ? `${(d.calls / maxCalls) * 100}%` : "4px", opacity: d.calls > 0 ? 0.7 + (d.calls / maxCalls) * 0.3 : 0.2 }} />
                                <span className="text-2xs font-sans text-ink-3">{d.day}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                    <h3 className={`font-serif text-lg mb-4 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Call outcomes</h3>
                    {calls.length === 0 ? <p className="text-xs font-sans text-ink-3">No data yet</p> : (
                        [
                            ["Appointment booked", calls.filter(c => c.appointment_booked).length, "bg-green-400"],
                            ["Urgent", calls.filter(c => c.urgent).length, "bg-red-400"],
                            ["Info only", calls.filter(c => !c.appointment_booked && !c.urgent).length, "bg-gold"],
                        ].map(([l, count, c]) => {
                            const pct = Math.round((Number(count) / calls.length) * 100)
                            return (
                                <div key={String(l)} className="flex items-center gap-3 mb-3">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c}`} />
                                    <span className="text-xs font-sans text-ink-3 flex-1">{l}</span>
                                    <span className="text-xs font-sans text-ink-3">{count} ({pct}%)</span>
                                </div>
                            )
                        })
                    )}
                </div>
                <div className={`rounded-xl border p-6 shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                    <h3 className={`font-serif text-lg mb-4 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Your number</h3>
                    <div className={`rounded-lg p-4 ${isDark ? "bg-[#0F0F0D]" : "bg-cream"} border ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                        <p className="text-2xs font-sans text-ink-3 uppercase tracking-widest mb-1">LemonAssistant number</p>
                        <p className={`font-serif text-2xl ${business?.phone_number ? "text-gold" : "text-ink-3"}`}>
                            {business?.phone_number || "Not assigned yet"}
                        </p>
                        <p className="text-2xs font-sans text-ink-3 mt-1">Forward your business number to this</p>
                    </div>
                </div>
            </div>
        </div>
    )
}