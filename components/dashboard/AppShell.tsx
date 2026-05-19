"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sun, CheckSquare, Target, Calendar, Sparkles, MessageCircle, AlertTriangle, Plug, BookOpen, LogOut } from "lucide-react"
import { useAppStore } from "@/lib/store"
import type { UserProfile } from "@/types"
import ChatPanel from "@/components/chat/ChatPanel"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils/cn"

const navItems = [
  { href: "/dashboard", icon: Sun, label: "Hoje" },
  { href: "/goals", icon: Target, label: "Metas" },
  { href: "/calendar", icon: Calendar, label: "Calendário" },
  { href: "/todos", icon: CheckSquare, label: "To-Do" },
  { href: "/stats", icon: Sparkles, label: "Alma" },
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/connections", icon: Plug, label: "Conexões" },
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
  const { setProfile, isChatOpen, setIsChatOpen } = useAppStore()
  const [isCrisisMode, setIsCrisisMode] = useState(false)

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
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 78% 65% at 102% -4%, rgba(255,90,0,0.75) 0%, rgba(255,140,0,0.32) 45%, transparent 72%),
          radial-gradient(ellipse 64% 65% at -4% 104%, rgba(255,90,0,0.68) 0%, rgba(255,140,0,0.26) 45%, transparent 72%),
          #FFFFFF
        `,
      }}
    >
      {/* Sidebar */}
      <aside className="w-52 flex flex-col py-6 bg-transparent flex-shrink-0 z-20">
        <div className="px-5 mb-8">
          <img src="/logo.png" alt="Coris" className="w-24 h-auto object-contain" />
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
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

        <div className="px-3 mt-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm italic text-ink-faint hover:bg-surface-raised hover:text-ink transition-colors"
          >
            <LogOut size={17} className="flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Crisis mode banner */}
      {isCrisisMode && (
        <div className="fixed top-0 left-52 right-0 z-30 bg-danger text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Modo de Crise ativo — agenda reorganizada para o essencial</span>
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

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
