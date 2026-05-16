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
  { href: "/demo/stats", icon: BarChart3, label: "Stats" },
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
    <div className="flex h-screen overflow-hidden bg-base">
      {/* Demo banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-accent text-white text-xs font-medium text-center py-1.5">
        Modo Demo — dados fictícios, IA real
      </div>

      {/* Sidebar */}
      <aside className="w-[60px] flex flex-col items-center py-5 border-r border-border bg-white flex-shrink-0 z-20 mt-7">
        <div className="mb-8">
          <span className="font-display text-lg italic text-ink">C</span>
        </div>
        <nav className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150",
                  isActive
                    ? "bg-accent text-white shadow-sm"
                    : "text-ink-faint hover:bg-surface-raised hover:text-ink"
                )}
              >
                <item.icon size={18} />
              </a>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto mt-7">
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
        <div className="fixed top-7 left-[60px] right-0 z-30 bg-danger text-white px-6 py-3 flex items-center justify-between">
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
          isChatOpen ? "bg-ink text-white" : "bg-accent text-white hover:bg-blue-700"
        )}
      >
        <MessageCircle size={22} />
      </button>

      <DemoChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
