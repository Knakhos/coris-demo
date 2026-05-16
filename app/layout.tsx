import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Coris — Sistema Operacional de Vida",
    template: "%s | Coris",
  },
  description:
    "A IA que aprende quem você é e reorganiza sua rotina em tempo real conforme a vida muda.",
  keywords: ["produtividade", "IA", "metas", "rotina", "gestão de tempo"],
}

export const viewport: Viewport = {
  themeColor: "#FAFAF9",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
