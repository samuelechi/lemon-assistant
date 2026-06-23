"use client"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X, MessageCircle, Send } from "lucide-react"

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Industries", href: "#industries" },
  { label: "Pricing", href: "#pricing" },
]

function SupportDropdown() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputCls = "w-full px-3 py-2 text-xs font-sans border border-border rounded-lg focus:outline-none focus:border-gold transition-colors bg-white text-ink placeholder:text-ink-3"

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
        setTimeout(() => { setSent(false); setOpen(false); setName(""); setEmail(""); setMessage("") }, 2500)
      } else {
        setError(data.error || "Failed to send.")
      }
    } catch {
      setError("Something went wrong.")
    }
    setSending(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors font-sans"
      >
        <MessageCircle size={15} />
        Support
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-border bg-white shadow-lg p-4">
            {sent ? (
              <div className="text-center py-4">
                <p className="text-xs font-sans font-500 text-green-500 mb-0.5">Message sent ✓</p>
                <p className="text-2xs font-sans text-ink-3">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-2xs font-sans font-500 text-ink-3 uppercase tracking-wider mb-3">Contact support</p>
                <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
                <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
                <textarea rows={3} placeholder="Describe your issue..." value={message} onChange={e => setMessage(e.target.value)}
                  className={`${inputCls} resize-none leading-relaxed`} />
                {error && <p className="text-2xs font-sans text-red-500">{error}</p>}
                <button onClick={handleSubmit} disabled={sending}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-gold to-[#A07E00] text-white text-xs font-sans font-500 rounded-lg shadow-[var(--shadow-gold)] hover:brightness-105 transition-all disabled:opacity-60">
                  <Send size={12} />
                  {sending ? "Sending..." : "Send message"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_4px_20px_-12px_rgba(15,15,13,0.25)]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <Logo variant="white" size="sm" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-ink-3 hover:text-ink transition-colors font-sans">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <SupportDropdown />
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button variant="gold" size="sm">Get started →</Button>
          </Link>
        </div>

        <button className="md:hidden text-ink" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-border px-6 py-4 flex flex-col gap-4">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-ink-3 font-sans" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <hr className="border-border" />
          <Link href="/login"><Button variant="ghost" size="sm" className="w-full">Sign in</Button></Link>
          <Link href="/signup"><Button variant="gold" size="sm" className="w-full">Get started →</Button></Link>
        </div>
      )}
    </nav>
  )
}