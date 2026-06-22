export function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; color: string }> = {
        booked: { label: "Booked", color: "bg-green-50 text-green-700 border-green-200" },
        urgent: { label: "Urgent", color: "bg-red-50 text-red-700 border-red-200" },
        textback: { label: "Text sent", color: "bg-blue-50 text-blue-700 border-blue-200" },
        completed: { label: "Completed", color: "bg-cream-2 text-ink-3 border-border" },
        info: { label: "Info only", color: "bg-cream-2 text-ink-3 border-border" },
        cancelled: { label: "Cancelled", color: "bg-cream-2 text-ink-3 border-border" },
        confirmed: { label: "Confirmed", color: "bg-green-50 text-green-700 border-green-200" },
        pending: { label: "Pending", color: "bg-gold-pale text-gold-dark border-gold-light" },
    }
    const s = map[status] || map.completed
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-sans font-500 border ${s.color}`}>
            {s.label}
        </span>
    )
}