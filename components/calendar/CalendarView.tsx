"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths, parseISO
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import type { CalendarEvent, ContextTag } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils/cn"

const contextChip: Record<string, string> = {
  work: "bg-blue-100/80 text-blue-700",
  health: "bg-green-100/80 text-green-700",
  creativity: "bg-purple-100/80 text-purple-700",
  social: "bg-orange-100/80 text-orange-700",
  learning: "bg-yellow-100/80 text-yellow-700",
  finance: "bg-emerald-100/80 text-emerald-700",
  personal: "bg-gray-100/80 text-gray-600",
}

const contextDot: Record<string, string> = {
  work: "bg-blue-400",
  health: "bg-green-400",
  creativity: "bg-purple-400",
  social: "bg-orange-400",
  learning: "bg-yellow-400",
  finance: "bg-emerald-400",
  personal: "bg-gray-400",
}

interface Props {
  events: CalendarEvent[]
  tasks: { id: string; title: string; due_date?: string; context_tag: string }[]
}

export default function CalendarView({ events: initialEvents, tasks }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    title: "",
    context_tag: "work" as ContextTag,
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "09:00",
    end_time: "10:00",
    is_protected: false,
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })
  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

  const selectedDayEvents = selectedDay
    ? events.filter((e) => isSameDay(parseISO(e.start_at), selectedDay))
    : []

  const selectedDayTasks = selectedDay
    ? tasks.filter((t) => t.due_date && isSameDay(parseISO(t.due_date), selectedDay))
    : []

  function getDayEvents(day: Date) {
    return events.filter((e) => isSameDay(parseISO(e.start_at), day))
  }

  async function handleAdd() {
    if (!form.title.trim()) return
    setAdding(true)

    const supabase = createClient()
    const startAt = `${form.date}T${form.start_time}:00`
    const endAt = `${form.date}T${form.end_time}:00`

    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        title: form.title.trim(),
        context_tag: form.context_tag,
        start_at: startAt,
        end_at: endAt,
        is_protected: form.is_protected,
        is_ai_scheduled: false,
      })
      .select()
      .single()

    if (!error && data) {
      setEvents((prev) => [...prev, data])
      setForm({ title: "", context_tag: "work", date: format(selectedDay ?? new Date(), "yyyy-MM-dd"), start_time: "09:00", end_time: "10:00", is_protected: false })
      setShowAddForm(false)
    }

    setAdding(false)
  }

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-title text-4xl font-bold tracking-tight">Calendário</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showAddForm ? <X size={15} /> : <Plus size={15} />}
          Novo evento
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="card p-5 mb-6 space-y-4"
          >
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Título do evento"
              className="input"
              autoFocus
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Data</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Início</label>
                <input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Fim</label>
                <input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Contexto</label>
                <select value={form.context_tag} onChange={(e) => setForm((f) => ({ ...f, context_tag: e.target.value as ContextTag }))} className="input">
                  {Object.keys(contextChip).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <input type="checkbox" id="protected" checked={form.is_protected} onChange={(e) => setForm((f) => ({ ...f, is_protected: e.target.checked }))} />
                <label htmlFor="protected" className="text-sm text-ink-muted">IA não move este evento</label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddForm(false)} className="btn-ghost">Cancelar</button>
              <button onClick={handleAdd} disabled={adding || !form.title.trim()} className="btn-primary">
                {adding ? "Criando..." : "Criar evento"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="grid lg:grid-cols-[1fr_256px] gap-6 items-start">

        {/* Calendar — sem card externo */}
        <div>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-muted
                         hover:bg-white/70 hover:text-ink transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="font-semibold text-base capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-muted
                         hover:bg-white/70 hover:text-ink transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1.5">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-[11px] text-ink-faint font-medium py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells — separados por linhas, sem caixas */}
          <div className="grid grid-cols-7 border-l border-t border-black/[0.06]">
            {days.map((day) => {
              const dayEvents = getDayEvents(day)
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const todayDay = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "border-r border-b border-black/[0.06] p-2 min-h-[88px] text-left",
                    "hover:bg-white/30 transition-colors duration-150",
                    !isCurrentMonth && "opacity-30",
                    isSelected && "bg-accent/10"
                  )}
                >
                  {/* Número no canto superior direito */}
                  <div className="flex justify-end mb-1.5">
                    <span className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-all",
                      todayDay && "bg-accent text-ink font-semibold",
                      !todayDay && isCurrentMonth && "text-ink-muted",
                      !todayDay && !isCurrentMonth && "text-ink-faint"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium leading-snug",
                          contextChip[e.context_tag]
                        )}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-ink-faint pl-0.5">
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Day detail */}
        <div className="sticky top-8">
          <AnimatePresence mode="wait">
            {selectedDay && (
              <motion.div
                key={selectedDay.toISOString()}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="card p-5"
              >
                <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wide mb-1">
                  {format(selectedDay, "EEEE", { locale: ptBR })}
                </p>
                <p className="font-semibold text-lg leading-tight mb-4">
                  {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                </p>

                {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 ? (
                  <p className="text-ink-faint text-sm py-2">Sem compromissos.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDayEvents.map((e) => (
                      <div key={e.id} className="flex items-start gap-2.5">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                          contextDot[e.context_tag]
                        )} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug">{e.title}</p>
                          <p className="text-[11px] text-ink-faint mt-0.5">
                            {format(parseISO(e.start_at), "HH:mm")} – {format(parseISO(e.end_at), "HH:mm")}
                            {e.is_protected && <span className="ml-1 text-accent">· protegido</span>}
                          </p>
                        </div>
                      </div>
                    ))}

                    {selectedDayTasks.length > 0 && (
                      <div className={cn(
                        selectedDayEvents.length > 0 && "border-t border-white/50 pt-3 mt-1"
                      )}>
                        <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wide mb-2">
                          Prazos
                        </p>
                        {selectedDayTasks.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 mb-1.5">
                            <div className="w-3.5 h-3.5 rounded-sm border border-border/60 flex-shrink-0" />
                            <p className="text-sm text-ink-muted leading-snug">{t.title}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
