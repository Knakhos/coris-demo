import type { UserProfile, Task, Goal, CalendarEvent, CheckIn } from "@/types"
import { format, addDays, subDays } from "date-fns"

export const DEMO_PROFILE: UserProfile = {
  id: "demo-user",
  email: "demo@coris.app",
  created_at: new Date().toISOString(),
  onboarding_completed: true,
  shadow_mode_ends_at: null,
  ai_profile: {
    identity_contexts: [
      { label: "Profissional", description: "Trabalha com produto e tecnologia", goals: ["Lançar produto em Q2"], energy_weight: 8 },
      { label: "Atleta", description: "Corre e treina 4x por semana", goals: ["Completar meia maratona"], energy_weight: 6 },
    ],
    energy_windows: [
      { time_start: "09:00", time_end: "12:00", type: "creative", intensity: 9 },
      { time_start: "14:00", time_end: "16:00", type: "mechanical", intensity: 6 },
      { time_start: "19:00", time_end: "21:00", type: "social", intensity: 7 },
    ],
    life_goals: [
      { id: "g1", title: "Lançar produto", horizon: "short", identity_link: "Sou alguém que executa", progress: 40 },
      { id: "g2", title: "Completar meia maratona", horizon: "medium", identity_link: "Sou alguém que cuida do corpo", progress: 60 },
    ],
    current_blockers: ["Reuniões excessivas nas tardes", "Falta de blocos de foco profundo"],
    tried_and_failed: ["Pomodoro sem consistência", "Apps de hábito que abandonou após 2 semanas"],
    productivity_patterns: [
      { pattern: "Mais produtivo entre 9h–12h", confidence: 0.92, observed_at: new Date().toISOString() },
      { pattern: "Tarefas criativas adiadas para tarde — horário de baixa energia", confidence: 0.85, observed_at: new Date().toISOString() },
      { pattern: "Sextas com queda de 30% na conclusão de tarefas", confidence: 0.78, observed_at: new Date().toISOString() },
    ],
    collapse_risk_score: 2,
    last_updated: new Date().toISOString(),
  },
  preferences: {
    theme: "light",
    notification_time: "08:00",
    weekly_replay_day: 1,
    language: "pt-BR",
  },
}

const today = format(new Date(), "yyyy-MM-dd")

export const DEMO_TASKS: Task[] = [
  { id: "t1", user_id: "demo-user", title: "Finalizar especificação do produto v2", status: "pending", priority_score: 9.2, urgency: 9, impact: 10, energy_cost: 8, context_tag: "work", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), due_date: addDays(new Date(), 2).toISOString() },
  { id: "t2", user_id: "demo-user", title: "Revisar métricas de retenção", status: "pending", priority_score: 7.8, urgency: 7, impact: 8, energy_cost: 4, context_tag: "work", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t3", user_id: "demo-user", title: "Treino de corrida — 8km", status: "pending", priority_score: 6.5, urgency: 5, impact: 7, energy_cost: 7, context_tag: "health", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t4", user_id: "demo-user", title: "Responder emails da semana", status: "pending", priority_score: 5.1, urgency: 6, impact: 4, energy_cost: 2, context_tag: "work", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t5", user_id: "demo-user", title: "Ler capítulos 3–5 do livro", status: "pending", priority_score: 3.8, urgency: 2, impact: 5, energy_cost: 3, context_tag: "learning", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "t6", user_id: "demo-user", title: "Preparar apresentação para investidores", status: "done", priority_score: 0, urgency: 10, impact: 10, energy_cost: 9, context_tag: "work", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), completed_at: new Date().toISOString() },
]

export const DEMO_GOALS: Goal[] = [
  { id: "goal1", user_id: "demo-user", title: "Lançar versão beta do produto", horizon: "short", identity_link: "Sou alguém que entrega o que promete", progress: 42, status: "active", target_date: addDays(new Date(), 30).toISOString(), weekly_micro_actions: [], days_stalled: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "goal2", user_id: "demo-user", title: "Completar meia maratona", horizon: "medium", identity_link: "Sou alguém que cuida do corpo", progress: 61, status: "active", target_date: addDays(new Date(), 90).toISOString(), weekly_micro_actions: [], days_stalled: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "goal3", user_id: "demo-user", title: "Ler 24 livros em 2025", horizon: "long", identity_link: "Sou alguém que aprende continuamente", progress: 25, status: "active", weekly_micro_actions: [], days_stalled: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

export const DEMO_EVENTS: CalendarEvent[] = [
  { id: "e1", user_id: "demo-user", title: "Bloco de foco — especificação", start_at: `${today}T09:00:00`, end_at: `${today}T11:00:00`, context_tag: "work", is_protected: true, is_ai_scheduled: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "e2", user_id: "demo-user", title: "Sync com time de engenharia", start_at: `${today}T14:00:00`, end_at: `${today}T15:00:00`, context_tag: "work", is_protected: false, is_ai_scheduled: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "e3", user_id: "demo-user", title: "Treino", start_at: `${today}T18:30:00`, end_at: `${today}T19:30:00`, context_tag: "health", is_protected: true, is_ai_scheduled: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

export const DEMO_CHECK_INS: CheckIn[] = [
  { id: "c1", user_id: "demo-user", date: today, mood: 7, energy: 8, focus: 7, created_at: new Date().toISOString() },
  { id: "c2", user_id: "demo-user", date: format(subDays(new Date(), 1), "yyyy-MM-dd"), mood: 6, energy: 6, focus: 5, created_at: new Date().toISOString() },
  { id: "c3", user_id: "demo-user", date: format(subDays(new Date(), 2), "yyyy-MM-dd"), mood: 8, energy: 9, focus: 8, created_at: new Date().toISOString() },
  { id: "c4", user_id: "demo-user", date: format(subDays(new Date(), 3), "yyyy-MM-dd"), mood: 5, energy: 5, focus: 4, created_at: new Date().toISOString() },
  { id: "c5", user_id: "demo-user", date: format(subDays(new Date(), 4), "yyyy-MM-dd"), mood: 7, energy: 7, focus: 6, created_at: new Date().toISOString() },
  { id: "c6", user_id: "demo-user", date: format(subDays(new Date(), 5), "yyyy-MM-dd"), mood: 8, energy: 8, focus: 9, created_at: new Date().toISOString() },
  { id: "c7", user_id: "demo-user", date: format(subDays(new Date(), 6), "yyyy-MM-dd"), mood: 6, energy: 7, focus: 7, created_at: new Date().toISOString() },
]
