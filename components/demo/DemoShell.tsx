"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Sun, CheckSquare, Target, Calendar, BarChart3, MessageCircle, AlertTriangle } from "lucide-react"
import { useAppStore } from "@/lib/store"
import type { UserProfile } from "@/types"
import DemoChatPanel from "./DemoChatPanel"
import { cn } from "@/lib/utils/cn"

const navItems = [
  { href: "/demo", icon: Sun, label: "Hoje" },
  { href: "/demo/todos", icon: CheckSquare, label: "To-Do" },
  { href: "/demo/goals", icon: Target, label: "Metas" },
  { href: "/demo/calendar", icon: Calendar, label: "Calendário" },
  { href: "/demo/stats", icon: BarChart3, label: "Alma" },
]

export default function DemoShell({
  profile,
  children,
}: {
  profile: UserProfile
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { setProfile, isChatOpen, setIsChatOpen } = useAppStore()
  const [isCrisisMode, setIsCrisisMode] = useState(false)

  useEffect(() => {
    setProfile(profile)
  }, [profile, setProfile])

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 108% -15%, rgba(180,180,180,0.38) 0%, rgba(200,200,200,0.18) 28%, transparent 48%),
          radial-gradient(circle at -8% 118%, rgba(180,180,180,0.42) 0%, rgba(200,200,200,0.20) 28%, transparent 48%),
          #F8F6F3
        `,
      }}
    >

      {/* Sidebar */}
      <aside className="w-52 flex flex-col py-6 bg-transparent flex-shrink-0 z-20">
        <div className="px-5 mb-8">
          <span className="font-sans text-xl font-bold text-ink tracking-tight">Coris</span>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium italic",
                  isActive
                    ? "bg-accent text-ink font-semibold"
                    : "text-ink-muted hover:bg-surface-raised hover:text-ink"
                )}
              >
                <item.icon size={17} className="flex-shrink-0" />
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Crisis mode banner */}
      {isCrisisMode && (
        <div className="fixed top-0 left-52 right-0 z-30 bg-danger text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Modo de Crise ativo</span>
          </div>
          <button onClick={() => setIsCrisisMode(false)} className="text-white/70 hover:text-white text-sm underline">
            Desativar
          </button>
        </div>
      )}

      {/* Crisis button */}
      <button
        onClick={() => setIsCrisisMode(true)}
        title="Modo de Crise"
        className="fixed bottom-24 right-6 z-40 w-10 h-10 rounded-xl bg-white border border-border shadow-card
                   flex items-center justify-center text-ink-faint hover:text-danger hover:border-danger transition-colors"
      >
        <AlertTriangle size={16} />
      </button>

      {/* Chat FAB */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl shadow-float flex items-center justify-center transition-all",
          isChatOpen ? "bg-ink text-white" : "bg-accent text-ink hover:bg-amber-500"
        )}
      >
        <MessageCircle size={22} />
      </button>

      <DemoChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
