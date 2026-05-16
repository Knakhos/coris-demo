"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Check, SlidersHorizontal, BookOpen, ChevronDown, ChevronUp, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils/cn"

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
}

interface Question {
  id: string
  text: string
  category: string
  active: boolean
}

const QUESTION_BANK: Question[] = [
  { id: "q_water", text: "Bebeu 3L de água", category: "Saúde", active: true },
  { id: "q_exercise", text: "Treinou hoje", category: "Saúde", active: true },
  { id: "q_sleep", text: "Dormiu bem", category: "Saúde", active: false },
  { id: "q_nutrition", text: "Comeu bem o dia todo", category: "Saúde", active: false },
  { id: "q_no_alcohol", text: "Ficou sem álcool", category: "Saúde", active: false },
  { id: "q_no_sugar", text: "Evitou açúcar", category: "Saúde", active: false },
  { id: "q_productive", text: "Fez algo produtivo", category: "Produtividade", active: true },
  { id: "q_no_procrastinate", text: "Não procrastinou", category: "Produtividade", active: true },
  { id: "q_deep_work", text: "Teve 1h+ de foco profundo", category: "Produtividade", active: false },
  { id: "q_inbox", text: "Zerou a caixa de entrada", category: "Produtividade", active: false },
  { id: "q_no_phone_morning", text: "Ficou sem celular na primeira hora", category: "Produtividade", active: false },
  { id: "q_planned", text: "Planejou o dia com antecedência", category: "Produtividade", active: false },
  { id: "q_grateful", text: "Foi grato", category: "Mente", active: true },
  { id: "q_meditated", text: "Meditou ou respirou com atenção", category: "Mente", active: false },
  { id: "q_read", text: "Leu por pelo menos 15 minutos", category: "Mente", active: false },
  { id: "q_no_news", text: "Evitou notícias negativas", category: "Mente", active: false },
  { id: "q_reflection", text: "Refletiu sobre o dia", category: "Mente", active: false },
  { id: "q_helped", text: "Ajudou alguém", category: "Relacionamentos", active: false },
  { id: "q_quality_time", text: "Teve tempo de qualidade com alguém", category: "Relacionamentos", active: false },
  { id: "q_kind", text: "Foi gentil com alguém", category: "Relacionamentos", active: false },
  { id: "q_no_conflict", text: "Evitou conflitos desnecessários", category: "Relacionamentos", active: false },
  { id: "q_no_impulse", text: "Não fez compra por impulso", category: "Finanças", active: false },
  { id: "q_tracked", text: "Registrou seus gastos do dia", category: "Finanças", active: false },
]

const CATEGORY_ORDER = ["Saúde", "Produtividade", "Mente", "Relacionamentos", "Finanças"]

function BigSlider({ label, value, onChange }: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-title text-3xl font-bold tabular-nums">{value}</span>
      </div>
      <div className="relative h-3 rounded-full bg-black/[0.07] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-150"
          style={{ width: `${(value / 10) * 100}%` }}
        />
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <div className="flex justify-between text-[10px] text-ink-faint">
        <span>1</span>
        <span>10</span>
      </div>
    </div>
  )
}

function HabitCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange() }}
      className={cn(
        "w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150",
        checked ? "bg-accent border-accent" : "border-black/20 bg-white/20 hover:border-accent/50"
      )}
    >
      {checked && <Check size={13} strokeWidth={3} className="text-ink" />}
    </button>
  )
}

