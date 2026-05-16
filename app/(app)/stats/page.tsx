import { createClient } from "@/lib/supabase/server"
import { format, subDays, startOfWeek, endOfWeek } from "date-fns"
import StatsView from "@/components/dashboard/StatsView"

export default async function StatsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd")
  const lastWeekStart = format(startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }), "yyyy-MM-dd'T'00:00:00")
  const lastWeekEnd = format(endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }), "yyyy-MM-dd'T'23:59:59")

  const [
    { data: profile },
    { data: checkIns },
    { data: tasks },
    { data: goals },
    { data: weeklyReplay },
  ] = await Promise.all([
    supabase.from("profiles").select("ai_profile").eq("id", user!.id).single(),
    supabase.from("check_ins").select("*").eq("user_id", user!.id).gte("date", thirtyDaysAgo).order("date"),
    supabase.from("tasks").select("*").eq("user_id", user!.id).gte("created_at", thirtyDaysAgo + "T00:00:00"),
    supabase.from("goals").select("*").eq("user_id", user!.id),
    supabase.from("weekly_replays").select("*").eq("user_id", user!.id).order("generated_at", { ascending: false }).limit(1).single(),
  ])

  return (
    <StatsView
      aiProfile={profile?.ai_profile}
      checkIns={checkIns ?? []}
      tasks={tasks ?? []}
      goals={goals ?? []}
      weeklyReplay={weeklyReplay}
    />
  )
}
