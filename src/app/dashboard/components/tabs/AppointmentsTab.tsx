"use client"
import { Calendar } from "lucide-react"
import { EmptyState } from "../EmptyState"
import { StatusBadge } from "../StatusBadge"

type Appointment = { id: string; caller_name: string; caller_phone: string; type: string; date: string; time: string; status: string; created_at: string }

function formatDate(dateStr: string): string {
    const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    const date = new Date(dateStr)
    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"
    return date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })
}

type Props = { isDark: boolean; appointments: Appointment[] }

export function AppointmentsTab({ isDark, appointments }: Props) {
    return (
        <div className="space-y-6 animate-[fadeIn_0.3s_ease]">
            <p className="text-sm font-sans text-ink-3">{appointments.length} upcoming appointment{appointments.length !== 1 ? "s" : ""}</p>
            <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                {appointments.length === 0 ? (
                    <EmptyState isDark={isDark} icon={<Calendar size={20} />} title="No appointments yet" sub="When your AI books appointments they'll appear here with all the details." />
                ) : (
                    appointments.map((apt, i) => (
                        <div key={apt.id} className={`px-6 py-4 flex items-center gap-4 transition-colors ${isDark ? "hover:bg-[#0F0F0D]" : "hover:bg-cream"} ${i < appointments.length - 1 ? `border-b ${isDark ? "border-[#2A2A26]" : "border-border"}` : ""}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-[#2A2A26]" : "bg-gold-pale"}`}>
                                <Calendar size={16} className="text-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-sans font-500 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{apt.caller_name}</p>
                                <p className="text-xs font-sans text-ink-3">
                                    {apt.type} · {formatDate(apt.date)} at {apt.time}{apt.caller_phone && ` · ${apt.caller_phone}`}
                                </p>
                            </div>
                            <StatusBadge status={apt.status} />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}