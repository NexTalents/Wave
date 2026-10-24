import type { Metadata } from "next"
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-wave-sans",
  display: "swap",
  weight: "variable",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-wave-mono",
  display: "swap",
  weight: "variable",
})

export const metadata: Metadata = {
  title: "WAVE — Waste Value Exchange",
  description:
    "Indeks harga limbah transparan untuk ekonomi sirkular Indonesia.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn("font-sans antialiased", mono.variable, sans.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
