"use client"
import { PhoneOff } from "lucide-react"
import { CallCard } from "../CallCard"
import { EmptyState } from "../EmptyState"

type Call = { id: string; caller_name: string; caller_number: string; reason: string; status: string; urgent: boolean; duration_seconds: number; appointment_booked: boolean; summary: string; transcript: string; created_at: string }

type Props = { isDark: boolean; calls: Call[]; callFilter: string; onFilterChange: (f: string) => void }

export function CallsTab({ isDark, calls, callFilter, onFilterChange }: Props) {
    const filtered = callFilter === "All" ? calls
        : callFilter === "Booked" ? calls.filter(c => c.appointment_booked)
            : callFilter === "Urgent" ? calls.filter(c => c.urgent)
                : calls.filter(c => !c.appointment_booked && !c.urgent)

    return (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm font-sans text-ink-3">{calls.length} total call{calls.length !== 1 ? "s" : ""}</p>
                <div className={`flex gap-1 p-1 rounded-lg ${isDark ? "bg-[#1A1A16]" : "bg-cream-2"}`}>
                    {["All", "Booked", "Urgent", "Missed"].map(f => (
                        <button key={f} onClick={() => onFilterChange(f)}
                            className={`px-3 py-1.5 text-xs font-sans rounded-md transition-all ${callFilter === f
                                ? "bg-gradient-to-r from-gold to-[#A07E00] text-white shadow-[var(--shadow-gold)]"
                                : isDark ? "text-[#6A6A62] hover:text-[#F0EFE8]" : "text-ink-3 hover:text-ink"}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className={`rounded-xl border shadow-[var(--shadow-card)] ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                    <EmptyState isDark={isDark} icon={<PhoneOff size={20} />} title="No calls found" sub="Calls will appear here after your AI answers them." />
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(call => <CallCard key={call.id} call={call} isDark={isDark} />)}
                </div>
            )}
        </div>
    )
}