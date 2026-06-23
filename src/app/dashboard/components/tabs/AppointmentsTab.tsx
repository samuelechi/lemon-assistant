"use client"
import { Calendar } from "lucide-react"
import { EmptyState } from "../EmptyState"
import { StatusBadge } from "../StatusBadge"

type Appointment = { id: string; caller_name: string; caller_phone: string; type: string; date: string; time: string; status: string; created_at: string }

function getDateParts(dateStr: string): { month: string; day: string } {
    const d = new Date(dateStr)
    return {
        month: d.toLocaleString("en-CA", { month: "short" }).toUpperCase(),
        day: String(d.getDate()),
    }
}

function formatTime(timeStr: string): string {
    if (!timeStr) return ""
    const [h, m] = timeStr.split(":")
    const hour = parseInt(h)
    const ampm = hour >= 12 ? "PM" : "AM"
    const display = hour % 12 || 12
    return `${display}:${m} ${ampm}`
}

type Props = { isDark: boolean; appointments: Appointment[] }

export function AppointmentsTab({ isDark, appointments }: Props) {
    return (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
            <p className="text-sm font-sans text-ink-3">{appointments.length} upcoming appointment{appointments.length !== 1 ? "s" : ""}</p>

            {appointments.length === 0 ? (
                <div className={`rounded-xl border ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                    <EmptyState isDark={isDark} icon={<Calendar size={20} />} title="No appointments yet" sub="When your AI books appointments they'll appear here." />
                </div>
            ) : (
                <div className={`rounded-xl border overflow-hidden ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                    {appointments.map((apt, i) => {
                        const { month, day } = getDateParts(apt.date)
                        return (
                            <div key={apt.id}
                                className={`px-5 py-4 flex items-center gap-4 transition-colors ${isDark ? "hover:bg-[#0F0F0D]" : "hover:bg-cream"} ${i < appointments.length - 1 ? `border-b ${isDark ? "border-[#2A2A26]" : "border-border"}` : ""}`}>

                                {/* Date chip */}
                                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isDark ? "bg-[#0F0F0D]" : "bg-gold-pale"}`}>
                                    <span className="text-2xs font-sans font-600 text-gold leading-none tracking-wider">{month}</span>
                                    <span className={`font-serif text-xl leading-tight ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{day}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{apt.caller_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <span className={`text-xs font-sans ${isDark ? "text-[#6A6A62]" : "text-ink-3"}`}>{apt.type}</span>
                                        <span className="text-ink-3">·</span>
                                        <span className={`text-xs font-sans ${isDark ? "text-[#6A6A62]" : "text-ink-3"}`}>{formatTime(apt.time)}</span>
                                        {apt.caller_phone && (
                                            <>
                                                <span className="text-ink-3">·</span>
                                                <span className={`text-xs font-sans ${isDark ? "text-[#6A6A62]" : "text-ink-3"}`}>{apt.caller_phone}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <StatusBadge status={apt.status} />
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}