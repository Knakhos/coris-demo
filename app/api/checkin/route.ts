import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { format } from "date-fns"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { mood, energy, focus, notes } = body

  if (
    typeof mood !== "number" || mood < 1 || mood > 10 ||
    typeof energy !== "number" || energy < 1 || energy > 10 ||
    typeof focus !== "number" || focus < 1 || focus > 10
  ) {
    return NextResponse.json({ error: "Invalid check-in data" }, { status: 400 })
  }

  const today = format(new Date(), "yyyy-MM-dd")

  const { data, error } = await supabase
    .from("check_ins")
    .upsert({ user_id: user.id, date: today, mood, energy, focus, notes })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await updateCollapseRisk(supabase, user.id)

  return NextResponse.json({ checkIn: data })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = format(new Date(), "yyyy-MM-dd")
  const { data } = await supabase
    .from("check_ins")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single()

  return NextResponse.json({ checkIn: data ?? null })
}

async function updateCollapseRisk(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: recentCheckIns } = await supabase
    .from("check_ins")
    .select("energy, mood")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(5)

  if (!recentCheckIns || recentCheckIns.length < 3) return

  const avgEnergy = recentCheckIns.reduce((s: number, c: { energy: number }) => s + c.energy, 0) / recentCheckIns.length
  const avgMood = recentCheckIns.reduce((s: number, c: { mood: number }) => s + c.mood, 0) / recentCheckIns.length

  let riskScore = 0
  if (avgEnergy < 4) riskScore += 4
  else if (avgEnergy < 6) riskScore += 2
  if (avgMood < 4) riskScore += 3
  else if (avgMood < 6) riskScore += 1

  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_profile")
    .eq("id", userId)
    .single()

  if (!profile) return

  await supabase.from("profiles").update({
    ai_profile: {
      ...profile.ai_profile,
      collapse_risk_score: Math.min(10, riskScore),
    },
    updated_at: new Date().toISOString(),
  }).eq("id", userId)
}
