"use client"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features",     href: "#features" },
  { label: "Industries",   href: "#industries" },
  { label: "Pricing",      href: "#pricing" },
]

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

        <div className="hidden md:flex items-center gap-3">
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
