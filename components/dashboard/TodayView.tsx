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
    <div className="px-8 py-8">
      <motion.div initial="hidden" animate="visible" variants={stagger}>

        {/* Header */}
        <motion.div variants={fadeUp} className="mb-6">
          <p className="text-ink-faint text-sm capitalize mb-1">{today}</p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="font-title text-4xl font-bold tracking-tight leading-none">
              {profile
                ? `Boa tarde, ${profile.full_name ?? profile.email.split("@")[0]}.`
                : "Hoje"}
            </h1>
            {currentCheckIn && (
              <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm border border-black/[0.07]">
                {[
                  { label: "Humor", value: currentCheckIn.mood },
                  { label: "Energia", value: currentCheckIn.energy },
                  { label: "Foco", value: currentCheckIn.focus },
                ].map((m, i) => (
                  <div key={m.label} className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-lg leading-none">{m.value}</span>
                      <span className="text-[10px] text-ink-faint mt-0.5">{m.label}</span>
                    </div>
                    {i < 2 && <div className="w-px h-6 bg-black/[0.08]" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Briefing — full width */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-title text-lg mb-2">Briefing</h2>
              {briefingLoading ? (
                <div className="space-y-2">
                  {[85, 70, 55].map((w, i) => (
                    <div key={i} className="h-3.5 bg-black/10 rounded-full animate-pulse" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : briefing ? (
                <p className="text-ink/65 text-base font-display italic leading-relaxed">
                  &ldquo;{briefing.content}&rdquo;
                </p>
              ) : (
                <p className="text-ink/35 text-sm">
                  Nenhum briefing disponível.
                </p>
              )}
            </div>
            <button
              onClick={refreshBriefing}
              disabled={briefingLoading}
              className="text-ink/25 hover:text-ink/50 transition-colors mt-1 flex-shrink-0"
            >
              <RefreshCw size={13} className={cn(briefingLoading && "animate-spin")} />
            </button>
          </div>
        </motion.div>

        {/* Body */}
        <div className="grid lg:grid-cols-[420px_1fr_1fr] xl:grid-cols-[520px_1fr_1fr] 2xl:grid-cols-[600px_1fr_1fr] gap-5 items-start">

          {/* Col 1: check-in + tarefas */}
          <div className="space-y-5">
            {!currentCheckIn && (
              <motion.div variants={fadeUp}>
                <CheckInWidget checkIn={null} onComplete={(ci) => setCurrentCheckIn(ci)} />
              </motion.div>
            )}

            <motion.div variants={fadeUp} className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wide">Tarefas prioritárias</p>
                <div className="flex items-center gap-1 text-[11px] text-ink-faint">
                  <Zap size={10} className="text-accent" />
                  ordenado por IA
                </div>
              </div>
              {sortedTasks.length === 0 ? (
                <div className="px-4 pb-4">
                  <p className="text-ink-muted text-sm">Nenhuma tarefa pendente.</p>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.05]">
                  {sortedTasks.slice(0, 7).map((task, i) => (
                    <TaskCard key={task.id} task={task} inline />
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Col 2: agenda */}
          <motion.div variants={fadeUp} className="card overflow-hidden">
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
          </motion.div>

          {/* Col 3: metas */}
          <motion.div variants={fadeUp} className="card p-4">
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
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
