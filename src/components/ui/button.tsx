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
          "inline-flex items-center justify-center font-sans font-500 transition-all duration-150 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-ink text-white hover:bg-ink-2 active:scale-[0.98]": variant === "primary",
            "bg-gold text-white hover:opacity-90 active:scale-[0.98]": variant === "gold",
            "bg-transparent border border-border text-ink hover:bg-cream-2 active:scale-[0.98]": variant === "secondary",
            "bg-transparent text-ink hover:bg-cream-2": variant === "ghost",
            "bg-transparent border border-gold text-gold hover:bg-gold-pale": variant === "outline",
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
