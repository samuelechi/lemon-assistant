import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/layout/ThemeProvider"

export const metadata: Metadata = {
  title: "LemonAssistant — AI Receptionist for Small Businesses",
  description: "Never miss a call again. LemonAssistant answers every missed call, books appointments, and sends confirmations — automatically.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="3ra4rvrRWAnFHm1098oFtfkvaOAm9nsirYHlAeWwxhU" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}