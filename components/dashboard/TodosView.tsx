"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Zap, Filter } from "lucide-react"
import type { Task, ContextTag } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { sortTasksByPriority, computePriorityScore } from "@/lib/utils/priority"
import TaskCard from "./TaskCard"
import { cn } from "@/lib/utils/cn"

const contextTags: ContextTag[] = ["work", "health", "creativity", "social", "learning", "finance", "personal"]

interface Props {
  initialTasks: Task[]
  goals: { id: string; title: string }[]
  currentEnergy: number
}

export default function TodosView({ initialTasks, goals, currentEnergy }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending")
  const [contextFilter, setContextFilter] = useState<ContextTag | "all">("all")
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    context_tag: "work" as ContextTag,
    urgency: 5,
    impact: 5,
    energy_cost: 3,
    due_date: "",
    goal_id: "",
  })

  const filteredTasks = tasks
    .filter((t) => {
      if (filter === "pending") return t.status === "pending"
      if (filter === "done") return t.status === "done"
      return true
    })
    .filter((t) => contextFilter === "all" || t.context_tag === contextFilter)

  const sortedTasks = sortTasksByPriority(filteredTasks, currentEnergy)

  async function handleAdd() {
    if (!form.title.trim()) return
    setAdding(true)

    const supabase = createClient()
    const score = computePriorityScore(
      { urgency: form.urgency, impact: form.impact, energy_cost: form.energy_cost, due_date: form.due_date || undefined },
      currentEnergy
    )

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: form.title.trim(),
        description: form.description || undefined,
        context_tag: form.context_tag,
        urgency: form.urgency,
        impact: form.impact,
        energy_cost: form.energy_cost,
        due_date: form.due_date || undefined,
        goal_id: form.goal_id || undefined,
        priority_score: score,
        status: "pending",
      })
      .select()
      .single()

    if (!error && data) {
      setTasks((prev) => [...prev, data])
      setForm({ title: "", description: "", context_tag: "work", urgency: 5, impact: 5, energy_cost: 3, due_date: "", goal_id: "" })
      setShowAddForm(false)
    }

    setAdding(false)
  }

  const pendingCount = tasks.filter((t) => t.status === "pending").length
  const doneCount = tasks.filter((t) => t.status === "done").length

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-title text-4xl font-bold tracking-tight">To-Do</h1>
          <p className="text-ink-muted text-sm mt-1">
            {pendingCount} pendentes · {doneCount} concluídas
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={cn("btn-primary flex items-center gap-2", showAddForm && "bg-ink hover:bg-gray-800")}
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? "Cancelar" : "Nova tarefa"}
        </button>
      </div>

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
                placeholder="Título da tarefa"
                className="input font-medium"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descrição (opcional)"
                className="input"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">Contexto</label>
                  <select
                    value={form.context_tag}
                    onChange={(e) => setForm((f) => ({ ...f, context_tag: e.target.value as ContextTag }))}
                    className="input"
                  >
                    {contextTags.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-ink-muted mb-1 block">Meta vinculada</label>
                  <select
                    value={form.goal_id}
                    onChange={(e) => setForm((f) => ({ ...f, goal_id: e.target.value }))}
                    className="input"
                  >
                    <option value="">Nenhuma</option>
                    {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: "urgency" as const, label: "Urgência" },
                  { key: "impact" as const, label: "Impacto" },
                  { key: "energy_cost" as const, label: "Custo energético" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-ink-muted mb-1 block">
                      {field.label}: <strong>{form[field.key]}</strong>/10
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={form[field.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs text-ink-muted mb-1 block">Data limite (opcional)</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowAddForm(false)} className="btn-ghost">Cancelar</button>
                <button onClick={handleAdd} disabled={adding || !form.title.trim()} className="btn-primary">
                  {adding ? "Adicionando..." : "Adicionar tarefa"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex bg-surface-raised rounded-xl p-1 border border-border">
          {[["pending", "Pendentes"], ["done", "Concluídas"], ["all", "Todas"]].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v as typeof filter)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                filter === v ? "bg-white shadow-sm text-ink" : "text-ink-muted hover:text-ink"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={12} className="text-ink-faint" />
          {(["all", ...contextTags] as const).map((tag) => (
            <button
              key={tag}
              onClick={() => setContextFilter(tag)}
              className={cn(
                "pill transition-all",
                contextFilter === tag
                  ? "bg-ink text-white"
                  : "bg-surface-raised text-ink-muted hover:bg-gray-100"
              )}
            >
              {tag === "all" ? "Todos" : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex items-center gap-1.5 mb-3">
        <Zap size={12} className="text-accent" />
        <span className="text-xs text-ink-muted">Ordenado por score IA (urgência × impacto × energia atual)</span>
      </div>

      <AnimatePresence mode="popLayout">
        {sortedTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-12 text-center"
          >
            <p className="text-ink-muted">
              {filter === "pending" ? "Nenhuma tarefa pendente." : "Nenhuma tarefa aqui."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
              >
                <TaskCard task={task} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
