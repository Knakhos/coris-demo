"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths, parseISO
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import type { CalendarEvent, ContextTag } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils/cn"

const contextColors: Record<string, string> = {
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
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-title text-4xl font-bold tracking-tight">Calendário</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          Novo evento
        </button>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
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
                {Object.keys(contextColors).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="protected" checked={form.is_protected} onChange={(e) => setForm((f) => ({ ...f, is_protected: e.target.checked }))} />
              <label htmlFor="protected" className="text-sm">Evento protegido (IA não move)</label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAddForm(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handleAdd} disabled={adding || !form.title.trim()} className="btn-primary">
              {adding ? "Adicionando..." : "Criar evento"}
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Calendar grid */}
        <div className="card p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-raised transition-colors">
              <ChevronLeft size={16} />
            </button>
            <h2 className="font-semibold capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-raised transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs text-ink-faint font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
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
                    "bg-white p-2 min-h-[72px] text-left transition-colors hover:bg-surface-raised",
                    !isCurrentMonth && "bg-gray-50/50",
                    isSelected && "bg-accent-light ring-2 ring-inset ring-accent/30"
                  )}
                >
                  <span className={cn(
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                    todayDay && "bg-accent text-white",
                    !isCurrentMonth && "text-ink-faint"
                  )}>
                    {format(day, "d")}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className={cn("text-[10px] px-1 py-0.5 rounded truncate text-white", contextColors[e.context_tag])}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-ink-faint px-1">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Day detail */}
        <div className="space-y-4">
          {selectedDay && (
            <div className="card p-5">
              <h3 className="font-semibold text-sm mb-1 capitalize">
                {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>

              {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 ? (
                <p className="text-ink-faint text-sm py-4">Dia sem compromissos.</p>
              ) : (
                <div className="space-y-2 mt-3">
                  {selectedDayEvents.map((e) => (
                    <div key={e.id} className="flex items-start gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", contextColors[e.context_tag])} />
                      <div>
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-ink-faint">
                          {format(parseISO(e.start_at), "HH:mm")} – {format(parseISO(e.end_at), "HH:mm")}
                          {e.is_protected && " · Protegido"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {selectedDayTasks.length > 0 && (
                    <>
                      <div className="border-t border-border pt-2 mt-2">
                        <p className="text-xs text-ink-faint mb-2">Tarefas com prazo</p>
                        {selectedDayTasks.map((t) => (
                          <div key={t.id} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm border border-border" />
                            <p className="text-sm">{t.title}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
