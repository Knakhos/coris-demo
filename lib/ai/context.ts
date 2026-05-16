import type { UserProfile, Task, Goal, CheckIn, CalendarEvent } from "@/types"
import { format, subDays } from "date-fns"
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

  return `=== CONTEXTO DO USUÁRIO CORIS ===
Data: ${today}

PERFIL:
- Email: ${profile.email.split("@")[0]}
- Onboarding: ${profile.onboarding_completed ? "concluído" : "pendente"}
- Score de risco de colapso: ${ai?.collapse_risk_score ?? 0}/10

CONTEXTOS DE IDENTIDADE:
${ai?.identity_contexts?.map((c) => `- ${c.label}: ${c.description}`).join("\n") || "Nenhum definido ainda"}

JANELAS DE ENERGIA:
${ai?.energy_windows?.map((w) => `- ${w.time_start}–${w.time_end}: ${w.type} (intensidade ${w.intensity}/10)`).join("\n") || "Não mapeadas"}

CHECK-INS RECENTES (últimos ${recentCheckIns?.length ?? 0} dias):
- Energia média: ${avgEnergy}/10
- Humor médio: ${avgMood}/10
${recentCheckIns?.slice(0, 3).map((c) => `  ${c.date}: humor=${c.mood} energia=${c.energy} foco=${c.focus}${c.notes ? ` | "${c.notes}"` : ""}`).join("\n") ?? ""}

TAREFAS ATUAIS:
- Pendentes: ${pendingTasks.length}
- Concluídas recentemente: ${doneTasks.length}
${pendingTasks.slice(0, 5).map((t) => `  [${t.context_tag}] ${t.title} (score: ${t.priority_score.toFixed(1)}, custo energético: ${t.energy_cost}/10)`).join("\n")}

METAS ATIVAS: ${activeGoals.length}
${activeGoals.map((g) => `- "${g.title}" | progresso: ${g.progress}% | parada há: ${g.days_stalled} dias | horizonte: ${g.horizon}`).join("\n")}
${stalledGoals.length > 0 ? `\nMETAS PARADAS (>3 dias): ${stalledGoals.map((g) => g.title).join(", ")}` : ""}

EVENTOS DE HOJE: ${todayEvents?.length ?? 0}
${todayEvents?.map((e) => `- ${format(new Date(e.start_at), "HH:mm")}–${format(new Date(e.end_at), "HH:mm")}: ${e.title} [${e.context_tag}]`).join("\n") ?? "Sem eventos"}

PADRÕES IDENTIFICADOS:
${ai?.productivity_patterns?.slice(0, 5).map((p) => `- ${p.pattern} (confiança: ${(p.confidence * 100).toFixed(0)}%)`).join("\n") || "Ainda aprendendo..."}
===========================`
}

export function buildOnboardingSystemPrompt(): string {
  return `${SYSTEM_PERSONA}

Você está conduzindo uma conversa de onboarding para construir o perfil de vida do usuário. Isso NÃO é um formulário — é uma conversa. Seja natural, curioso e incisivo.

Seu objetivo é extrair:
1. Metas de vida (curto, médio e longo prazo)
2. Contextos de identidade (quem ele é: estudante, atleta, criador, profissional, etc.)
3. Rotina atual e seus bloqueios
4. Janelas de energia ao longo do dia
5. O que já tentou antes que não funcionou
6. Definição de semana bem-sucedida

Diretrizes:
- Faça UMA pergunta por vez
- Aprofunde em detalhes interessantes — não marque caixas mecanicamente
- Quando tiver contexto suficiente (tipicamente 8-12 trocas), resuma o que aprendeu e confirme
- Termine com: "Entrei em Modo Sombra. Nos próximos 7 dias vou observar seus padrões antes de qualquer recomendação."

Comece se apresentando brevemente e fazendo a primeira pergunta.`
}
