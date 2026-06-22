export function EmptyState({ icon, title, sub, isDark }: {
    icon: React.ReactNode; title: string; sub: string; isDark: boolean
}) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isDark ? "bg-[#2A2A26] text-[#444440]" : "bg-cream-2 text-ink-3"}`}>
                {icon}
            </div>
            <p className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{title}</p>
            <p className="text-xs font-sans text-ink-3 max-w-xs leading-relaxed">{sub}</p>
        </div>
    )
}