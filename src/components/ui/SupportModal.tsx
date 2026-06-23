"use client"
import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
    isOpen: boolean
    onClose: () => void
    isDark?: boolean
    prefillEmail?: string
}

export function SupportModal({ isOpen, onClose, isDark = false, prefillEmail = "" }: Props) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState(prefillEmail)
    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const inputCls = `w-full px-4 py-2.5 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`
    const labelCls = "block text-2xs font-sans font-500 text-ink-3 mb-1.5 tracking-[0.1em] uppercase"

    async function handleSubmit() {
        if (!name.trim() || !email.trim() || !message.trim()) {
            setError("Please fill in all fields.")
            return
        }
        setSending(true)
        setError(null)
        try {
            const res = await fetch("/api/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message }),
            })
            const data = await res.json()
            if (res.ok) {
                setSent(true)
            } else {
                setError(data.error || "Failed to send. Try again.")
            }
        } catch {
            setError("Something went wrong. Try again.")
        }
        setSending(false)
    }

    function handleClose() {
        onClose()
        setTimeout(() => {
            setName("")
            setEmail(prefillEmail)
            setMessage("")
            setSent(false)
            setError(null)
        }, 300)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className={`relative w-full max-w-md rounded-2xl border shadow-xl z-10 ${isDark ? "bg-[#1A1A16] border-[#2A2A26]" : "bg-white border-border"}`}>
                <div className={`flex items-center justify-between px-6 py-5 border-b ${isDark ? "border-[#2A2A26]" : "border-border"}`}>
                    <h2 className={`font-serif text-xl ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Contact support</h2>
                    <button onClick={handleClose} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? "hover:bg-[#2A2A26] text-[#6A6A62]" : "hover:bg-cream text-ink-3"}`}>
                        <X size={16} />
                    </button>
                </div>

                <div className="px-6 py-6">
                    {sent ? (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">✓</span>
                            </div>
                            <p className={`font-serif text-lg mb-1 ${isDark ? "text-[#F0EFE8]" : "text-ink"}`}>Message sent</p>
                            <p className="text-xs font-sans text-ink-3 mb-6">We'll get back to you within 24 hours.</p>
                            <Button variant="gold" size="sm" onClick={handleClose}>Done</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Your name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)}
                                    placeholder="Jane Smith" className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="jane@example.com" className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>What can we help with?</label>
                                <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)}
                                    placeholder="Describe your issue..."
                                    className={`w-full px-4 py-3 text-sm font-sans border rounded-lg focus:outline-none focus:border-gold transition-colors resize-none leading-relaxed ${isDark ? "bg-[#0F0F0D] border-[#2A2A26] text-[#F0EFE8] placeholder:text-[#444440]" : "bg-white border-border text-ink placeholder:text-ink-3"}`} />
                            </div>
                            {error && <p className="text-xs font-sans text-red-500">{error}</p>}
                            <Button variant="gold" size="sm" className="w-full" disabled={sending} onClick={handleSubmit}>
                                {sending ? "Sending..." : "Send message"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}