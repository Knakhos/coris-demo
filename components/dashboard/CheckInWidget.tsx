"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { CheckIn } from "@/types"
import { cn } from "@/lib/utils/cn"

const metrics = [
  { key: "mood" as const, label: "Humor", emoji: "◐" },
  { key: "energy" as const, label: "Energia", emoji: "⚡" },
  { key: "focus" as const, label: "Foco", emoji: "◎" },
]

export default function CheckInWidget({
  checkIn,
  onComplete,
}: {
  checkIn: CheckIn | null
  onComplete: (ci: CheckIn) => void
}) {
  const [values, setValues] = useState({ mood: 7, energy: 7, focus: 7 })
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(!!checkIn)

  if (done && checkIn) {
    return (
      <div className="card p-5">
        <p className="text-xs text-ink-faint uppercase tracking-widest mb-3">Check-in de hoje</p>
        <div className="flex gap-6">
          {metrics.map((m) => (
            <div key={m.key} className="flex-1 text-center">
              <div className="font-display text-3xl italic text-ink mb-0.5">
                {checkIn[m.key]}
              </div>
              <p className="text-xs text-ink-muted">{m.label}</p>
            </div>
          ))}
        </div>
        {checkIn.notes && (
          <p className="text-xs text-ink-muted mt-3 italic border-t border-border pt-3">
            &ldquo;{checkIn.notes}&rdquo;
          </p>
        )}
      </div>
    )
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, notes: notes || undefined }),
      })
      const data = await res.json()
      if (data.checkIn) {
        onComplete(data.checkIn)
        setDone(true)

        fetch("/api/ai/briefing?refresh=1&trigger=checkin").catch(() => {})
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5">
      <p className="text-xs text-ink-faint uppercase tracking-widest mb-4">
        Check-in de hoje — 3 perguntas rápidas
      </p>

      <div className="space-y-5">
        {metrics.map((metric) => (
          <div key={metric.key}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{metric.label}</span>
              <span className="font-display text-xl italic">{values[metric.key]}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={values[metric.key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [metric.key]: Number(e.target.value) }))
              }
              className="w-full h-1.5 appearance-none bg-surface-raised rounded-full cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-ink-faint mt-1">
              <span>1</span>
              <span>10</span>
            </div>
          </div>
        ))}

        <div>
          <label className="text-sm font-medium block mb-1.5">Nota (opcional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Como você está se sentindo hoje?"
            className="input text-sm py-2"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Salvando..." : "Registrar check-in"}
        </button>
      </div>
    </div>
  )
}
