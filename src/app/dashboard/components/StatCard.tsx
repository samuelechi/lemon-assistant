type StatCardProps = {
    icon: React.ReactNode
    label: string
    value: string
    sub?: string
    accent?: boolean
    isDark: boolean
}

export function StatCard({ icon, label, value, sub, accent, isDark }: StatCardProps) {
    return (
        <div className={`lift rounded-xl border p-5 ${accent
            ? "bg-gradient-to-br from-[#E0B400] via-gold to-[#A07E00] border-gold-light shadow-[var(--shadow-gold)]"
            : isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${accent
                ? "bg-white/20 text-white"
                : isDark ? "bg-[#2A2A26] text-gold" : "bg-gold-pale text-gold"}`}>
                {icon}
            </div>
            <div className={`font-serif text-3xl mb-1 ${accent ? "text-white" : isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                {value}
            </div>
            <div className={`text-xs font-sans font-500 ${accent ? "text-white/80" : isDark ? "text-[#F0EFE8]" : "text-ink"}`}>
                {label}
            </div>
            {sub && (
                <div className={`text-2xs font-sans mt-1 ${accent ? "text-white/60" : "text-ink-3"}`}>{sub}</div>
            )}
        </div>
    )
}