"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Zap } from "lucide-react"
import type { Task } from "@/types"
import { useAppStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils/cn"

const contextColors: Record<string, string> = {
  work: "badge-work",
  health: "badge-health",
  creativity: "badge-creativity",
  social: "badge-social",
  learning: "badge-learning",
  finance: "badge-finance",
  personal: "badge-personal",
}

export default function TaskCard({ task }: { task: Task }) {
  const { updateTask } = useAppStore()
  const [completing, setCompleting] = useState(false)
  const [done, setDone] = useState(task.status === "done")

  async function handleComplete() {
    if (done || completing) return
    setCompleting(true)

    const supabase = createClient()
    const { error } = await supabase
      .from("tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", task.id)

    if (!error) {
      updateTask(task.id, { status: "done" })
      setDone(true)
    }
    setCompleting(false)
  }

  return (
    <motion.div
      layout
      animate={{ opacity: done ? 0.5 : 1 }}
      className={cn(
        "card-hover p-4 flex items-center gap-3 cursor-pointer group",
        done && "opacity-50"
      )}
    >
      <button
        onClick={handleComplete}
        disabled={completing}
        className={cn(
          "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
          done
            ? "bg-success border-success"
            : "border-border group-hover:border-accent"
        )}
      >
        {done && <Check size={11} className="text-white" strokeWidth={3} />}
        {completing && <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", done && "line-through text-ink-faint")}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-ink-faint truncate mt-0.5">{task.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`pill ${contextColors[task.context_tag]}`}>
          {task.context_tag}
        </span>
        <div className="flex items-center gap-0.5 text-xs text-ink-faint" title="Score IA">
          <Zap size={10} className="text-accent" />
          <span className="font-mono">{task.priority_score.toFixed(1)}</span>
        </div>
        <div
          className="flex items-center gap-0.5 text-xs text-ink-faint"
          title={`Custo energético: ${task.energy_cost}/10`}
        >
          <span className="font-mono">⚡{task.energy_cost}</span>
        </div>
      </div>
    </motion.div>
  )
}
