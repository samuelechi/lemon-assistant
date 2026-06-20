import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "gold" | "outline"
  size?: "sm" | "md" | "lg"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative inline-flex items-center justify-center font-sans font-500 rounded-lg cursor-pointer overflow-hidden transition-[transform,box-shadow,background-color,opacity,border-color] duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          {
            "bg-ink text-white shadow-[0_4px_14px_-4px_rgba(15,15,13,0.45)] hover:bg-ink-2 hover:shadow-[0_8px_22px_-6px_rgba(15,15,13,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]": variant === "primary",
            "shine text-white bg-gradient-to-br from-[#E0B400] via-gold to-[#A07E00] shadow-[var(--shadow-gold)] hover:shadow-[var(--shadow-gold-lg)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]": variant === "gold",
            "bg-white/70 backdrop-blur-sm border border-border text-ink hover:bg-cream-2 hover:border-gold-light hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]": variant === "secondary",
            "bg-transparent text-ink hover:bg-cream-2": variant === "ghost",
            "bg-transparent border border-gold text-gold hover:bg-gold-pale hover:shadow-[0_4px_12px_-4px_rgba(196,154,0,0.35)]": variant === "outline",
          },
          {
            "text-xs px-3 py-1.5 h-8": size === "sm",
            "text-sm px-5 py-2.5 h-10": size === "md",
            "text-base px-7 py-3 h-12": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
