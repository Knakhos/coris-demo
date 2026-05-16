"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, CheckCircle2 } from "lucide-react"
import type { Goal, NegotiationPlan } from "@/types"
import { cn } from "@/lib/utils/cn"

export default function NegotiationModal({
  goal,
  onClose,
}: {
  goal: Goal
  onClose: () => void
}) {
  const [plans, setPlans] = useState<NegotiationPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    generatePlans()
  }, [])

  async function generatePlans() {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Gere 3 planos de recuperação para a meta "${goal.title}" que está parada há ${goal.days_stalled} dias.
Para cada plano, retorne um JSON no formato:
[
  {
    "id": "plan-1",
    "title": "Título do plano",
    "description": "Descrição do que o plano implica",
    "cost": "Qual área será sacrificada",
    "affected_areas": ["area1", "area2"],
    "recovery_days": número_de_dias
  }
]
Retorne APENAS o JSON, sem texto adicional.`,
            },
          ],
        }),
      })

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No reader")

      let accumulated = ""
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") break
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) accumulated += parsed.text
            } catch {}
          }
        }
      }

      const jsonMatch = accumulated.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        setPlans(JSON.parse(jsonMatch[0]))
      }
    } catch {
      setPlans([
        {
          id: "plan-1",
          title: "Recuperação gradual",
          description: "Retome com 30 minutos por dia, sem pressão de recuperar o atraso",
          cost: "Progresso mais lento no curto prazo",
          affected_areas: ["tempo livre"],
          recovery_days: 14,
        },
        {
          id: "plan-2",
          title: "Sprint de recuperação",
          description: "Uma semana de foco intenso na meta, sacrificando atividades sociais",
          cost: "Energia social por 7 dias",
          affected_areas: ["social", "lazer"],
          recovery_days: 7,
        },
        {
          id: "plan-3",
          title: "Reformulação da meta",
          description: "Revisar o formato e reduzir o escopo para torná-la realizável",
          cost: "Metas menores no curto prazo",
          affected_areas: ["expectativas"],
          recovery_days: 3,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleAccept() {
    if (!selected) return
    setAccepted(true)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.25 }}
        className="relative bg-white rounded-3xl shadow-modal w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-border px-6 py-5 rounded-t-3xl flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Negociação de meta</h2>
            <p className="text-xs text-ink-muted mt-0.5 truncate max-w-sm">{goal.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-faint hover:bg-surface-raised">
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          {!accepted ? (
            <>
              <p className="text-sm text-ink-muted mb-6">
                Você está <strong className="text-ink">{goal.days_stalled} dias</strong> sem progresso.
                Escolha um plano de recuperação — cada um tem um custo real em outras áreas.
              </p>

              {loading ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Loader2 size={24} className="animate-spin text-accent" />
                  <p className="text-sm text-ink-muted">Calculando planos de recuperação...</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {plans.map((plan) => (
                    <motion.button
                      key={plan.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelected(plan.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border-2 transition-all",
                        selected === plan.id
                          ? "border-accent bg-accent-light"
                          : "border-border hover:border-accent/40"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm">{plan.title}</h3>
                        <span className="pill bg-surface-raised text-ink-muted text-xs flex-shrink-0">
                          {plan.recovery_days}d
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted leading-relaxed mb-2">{plan.description}</p>
                      <p className="text-xs text-warning font-medium">
                        Custo: {plan.cost}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}

              <button
                onClick={handleAccept}
                disabled={!selected || loading}
                className="btn-primary w-full"
              >
                Aceitar plano
              </button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-12 gap-4 text-center"
            >
              <CheckCircle2 size={40} className="text-success" />
              <p className="font-semibold">Plano aceito</p>
              <p className="text-sm text-ink-muted">Ajustando sua agenda em torno da meta...</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
