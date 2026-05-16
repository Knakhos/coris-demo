import { createClient } from "@/lib/supabase/server"
import TodosView from "@/components/dashboard/TodosView"

export default async function TodosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: tasks }, { data: goals }, { data: todayCheckIn }] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", user!.id).neq("status", "cancelled").order("priority_score", { ascending: false }),
    supabase.from("goals").select("id, title").eq("user_id", user!.id).eq("status", "active"),
    supabase.from("check_ins").select("energy").eq("user_id", user!.id).eq("date", new Date().toISOString().split("T")[0]).single(),
  ])

  return (
    <TodosView
      initialTasks={tasks ?? []}
      goals={goals ?? []}
      currentEnergy={todayCheckIn?.energy ?? 5}
    />
  )
}
