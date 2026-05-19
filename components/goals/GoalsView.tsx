"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Target, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react"
import type { Goal } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils/cn"
import NegotiationModal from "./NegotiationModal"

const horizonLabel = { short: "Curto prazo", medium: "Médio prazo", long: "Longo prazo" }
const horizonColor = {
  short: "bg-blue-50 text-blue-700",
  medium: "bg-purple-50 text-purple-700",
  long: "bg-orange-50 text-orange-700",
}

export default function GoalsView({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [negotiatingGoal, setNegotiatingGoal] = useState<Goal | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    horizon: "medium" as Goal["horizon"],
    identity_link: "",
    target_date: "",
  })

  const activeGoals = goals.filter((g) => g.status === "active")
  const stalledGoals = activeGoals.filter((g) => g.days_stalled > 3)

  async function handleAdd() {
    if (!form.title.trim()) return
    setAdding(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from("goals")
      .insert({
        title: form.title.trim(),
        description: form.description || undefined,
        horizon: form.horizon,
        identity_link: form.identity_link || undefined,
        target_date: form.target_date || undefined,
        status: "active",
        progress: 0,
        days_stalled: 0,
        weekly_micro_actions: [],
      })
      .select()
      .single()

    if (!error && data) {
      setGoals((prev) => [data, ...prev])
      setForm({ title: "", description: "", horizon: "medium", identity_link: "", target_date: "" })
      setShowAddForm(false)
    }

    setAdding(false)
  }

  async function updateProgress(goalId: string, progress: number) {
    const supabase = createClient()
    await supabase.from("goals").update({ progress, updated_at: new Date().toISOString() }).eq("id", goalId)
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, progress } : g)))
  }

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-title text-4xl font-bold tracking-tight">Metas</h1>
          <p className="text-ink-muted text-sm mt-1">
            {activeGoals.length} ativas · {goals.filter((g) => g.status === "completed").length} concluídas
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={cn("btn-primary flex items-center gap-2", showAddForm && "bg-ink hover:bg-gray-800")}
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          Nova meta
        </button>
      </div>

      {/* Stalled warning */}
      {stalledGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-warning-light border border-warning/20 rounded-2xl p-4 mb-6 flex items-start gap-3"
        >
          <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-ink">
              {stalledGoals.length} {stalledGoals.length === 1 ? "meta está" : "metas estão"} parada{stalledGoals.length > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-ink-muted mt-0.5">
              {stalledGoals.map((g) => g.title).join(", ")} — sem progresso há mais de 3 dias.{" "}
              <button
                onClick={() => setNegotiatingGoal(stalledGoals[0])}
                className="text-accent font-medium hover:underline"
              >
                Negociar recuperação
              </button>
            </p>
          </div>
        </motion.div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="card p-6 space-y-4">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder='Meta (ex: "Correr 10km sem parar")'
                className="input font-medium"
                autoFocus
              />
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Por que essa meta importa?"
                className="input"
              />
              <input
                type="text"
                value={form.identity_link}
                onChange={(e) => setForm((f) => ({ ...f, identity_link: e.target.value }))}
                placeholder='Vínculo de identidade (ex: "Sou alguém que cuida da saúde")'
                className="input"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">Horizonte</label>
                  <select
                    value={form.horizon}
                    onChange={(e) => setForm((f) => ({ ...f, horizon: e.target.value as Goal["horizon"] }))}
                    className="input"
                  >
                    <option value="short">Curto prazo (semanas)</option>
                    <option value="medium">Médio prazo (meses)</option>
                    <option value="long">Longo prazo (anos)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">Data alvo</label>
                  <input
                    type="date"
                    value={form.target_date}
                    onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowAddForm(false)} className="btn-ghost">Cancelar</button>
                <button onClick={handleAdd} disabled={adding || !form.title.trim()} className="btn-primary">
                  {adding ? "Salvando..." : "Criar meta"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="card p-16 text-center">
          <Target size={32} className="text-ink-faint mx-auto mb-4" />
          <p className="text-ink-muted">Nenhuma meta definida ainda.</p>
          <button onClick={() => setShowAddForm(true)} className="btn-primary mt-4">
            Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {["short", "medium", "long"].map((horizon) => {
            const hGoals = goals.filter((g) => g.horizon === horizon)
            if (hGoals.length === 0) return null
            return (
              <div key={horizon}>
                <p className="text-xs text-ink-faint uppercase tracking-widest mb-3">
                  {horizonLabel[horizon as Goal["horizon"]]}
                </p>
                <div className="space-y-3">
                  {hGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onUpdateProgress={updateProgress}
                      onNegotiate={() => setNegotiatingGoal(goal)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {negotiatingGoal && (
        <NegotiationModal
          goal={negotiatingGoal}
          onClose={() => setNegotiatingGoal(null)}
        />
      )}
    </div>
  )
}

function GoalCard({
  goal,
  onUpdateProgress,
  onNegotiate,
}: {
  goal: Goal
  onUpdateProgress: (id: string, progress: number) => void
  onNegotiate: () => void
}) {
  const [editingProgress, setEditingProgress] = useState(false)
  const [tempProgress, setTempProgress] = useState(goal.progress)

  const isStalled = goal.days_stalled > 3
  const isCompleted = goal.status === "completed"

  return (
    <motion.div
      layout
      className={cn("card p-5", isCompleted && "opacity-60")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isCompleted ? (
              <CheckCircle2 size={16} className="text-success flex-shrink-0" />
            ) : (
              <Target size={16} className="text-ink-muted flex-shrink-0" />
            )}
            <h3 className="font-semibold text-sm truncate">{goal.title}</h3>
            <span className={`pill ${cn(isStalled ? "bg-warning-light text-warning" : "bg-surface-raised text-ink-muted")}`}>
              {isStalled ? `${goal.days_stalled}d parada` : goal.horizon}
            </span>
          </div>

          {goal.identity_link && (
            <p className="text-xs text-ink-muted italic mb-3">&ldquo;{goal.identity_link}&rdquo;</p>
          )}

          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden cursor-pointer"
              onClick={() => setEditingProgress(!editingProgress)}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  goal.progress >= 80 ? "bg-success" : goal.progress >= 40 ? "bg-accent" : "bg-ink-faint"
                )}
              />
            </div>
            <span className="text-sm font-mono font-medium w-10 text-right">{goal.progress}%</span>
          </div>

          <AnimatePresence>
            {editingProgress && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex items-center gap-3"
              >
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={tempProgress}
                  onChange={(e) => setTempProgress(Number(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => { onUpdateProgress(goal.id, tempProgress); setEditingProgress(false) }}
                  className="btn-primary py-1.5 px-4 text-xs"
                >
                  Salvar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isStalled && !isCompleted && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-warning">
            Sem progresso há {goal.days_stalled} dias
          </p>
          <button onClick={onNegotiate} className="text-xs text-accent font-medium hover:underline flex items-center gap-1">
            <TrendingUp size={11} />
            Negociar recuperação
          </button>
        </div>
      )}
    </motion.div>
  )
}
