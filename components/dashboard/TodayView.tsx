"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RefreshCw, Zap } from "lucide-react"
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
  briefingEndpoint?: string
}

export default function TodayView(props: Props) {
  const { profile, tasks, goals, todayCheckIn, recentCheckIns, todayEvents, briefingEndpoint = "/api/ai/briefing" } = props
  const [briefing, setBriefing] = useState(props.briefing)
  const [briefingLoading, setBriefingLoading] = useState(!props.briefing)
  const [currentCheckIn, setCurrentCheckIn] = useState(todayCheckIn)

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
  const pendingTasks = tasks.filter((t) => t.status === "pending")
  const currentEnergy = currentCheckIn?.energy ?? recentCheckIns[0]?.energy ?? 5
  const sortedTasks = sortTasksByPriority(pendingTasks, currentEnergy)

  useEffect(() => {
    if (!briefing) fetchBriefing()
  }, [])

  async function fetchBriefing() {
    setBriefingLoading(true)
    try {
      const res = await fetch(briefingEndpoint)
      const data = await res.json()
      setBriefing(data.briefing)
    } finally {
      setBriefingLoading(false)
    }
  }

  async function refreshBriefing() {
    setBriefingLoading(true)
    try {
      const res = await fetch(`${briefingEndpoint}?refresh=1`)
      const data = await res.json()
      setBriefing(data.briefing)
    } finally {
      setBriefingLoading(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-6xl">
      <motion.div initial="hidden" animate="visible" variants={stagger}>

        {/* Header */}
        <motion.div variants={fadeUp} className="mb-6">
          <p className="text-ink-faint text-sm capitalize mb-1">{today}</p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="font-title text-4xl font-bold tracking-tight leading-none">
              {profile
                ? `Bom dia, ${profile.full_name ?? profile.email.split("@")[0]}.`
                : "Hoje"}
            </h1>
            {currentCheckIn && (
              <div className="flex items-center gap-5 pb-0.5">
                {[
                  { label: "Humor", value: currentCheckIn.mood },
                  { label: "Energia", value: currentCheckIn.energy },
                  { label: "Foco", value: currentCheckIn.focus },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col items-center">
                    <span className="font-semibold text-lg leading-none">{m.value}</span>
                    <span className="text-[10px] text-ink-faint mt-0.5">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Briefing — full width */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="bg-ink rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-accent/10 rounded-full" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-ink text-[10px] font-bold">C</span>
                  </div>
                  <span className="text-white/30 text-[11px] font-medium uppercase tracking-widest">
                    Análise do dia
                  </span>
                </div>
                <button
                  onClick={refreshBriefing}
                  disabled={briefingLoading}
                  className="text-white/20 hover:text-white/50 transition-colors"
                >
                  <RefreshCw size={13} className={cn(briefingLoading && "animate-spin")} />
                </button>
              </div>
              {briefingLoading ? (
                <div className="space-y-2">
                  {[85, 70, 55].map((w, i) => (
                    <div key={i} className="h-3.5 bg-white/8 rounded-full animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : briefing ? (
                <p className="text-white/80 text-base font-display italic leading-relaxed">
                  &ldquo;{briefing.content}&rdquo;
                </p>
              ) : (
                <p className="text-white/30 text-sm">
                  Nenhum briefing disponível.
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Body */}
        <div className="grid lg:grid-cols-[1fr_268px] gap-5 items-start">

          {/* Left: check-in (se pendente) + tarefas */}
          <div className="space-y-5">
            {!currentCheckIn && (
              <motion.div variants={fadeUp}>
                <CheckInWidget checkIn={null} onComplete={(ci) => setCurrentCheckIn(ci)} />
              </motion.div>
            )}

            <motion.div variants={fadeUp}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm">Tarefas prioritárias</h2>
                <div className="flex items-center gap-1 text-[11px] text-ink-faint">
                  <Zap size={10} className="text-accent" />
                  ordenado por IA
                </div>
              </div>
              {sortedTasks.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-ink-muted text-sm">Nenhuma tarefa pendente.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedTasks.slice(0, 7).map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -8 }}
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

          {/* Right: painel unificado */}
          <motion.div variants={fadeUp} className="card overflow-hidden divide-y divide-border">

            {/* Pulso */}
            {recentCheckIns.length > 0 && (
              <div className="p-4">
                <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wide mb-3">
                  Pulso — 7 dias
                </p>
                <div className="flex items-end gap-1 h-12">
                  {recentCheckIns.slice(0, 7).reverse().map((ci, i) => (
                    <div key={ci.id} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(ci.energy / 10) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.04 }}
                        className={cn(
                          "w-full rounded-sm min-h-[3px]",
                          ci.energy >= 7 ? "bg-success" : ci.energy >= 5 ? "bg-accent" : "bg-warning"
                        )}
                      />
                      <span className="text-[9px] text-ink-faint capitalize">
                        {format(new Date(ci.date), "EEE", { locale: ptBR }).slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agenda */}
            <div className="p-4">
              <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wide mb-3">
                Agenda de hoje
              </p>
              {todayEvents.length === 0 ? (
                <p className="text-ink-faint text-sm">Dia livre.</p>
              ) : (
                <div className="space-y-3">
                  {todayEvents.map((event) => (
                    <div key={event.id} className="flex gap-3 items-start">
                      <span className="text-[11px] text-ink-faint font-mono pt-px w-9 flex-shrink-0">
                        {format(new Date(event.start_at), "HH:mm")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug truncate">{event.title}</p>
                        <span className={`pill badge-${event.context_tag} mt-1`}>
                          {event.context_tag}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Metas */}
            <div className="p-4">
              <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wide mb-3">
                Metas ativas
              </p>
              {goals.length === 0 ? (
                <p className="text-ink-faint text-sm">Nenhuma meta ativa.</p>
              ) : (
                <div className="space-y-3.5">
                  {goals.slice(0, 4).map((goal) => (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm leading-snug truncate flex-1">{goal.title}</p>
                        <span className="text-xs font-medium text-ink-muted ml-2 flex-shrink-0">
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="h-1 bg-surface-raised rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                          className="h-full bg-accent rounded-full"
                        />
                      </div>
                      {goal.days_stalled > 3 && (
                        <p className="text-[11px] text-warning mt-0.5">
                          Parada há {goal.days_stalled}d
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
