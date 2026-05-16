"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { CheckIn, Task, Goal, AIProfile, WeeklyReplay } from "@/types"
import { cn } from "@/lib/utils/cn"
import { Loader2, RefreshCw } from "lucide-react"

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

interface Props {
  aiProfile: AIProfile | null
  checkIns: CheckIn[]
  tasks: Task[]
  goals: Goal[]
  weeklyReplay: WeeklyReplay | null
}

export default function StatsView({ aiProfile, checkIns, tasks, goals, weeklyReplay: initialReplay }: Props) {
  const [replay, setReplay] = useState(initialReplay)
  const [generatingReplay, setGeneratingReplay] = useState(false)

  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100)
    : 0

  const avgEnergy = checkIns.length > 0
    ? (checkIns.reduce((s, c) => s + c.energy, 0) / checkIns.length).toFixed(1)
    : "—"

  const avgMood = checkIns.length > 0
    ? (checkIns.reduce((s, c) => s + c.mood, 0) / checkIns.length).toFixed(1)
    : "—"

  const activeGoals = goals.filter((g) => g.status === "active").length
  const completedGoals = goals.filter((g) => g.status === "completed").length

  const checkInData = checkIns.map((ci) => ({
    date: format(parseISO(ci.date), "dd/MM"),
    energia: ci.energy,
    humor: ci.mood,
    foco: ci.focus,
  }))

  const contextTaskData = Object.entries(
    tasks.reduce((acc, t) => {
      acc[t.context_tag] = (acc[t.context_tag] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, total]) => ({ name, total }))

  const radarData = [
    { subject: "Energia", A: checkIns.length > 0 ? Number(avgEnergy) * 10 : 50 },
    { subject: "Humor", A: checkIns.length > 0 ? Number(avgMood) * 10 : 50 },
    { subject: "Conclusão", A: completionRate },
    { subject: "Consistência", A: Math.min(100, (checkIns.length / 30) * 100) },
    { subject: "Metas", A: goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0 },
  ]

  async function generateReplay() {
    setGeneratingReplay(true)
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Gere o Replay de Semana baseado nos dados disponíveis:
- Taxa de conclusão: ${completionRate}%
- Energia média: ${avgEnergy}/10
- Humor médio: ${avgMood}/10
- Metas ativas: ${activeGoals}
- Check-ins dos últimos 7 dias: ${checkIns.slice(-7).map(c => `${c.date}: energia=${c.energy} humor=${c.mood}`).join(", ")}

Formato: narrativo, direto, analítico. 4-6 parágrafos.`,
          }],
        }),
      })

      const reader = res.body?.getReader()
      if (!reader) throw new Error()

      let accumulated = ""
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split("\n")
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const p = JSON.parse(line.slice(6))
              if (p.text) accumulated += p.text
            } catch {}
          }
        }
      }

      setReplay({
        id: "temp",
        user_id: "",
        week_start: "",
        week_end: "",
        generated_at: new Date().toISOString(),
        content: {
          narrative: accumulated,
          planned_vs_executed: { planned: tasks.length, executed: tasks.filter(t => t.status === "done").length },
          win_moments: [],
          derail_moment: "",
          ai_learnings: [],
          next_week_adjustments: [],
        },
      })
    } finally {
      setGeneratingReplay(false)
    }
  }

  return (
    <div className="max-w-6xl px-8 py-8">
      <motion.div initial="hidden" animate="visible" variants={stagger}>
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-baseline gap-4">
            <h1 className="font-title text-4xl font-bold tracking-tight">Alma</h1>
            <p className="font-title text-xl italic text-ink-faint">&ldquo;o que está no centro de tudo&rdquo;</p>
          </div>
          <p className="text-ink-muted text-sm mt-1">Últimos 30 dias</p>
        </motion.div>

        {/* KPI cards */}
        <motion.div variants={fadeUp} className="flex justify-center gap-4 mb-8">
          {[
            { label: "Energia média", value: avgEnergy, sub: "de 10" },
            { label: "Humor médio", value: avgMood, sub: "de 10" },
            { label: "Metas ativas", value: activeGoals, sub: `${completedGoals} concluídas` },
          ].map((kpi) => (
            <div key={kpi.label} className="card p-5 w-48">
              <p className="text-xs text-ink-faint mb-2">{kpi.label}</p>
              <p className="font-display text-3xl italic">{kpi.value}</p>
              <p className="text-xs text-ink-muted mt-1">{kpi.sub}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Energy/mood trend */}
          <motion.div variants={fadeUp} className="card p-5">
            <h3 className="font-semibold text-sm mb-4">Energia & Humor (30 dias)</h3>
            {checkInData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={checkInData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" }} />
                  <Line type="monotone" dataKey="energia" stroke="#F0A500" strokeWidth={2} dot={false} name="Energia" />
                  <Line type="monotone" dataKey="humor" stroke="#10B981" strokeWidth={2} dot={false} name="Humor" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-ink-faint text-sm">
                Complete check-ins para ver o gráfico
              </div>
            )}
          </motion.div>

          {/* Performance radar */}
          <motion.div variants={fadeUp} className="card p-5">
            <h3 className="font-semibold text-sm mb-4">Score de performance</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(0,0,0,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar name="Score" dataKey="A" stroke="#F0A500" fill="#F0A500" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Patterns — full width */}
        <motion.div variants={fadeUp} className="card p-6 mb-6">
          <h3 className="font-semibold text-sm mb-5">Padrões identificados</h3>
          {aiProfile?.productivity_patterns && aiProfile.productivity_patterns.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-5">
              {aiProfile.productivity_patterns.map((p, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{p.pattern}</p>
                    <span className="text-[10px] font-semibold text-accent flex-shrink-0 tabular-nums">
                      {(p.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-black/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${p.confidence * 100}%` }}
                    />
                  </div>
                  {p.evidence && p.evidence.length > 0 && (
                    <ul className="space-y-1.5 pt-1 border-t border-black/[0.06]">
                      {p.evidence.map((e, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                          <span className="text-xs text-ink-muted leading-snug">{e}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-ink-faint text-sm">Padrões serão identificados conforme você usa o Coris.</p>
            </div>
          )}
        </motion.div>

        {/* Weekly Replay */}
        <motion.div variants={fadeUp} className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">Replay de Semana</h3>
            <button
              onClick={generateReplay}
              disabled={generatingReplay}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {generatingReplay ? (
                <><Loader2 size={14} className="animate-spin" /> Gerando...</>
              ) : (
                <><RefreshCw size={14} /> Gerar replay</>
              )}
            </button>
          </div>

          {replay ? (
            <div>
              {replay.content.planned_vs_executed && (
                <div className="flex gap-6 mb-5 p-4 bg-surface-raised rounded-xl">
                  <div>
                    <p className="text-xs text-ink-faint">Planejado</p>
                    <p className="font-display text-2xl italic">{replay.content.planned_vs_executed.planned}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-faint">Executado</p>
                    <p className="font-display text-2xl italic text-success">{replay.content.planned_vs_executed.executed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-faint">Taxa</p>
                    <p className="font-display text-2xl italic">
                      {replay.content.planned_vs_executed.planned > 0
                        ? Math.round((replay.content.planned_vs_executed.executed / replay.content.planned_vs_executed.planned) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              )}
              <div className="briefing-text not-italic text-sm text-ink leading-relaxed whitespace-pre-line">
                {replay.content.narrative}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-ink-muted text-sm mb-4">
                Toda segunda-feira, o Coris gera um diagnóstico preciso da sua semana anterior.
              </p>
              <button onClick={generateReplay} disabled={generatingReplay} className="btn-primary">
                Gerar agora
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
