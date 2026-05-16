"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RefreshCw, Clock, Zap } from "lucide-react"
import type { UserProfile, Task, Goal, CheckIn, CalendarEvent, AIDailyBriefing } from "@/types"
import CheckInWidget from "./CheckInWidget"
import TaskCard from "./TaskCard"
import { cn } from "@/lib/utils/cn"
import { sortTasksByPriority } from "@/lib/utils/priority"

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

interface Props {
  profile: UserProfile | null
  tasks: Task[]
  goals: Goal[]
  todayCheckIn: CheckIn | null
  recentCheckIns: CheckIn[]
  todayEvents: CalendarEvent[]
  briefing: AIDailyBriefing | null
}

export default function TodayView(props: Props) {
  const { profile, tasks, goals, todayCheckIn, recentCheckIns, todayEvents } = props
  const [briefing, setBriefing] = useState(props.briefing)
  const [briefingLoading, setBriefingLoading] = useState(!props.briefing)
  const [currentCheckIn, setCurrentCheckIn] = useState(todayCheckIn)

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
  const pendingTasks = tasks.filter((t) => t.status === "pending")
  const currentEnergy = currentCheckIn?.energy ?? recentCheckIns[0]?.energy ?? 5
  const sortedTasks = sortTasksByPriority(pendingTasks, currentEnergy)

  useEffect(() => {
    if (!briefing) {
      fetchBriefing()
    }
  }, [])

  async function fetchBriefing() {
    setBriefingLoading(true)
    try {
      const res = await fetch("/api/ai/briefing")
      const data = await res.json()
      setBriefing(data.briefing)
    } finally {
      setBriefingLoading(false)
    }
  }

  async function refreshBriefing() {
    setBriefingLoading(true)
    try {
      const res = await fetch("/api/ai/briefing?refresh=1")
      const data = await res.json()
      setBriefing(data.briefing)
    } finally {
      setBriefingLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-8">
          <p className="text-ink-faint text-sm capitalize">{today}</p>
          <h1 className="font-sans text-4xl font-bold mt-1 tracking-tight">
            {profile ? `Bom dia, ${profile.full_name ?? profile.email.split("@")[0]}.` : "Hoje"}
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Briefing */}
            <motion.div variants={fadeUp}>
              <div className="bg-ink rounded-3xl p-7 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-white text-xs font-bold">C</span>
                      </div>
                      <span className="text-gray-400 text-xs font-medium uppercase tracking-widest">
                        Briefing de hoje
                      </span>
                    </div>
                    <button
                      onClick={refreshBriefing}
                      disabled={briefingLoading}
                      className="text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      <RefreshCw size={14} className={cn(briefingLoading && "animate-spin")} />
                    </button>
                  </div>

                  {briefingLoading ? (
                    <div className="space-y-2.5">
                      {[80, 65, 90, 70].map((w, i) => (
                        <div key={i} className="h-4 bg-white/10 rounded-full animate-pulse" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  ) : briefing ? (
                    <p className="briefing-text text-white/90 text-lg not-italic font-display">
                      &ldquo;{briefing.content}&rdquo;
                    </p>
                  ) : (
                    <p className="text-gray-600 text-sm italic">
                      Nenhum briefing disponível. Complete o onboarding para ativar.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Check-in */}
            <motion.div variants={fadeUp}>
              <CheckInWidget
                checkIn={currentCheckIn}
                onComplete={(ci) => setCurrentCheckIn(ci)}
              />
            </motion.div>

            {/* Priority tasks */}
            <motion.div variants={fadeUp}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-base">Tarefas de hoje</h2>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <Zap size={12} className="text-accent" />
                  <span>Ordenado por score IA</span>
                </div>
              </div>

              {sortedTasks.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-ink-muted text-sm">Nenhuma tarefa pendente.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedTasks.slice(0, 6).map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <TaskCard task={task} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Today's schedule */}
            <motion.div variants={fadeUp} className="card p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Clock size={15} className="text-ink-muted" />
                Agenda de hoje
              </h3>
              {todayEvents.length === 0 ? (
                <p className="text-ink-faint text-sm text-center py-4">Dia livre de compromissos.</p>
              ) : (
                <div className="space-y-2">
                  {todayEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="text-xs text-ink-muted font-mono pt-0.5 w-10 flex-shrink-0">
                        {format(new Date(event.start_at), "HH:mm")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <span className={`pill badge-${event.context_tag} mt-0.5`}>
                          {event.context_tag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Goals progress */}
            <motion.div variants={fadeUp} className="card p-5">
              <h3 className="font-semibold text-sm mb-4">Metas ativas</h3>
              {goals.length === 0 ? (
                <p className="text-ink-faint text-sm text-center py-4">
                  <a href="/goals" className="text-accent hover:underline">Adicionar primeira meta</a>
                </p>
              ) : (
                <div className="space-y-4">
                  {goals.slice(0, 4).map((goal) => (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate flex-1">{goal.title}</p>
                        <span className="text-xs text-ink-muted ml-2">{goal.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                          className="h-full bg-accent rounded-full"
                        />
                      </div>
                      {goal.days_stalled > 3 && (
                        <p className="text-xs text-warning mt-0.5">
                          Parada há {goal.days_stalled} dias
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Energy trend */}
            {recentCheckIns.length > 0 && (
              <motion.div variants={fadeUp} className="card p-5">
                <h3 className="font-semibold text-sm mb-3">Energia (7 dias)</h3>
                <div className="flex items-end gap-1.5 h-16">
                  {recentCheckIns.slice(0, 7).reverse().map((ci, i) => (
                    <div key={ci.id} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(ci.energy / 10) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className={cn(
                          "w-full rounded-t-sm min-h-[4px]",
                          ci.energy >= 7 ? "bg-success" : ci.energy >= 5 ? "bg-accent" : "bg-warning"
                        )}
                      />
                      <span className="text-[9px] text-ink-faint">
                        {format(new Date(ci.date), "dd/MM")}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
