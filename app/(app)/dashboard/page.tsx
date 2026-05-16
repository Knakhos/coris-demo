import { createClient } from "@/lib/supabase/server"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import TodayView from "@/components/dashboard/TodayView"

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = format(new Date(), "yyyy-MM-dd")

  const [
    { data: profile },
    { data: tasks },
    { data: goals },
    { data: todayCheckIn },
    { data: recentCheckIns },
    { data: todayEvents },
    { data: briefing },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("tasks").select("*").eq("user_id", user!.id).neq("status", "cancelled").order("priority_score", { ascending: false }).limit(15),
    supabase.from("goals").select("*").eq("user_id", user!.id).eq("status", "active"),
    supabase.from("check_ins").select("*").eq("user_id", user!.id).eq("date", today).single(),
    supabase.from("check_ins").select("*").eq("user_id", user!.id).gte("date", format(subDays(new Date(), 7), "yyyy-MM-dd")).order("date", { ascending: false }),
    supabase.from("calendar_events").select("*").eq("user_id", user!.id)
      .gte("start_at", `${today}T00:00:00`)
      .lte("start_at", `${today}T23:59:59`)
      .order("start_at"),
    supabase.from("ai_briefings").select("*").eq("user_id", user!.id).eq("date", today).order("generated_at", { ascending: false }).limit(1).single(),
  ])

  return (
    <TodayView
      profile={profile}
      tasks={tasks ?? []}
      goals={goals ?? []}
      todayCheckIn={todayCheckIn}
      recentCheckIns={recentCheckIns ?? []}
      todayEvents={todayEvents ?? []}
      briefing={briefing}
    />
  )
}
