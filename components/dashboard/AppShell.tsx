"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Sun, CheckSquare, Target, Calendar, BarChart3, MessageCircle, AlertTriangle, LogOut, User
} from "lucide-react"
import { useAppStore } from "@/lib/store"
import type { UserProfile } from "@/types"
import ChatPanel from "@/components/chat/ChatPanel"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils/cn"

const navItems = [
  { href: "/dashboard", icon: Sun, label: "Hoje", tab: "today" },
  { href: "/todos", icon: CheckSquare, label: "To-Do", tab: "todos" },
  { href: "/goals", icon: Target, label: "Metas", tab: "goals" },
  { href: "/calendar", icon: Calendar, label: "Calendário", tab: "calendar" },
  { href: "/stats", icon: BarChart3, label: "Stats", tab: "stats" },
]

export default function AppShell({
  profile,
  children,
}: {
  profile: UserProfile
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { setProfile, isChatOpen, setIsChatOpen, isCrisisMode, setIsCrisisMode } = useAppStore()

  useEffect(() => {
    if (profile) setProfile(profile)
  }, [profile, setProfile])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* Sidebar */}
      <aside className="w-[60px] flex flex-col items-center py-5 border-r border-border bg-white flex-shrink-0 z-20">
        {/* Logo */}
        <div className="mb-8">
          <span className="font-display text-lg italic text-ink">C</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <a
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150",
                  isActive
                    ? "bg-accent text-white shadow-sm"
                    : "text-ink-faint hover:bg-surface-raised hover:text-ink"
                )}
              >
                <item.icon size={18} />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-accent rounded-xl -z-10"
                  />
                )}
              </a>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-2">
          {isCrisisMode && (
            <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
          )}
          <button
            onClick={handleLogout}
            title="Sair"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-ink-faint hover:bg-surface-raised hover:text-ink transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Crisis Mode Banner */}
      {isCrisisMode && (
        <motion.div
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-[60px] right-0 z-30 bg-danger text-white px-6 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Modo de Crise ativo — agenda reorganizada para o essencial</span>
          </div>
          <button
            onClick={() => setIsCrisisMode(false)}
            className="text-white/70 hover:text-white text-sm underline"
          >
            Desativar
          </button>
        </motion.div>
      )}

      {/* Chat FAB */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl shadow-float",
          "flex items-center justify-center transition-all duration-200",
          isChatOpen ? "bg-ink text-white" : "bg-accent text-white hover:bg-blue-700"
        )}
      >
        <MessageCircle size={22} />
      </button>

      {/* Crisis Mode Button */}
      <button
        onClick={() => setIsCrisisMode(true)}
        title="Modo de Crise"
        className="fixed bottom-24 right-6 z-40 w-10 h-10 rounded-xl bg-white border border-border shadow-card
                   flex items-center justify-center text-ink-faint hover:text-danger hover:border-danger transition-colors"
      >
        <AlertTriangle size={16} />
      </button>

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
