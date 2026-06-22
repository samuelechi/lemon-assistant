"use client"
import {
    LayoutDashboard, Phone, Calendar, BarChart3,
    Settings, CreditCard, Sun, Moon, LogOut, X, AlertTriangle
} from "lucide-react"
import { Logo } from "@/components/ui/Logo"

const NAV_ITEMS = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
    { id: "calls", label: "Call log", icon: <Phone size={16} /> },
    { id: "appointments", label: "Appointments", icon: <Calendar size={16} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
    { id: "calendar", label: "Calendar", icon: <Calendar size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
    { id: "billing", label: "Billing", icon: <CreditCard size={16} /> },
]

type SidebarProps = {
    active: string
    isDark: boolean
    mounted: boolean
    sidebarOpen: boolean
    business: { name: string; ai_name: string; vapi_assistant_id: string | null } | null
    urgentCount: number
    onNav: (id: string) => void
    onClose: () => void
    onToggleTheme: () => void
    onLogout: () => void
}

export function Sidebar({
    active, isDark, mounted, sidebarOpen, business, urgentCount,
    onNav, onClose, onToggleTheme, onLogout
}: SidebarProps) {
    return (
        <aside className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col border-r transition-transform duration-300 md:translate-x-0 md:static md:z-auto shadow-[6px_0_30px_-18px_rgba(15,15,13,0.4)] ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isDark ? "bg-[#0F0F0D] border-[#1A1A16]" : "bg-white border-border"}`}>

            <div className={`px-6 py-5 border-b ${isDark ? "border-[#1A1A16]" : "border-border"}`}>
                <div className="flex items-center justify-between">
                    <Logo variant={isDark ? "dark" : "white"} size="sm" />
                    <button className="md:hidden text-ink-3" onClick={onClose}><X size={18} /></button>
                </div>
            </div>

            {business && (
                <div className={`px-6 py-4 border-b ${isDark ? "border-[#1A1A16]" : "border-border"}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#E0B400] to-[#A07E00] rounded-lg flex items-center justify-center shadow-[var(--shadow-gold)] text-xs font-sans font-600 text-ink flex-shrink-0">
                            {business.name.charAt(0)}
                        </div>
                        <div>
                            <p className={`text-xs font-sans font-500 truncate ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>{business.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${business.vapi_assistant_id ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
                                <p className="text-2xs font-sans text-ink-3">
                                    {business.vapi_assistant_id ? `${business.ai_name} is live` : "Setup incomplete"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.id}
                        onClick={() => { onNav(item.id); onClose() }}
                        className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-all duration-200 text-left ${active === item.id
                            ? "bg-gradient-to-r from-gold to-[#A07E00] text-white font-500 shadow-[var(--shadow-gold)]"
                            : isDark
                                ? "text-[#6A6A62] hover:bg-[#1A1A16] hover:text-[#F0EFE8] hover:translate-x-0.5"
                                : "text-ink-3 hover:bg-cream hover:text-ink hover:translate-x-0.5"}`}
                    >
                        {item.icon}
                        {item.label}
                        {item.id === "calls" && urgentCount > 0 && (
                            <span className="ml-auto w-5 h-5 bg-red-500 text-white text-2xs rounded-full flex items-center justify-center font-500">
                                {urgentCount}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            <div className={`px-3 py-4 border-t space-y-1 ${isDark ? "border-[#1A1A16]" : "border-border"}`}>
                {mounted && (
                    <button
                        onClick={onToggleTheme}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-all duration-150 ${isDark ? "text-[#6A6A62] hover:bg-[#1A1A16] hover:text-[#F0EFE8]" : "text-ink-3 hover:bg-cream hover:text-ink"}`}
                    >
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                        {isDark ? "Light mode" : "Dark mode"}
                    </button>
                )}
                <button
                    onClick={onLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-all duration-150 ${isDark ? "text-[#6A6A62] hover:bg-[#1A1A16] hover:text-red-400" : "text-ink-3 hover:bg-cream hover:text-red-500"}`}
                >
                    <LogOut size={16} />
                    Sign out
                </button>
            </div>
        </aside>
    )
}