import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getLongModel } from "@/lib/ai/client"
import { buildUserContext } from "@/lib/ai/context"
import { format, subDays } from "date-fns"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = format(new Date(), "yyyy-MM-dd")

  if (!request.nextUrl.searchParams.get("refresh")) {
    const existing = await supabase
      .from("ai_briefings")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .order("generated_at", { ascending: false })
      .limit(1)
      .single()

    if (existing.data) {
      return NextResponse.json({ briefing: existing.data })
    }
  }

  const [profileResult, tasksResult, goalsResult, checkInsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("tasks").select("*").eq("user_id", user.id).neq("status", "cancelled").limit(20),
    supabase.from("goals").select("*").eq("user_id", user.id),
    supabase.from("check_ins").select("*").eq("user_id", user.id)
      .gte("date", format(subDays(new Date(), 7), "yyyy-MM-dd"))
      .order("date", { ascending: false }),
  ])

  if (!profileResult.data?.onboarding_completed) {
    return NextResponse.json({ briefing: null })
  }

  const userContext = buildUserContext({
    profile: profileResult.data,
    tasks: tasksResult.data ?? [],
    goals: goalsResult.data ?? [],
    recentCheckIns: checkInsResult.data ?? [],
  })

  const prompt = `${userContext}

Gere um briefing diário para o usuário. Regras:
- Máximo 4 linhas. Nada mais.
- Em português brasileiro.
- Analítico, nunca motivacional. Cada frase baseada em dados reais.
- Se identificar um padrão, nomeie especificamente. Ex: "tarefas criativas empurradas para tarde" não "você tem dificuldade com criatividade"
- Se tomou alguma ação ou recomendação, diga diretamente. "Reorganizei sua manhã." não "Sugiro reorganizar..."
- Sem emojis, sem exclamações, sem frases vazias
- Tom: coach de alta performance com seus dados, sem tempo a perder`

  const model = getLongModel()
  const result = await model.generateContent(prompt)
  const briefingText = result.response.text()

  const { data: savedBriefing } = await supabase
    .from("ai_briefings")
    .insert({
      user_id: user.id,
      date: today,
      content: briefingText,
      trigger: request.nextUrl.searchParams.get("trigger") ?? "morning",
    })
    .select()
    .single()

  return NextResponse.json({ briefing: savedBriefing ?? { content: briefingText, date: today } })
}
