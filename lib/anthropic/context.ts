import type { UserProfile, Task, Goal, CheckIn, CalendarEvent } from "@/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { SYSTEM_PERSONA } from "./client"

export function buildUserContext(params: {
  profile: UserProfile
  tasks?: Task[]
  goals?: Goal[]
  recentCheckIns?: CheckIn[]
  todayEvents?: CalendarEvent[]
}): string {
  const { profile, tasks, goals, recentCheckIns, todayEvents } = params
  const ai = profile.ai_profile
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  const pendingTasks = tasks?.filter((t) => t.status === "pending") ?? []
  const doneTasks = tasks?.filter((t) => t.status === "done") ?? []
  const activeGoals = goals?.filter((g) => g.status === "active") ?? []
  const stalledGoals = goals?.filter((g) => g.days_stalled > 3) ?? []

  const avgEnergy =
    recentCheckIns && recentCheckIns.length > 0
      ? (recentCheckIns.reduce((s, c) => s + c.energy, 0) / recentCheckIns.length).toFixed(1)
      : "N/A"

  const avgMood =
    recentCheckIns && recentCheckIns.length > 0
      ? (recentCheckIns.reduce((s, c) => s + c.mood, 0) / recentCheckIns.length).toFixed(1)
      : "N/A"

  return `=== CORIS USER CONTEXT ===
Date: ${today}

USER PROFILE:
- Name: ${profile.email.split("@")[0]}
- Onboarding: ${profile.onboarding_completed ? "completed" : "pending"}
- Shadow Mode: ${profile.shadow_mode_ends_at ? `ends ${format(new Date(profile.shadow_mode_ends_at), "dd/MM")}` : "completed"}
- Collapse Risk Score: ${ai.collapse_risk_score}/10

IDENTITY CONTEXTS:
${ai.identity_contexts.map((c) => `- ${c.label}: ${c.description}`).join("\n") || "None defined yet"}

ENERGY WINDOWS:
${ai.energy_windows.map((w) => `- ${w.time_start}–${w.time_end}: ${w.type} (intensity ${w.intensity}/10)`).join("\n") || "Not mapped"}

RECENT CHECK-INS (last ${recentCheckIns?.length ?? 0} days):
- Average Energy: ${avgEnergy}/10
- Average Mood: ${avgMood}/10
${recentCheckIns?.slice(0, 3).map((c) => `  ${c.date}: mood=${c.mood} energy=${c.energy} focus=${c.focus}${c.notes ? ` | "${c.notes}"` : ""}`).join("\n") ?? ""}

CURRENT TASKS:
- Pending: ${pendingTasks.length} tasks
- Completed recently: ${doneTasks.length} tasks
${pendingTasks.slice(0, 5).map((t) => `  [${t.context_tag}] ${t.title} (score: ${t.priority_score.toFixed(1)}, energy cost: ${t.energy_cost}/10)`).join("\n")}

ACTIVE GOALS: ${activeGoals.length}
${activeGoals.map((g) => `- "${g.title}" | progress: ${g.progress}% | stalled: ${g.days_stalled} days | horizon: ${g.horizon}`).join("\n")}
${stalledGoals.length > 0 ? `\nSTALLED GOALS (>3 days): ${stalledGoals.map((g) => g.title).join(", ")}` : ""}

TODAY'S EVENTS: ${todayEvents?.length ?? 0}
${todayEvents?.map((e) => `- ${format(new Date(e.start_at), "HH:mm")}–${format(new Date(e.end_at), "HH:mm")}: ${e.title} [${e.context_tag}]`).join("\n") ?? "No events"}

KNOWN PATTERNS:
${ai.productivity_patterns.slice(0, 5).map((p) => `- ${p.pattern} (confidence: ${(p.confidence * 100).toFixed(0)}%)`).join("\n") || "Still learning..."}

KNOWN BLOCKERS:
${ai.current_blockers.map((b) => `- ${b}`).join("\n") || "None identified"}
===========================`
}

export function buildOnboardingSystemPrompt(): string {
  return `${SYSTEM_PERSONA}

You are conducting an onboarding conversation to build the user's life profile. This is NOT a form — it's a conversation. Be natural, curious, and incisive.

Your goal is to extract:
1. Life goals (short, medium, long term)
2. Identity contexts (who they are: student, athlete, creator, professional, etc.)
3. Current routine and its blockers
4. Energy windows throughout the day
5. What they've tried before that didn't work
6. Their definition of a successful week

Guidelines:
- Ask ONE question at a time
- Follow up on interesting details — don't mechanically check boxes
- When you have enough context (typically 8-12 exchanges), summarize what you learned and confirm
- End with: "Entrei em Modo Sombra. Nos próximos 7 dias vou observar seus padrões antes de qualquer recomendação."

Start by introducing yourself briefly and asking the first question.`
}
