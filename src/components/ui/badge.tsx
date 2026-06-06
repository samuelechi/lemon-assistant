import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "gold" | "green" | "red" | "gray" | "outline"
  className?: string
}

export function Badge({ children, variant = "gold", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-sans font-500 tracking-wide uppercase",
      {
        "bg-gold-pale text-gold-dark border border-gold-light": variant === "gold",
        "bg-green-50 text-green-700 border border-green-200": variant === "green",
        "bg-red-50 text-red-700 border border-red-200": variant === "red",
        "bg-cream-2 text-ink-3 border border-border": variant === "gray",
        "bg-transparent text-gold border border-gold": variant === "outline",
      },
      className
    )}>
      {children}
    </span>
  )
}