export default function JournalView() {
  const [mode, setMode] = useState<"answer" | "customize">("answer")
  const [questions, setQuestions] = useState<Question[]>(QUESTION_BANK)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORY_ORDER))
  const [submitted, setSubmitted] = useState(false)
  const [scales, setScales] = useState({ mood: 7, energy: 7, focus: 7 })
  const [answers, setAnswers] = useState<Record<string, boolean>>({})

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })
  const activeQuestions = questions.filter((q) => q.active)

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const qs = questions.filter((q) => q.category === cat)
    if (qs.length) acc[cat] = qs
    return acc
  }, {} as Record<string, Question[]>)

  function toggleQuestion(id: string) {
    setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, active: !q.active } : q))
  }

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function toggleAnswer(id: string) {
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="max-w-6xl px-8 py-8">
      <motion.div initial="hidden" animate="visible" variants={stagger}>

        <motion.div variants={fadeUp} className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-title text-4xl font-bold tracking-tight">Journal</h1>
            <p className="text-ink-muted text-sm mt-1 capitalize">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("answer")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                mode === "answer" ? "bg-accent text-ink" : "text-ink-muted hover:text-ink hover:bg-white/20"
              )}
            >
              <BookOpen size={14} />
              Responder
            </button>
            <button
              onClick={() => setMode("customize")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                mode === "customize" ? "bg-accent text-ink" : "text-ink-muted hover:text-ink hover:bg-white/20"
              )}
            >
              <SlidersHorizontal size={14} />
              Personalizar
            </button>
          </div>
        </motion.div>

        {mode === "answer" && (
          <div>
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-12 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
                  <Check size={22} className="text-success" />
                </div>
                <h2 className="font-title text-2xl mb-2">Journal de hoje registrado.</h2>
                <p className="text-ink-muted text-sm">A IA irá analisar suas respostas e enriquecer seu contexto.</p>
                <button onClick={() => setSubmitted(false)} className="btn-ghost mt-6 text-sm">
                  Editar respostas
                </button>
              </motion.div>
            ) : (
              <div className="space-y-5">
                <motion.div variants={fadeUp} className="card p-6">
                  <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-widest mb-6">
                    Como você está agora
                  </p>
                  <div className="grid grid-cols-3 gap-10">
                    {[
                      { key: "mood" as const, label: "Humor" },
                      { key: "energy" as const, label: "Energia" },
                      { key: "focus" as const, label: "Foco" },
                    ].map((s) => (
                      <BigSlider
                        key={s.key}
                        label={s.label}
                        value={scales[s.key]}
                        onChange={(v) => setScales((prev) => ({ ...prev, [s.key]: v }))}
                      />
                    ))}
                  </div>
                </motion.div>

                {activeQuestions.length === 0 ? (
                  <motion.div variants={fadeUp} className="card p-8 text-center">
                    <p className="text-ink-muted text-sm mb-3">Nenhuma pergunta ativa.</p>
                    <button onClick={() => setMode("customize")} className="btn-primary text-sm">
                      Personalizar journal
                    </button>
                  </motion.div>
                ) : (
                  <motion.div variants={fadeUp} className="card divide-y divide-black/[0.05]">
                    <div className="px-6 pt-5 pb-4">
                      <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-widest">
                        Hábitos do dia — {Object.values(answers).filter(Boolean).length}/{activeQuestions.length}
                      </p>
                    </div>
                    {activeQuestions.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => toggleAnswer(q.id)}
                        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        <span className={cn(
                          "text-sm transition-colors select-none",
                          answers[q.id] ? "line-through text-ink-muted" : "text-ink"
                        )}>
                          {q.text}
                        </span>
                        <HabitCheckbox
                          checked={!!answers[q.id]}
                          onChange={() => toggleAnswer(q.id)}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}

                <motion.div variants={fadeUp} className="flex justify-end">
                  <button onClick={() => setSubmitted(true)} className="btn-primary px-8">
                    Salvar journal
                  </button>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {mode === "customize" && (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted mb-4">
              {activeQuestions.length} pergunta{activeQuestions.length !== 1 ? "s" : ""} ativa{activeQuestions.length !== 1 ? "s" : ""}
            </p>

            {Object.entries(grouped).map(([cat, qs]) => (
              <div key={cat} className="card overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{cat}</span>
                    <span className="text-[10px] text-ink-faint bg-white/20 px-2 py-0.5 rounded-full">
                      {qs.filter((q) => q.active).length}/{qs.length}
                    </span>
                  </div>
                  {expandedCategories.has(cat)
                    ? <ChevronUp size={14} className="text-ink-faint" />
                    : <ChevronDown size={14} className="text-ink-faint" />
                  }
                </button>

                {expandedCategories.has(cat) && (
                  <div className="divide-y divide-black/[0.05]">
                    {qs.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between px-4 py-3.5 hover:bg-white/10 transition-colors"
                      >
                        <p className="text-sm flex-1 mr-4">{q.text}</p>
                        <button
                          onClick={() => toggleQuestion(q.id)}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                            q.active ? "bg-accent text-ink" : "bg-white/20 text-ink-faint hover:bg-white/30"
                          )}
                        >
                          {q.active ? <X size={13} /> : <Plus size={13} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </motion.div>
    </div>
  )
}
