import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { anthropic, MODEL, SYSTEM_PERSONA } from "@/lib/anthropic/client"
import { buildUserContext } from "@/lib/anthropic/context"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = format(new Date(), "yyyy-MM-dd")

  const existing = await supabase
    .from("ai_briefings")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single()

  if (existing.data && !request.nextUrl.searchParams.get("refresh")) {
    return NextResponse.json({ briefing: existing.data })
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

  const briefingPrompt = `${userContext}

Generate a daily briefing for the user. Rules:
- 3 to 5 lines maximum. No more.
- In pt-BR (Brazilian Portuguese)
- Analytical, not motivational. Ground every sentence in actual data.
- If you notice a pattern, name it specifically. Example: "tarefas criativas empurradas para tarde" not "você tem dificuldade com criatividade"
- If you took any action or recommendation, state it directly. "Reorganizei sua manhã." not "Sugiro reorganizar..."
- No emojis, no exclamation points, no hollow phrases
- Write in first-person plural perspective when referencing Coris actions ("Reorganizei", "Movi", "Protegi")
- Tone: like a high-performance coach who has your data and respects your time`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEM_PERSONA,
    messages: [{ role: "user", content: briefingPrompt }],
  })

  const content = response.content[0]
  if (content.type !== "text") {
    return NextResponse.json({ error: "Failed to generate briefing" }, { status: 500 })
  }

  const briefingText = content.text

  const { data: savedBriefing, error } = await supabase
    .from("ai_briefings")
    .insert({
      user_id: user.id,
      date: today,
      content: briefingText,
      trigger: request.nextUrl.searchParams.get("trigger") ?? "morning",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ briefing: { content: briefingText, date: today } })
  }

  return NextResponse.json({ briefing: savedBriefing })
}
