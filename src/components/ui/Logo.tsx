import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "dark" | "white" | "gold";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 24, fontSize: 16, tagSize: 8, gap: 10 },
  md: { icon: 32, fontSize: 20, tagSize: 10, gap: 12 },
  lg: { icon: 44, fontSize: 26, tagSize: 12, gap: 16 },
};

const colors = {
  dark:  { icon: "#C49A00", letter: "#0F0F0D", text: "#C49A00", tag: "#C49A00" },
  white: { icon: "#C49A00", letter: "#ffffff", text: "#1A1A16", tag: "#C49A00" },
  gold:  { icon: "#ffffff", letter: "#C49A00", text: "#ffffff", tag: "#ffffff" },
};

export function Logo({ variant = "white", size = "md", showText = true, className }: LogoProps) {
  const s = sizes[size];
  const c = colors[variant];
  const iconH = s.icon * 1.25;

  return (
    <div className={cn("flex items-center", className)} style={{ gap: s.gap }}>
      <svg width={s.icon} height={iconH} viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15 2 C17 0 21 0 23 2 C27 7 27 16 26 22 C25 31 21 38 15 38 C9 38 5 31 4 22 C3 16 3 7 7 2 Z"
          fill={c.icon}
        />
        <path
          d="M4 33 L26 33 L26 38 Q20.5 42 15 38 Q9.5 42 4 38 Z"
          fill={c.icon}
        />
        <text
          x="15" y="28"
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontSize="20"
          fontWeight="600"
          fill={c.letter}
          textAnchor="middle"
        >L</text>
      </svg>
      {showText && (
        <div style={{ lineHeight: 1 }}>
          <div
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: s.fontSize,
              fontWeight: 500,
              color: c.text,
              letterSpacing: "0.5px",
              lineHeight: 1.2,
            }}
          >
            Lemon
          </div>
          <div
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: s.tagSize,
              fontWeight: 300,
              color: c.tag,
              letterSpacing: "4px",
              opacity: 0.8,
              marginTop: 1,
            }}
          >
            ASSISTANT
          </div>
        </div>
      )}
    </div>
  );
}
