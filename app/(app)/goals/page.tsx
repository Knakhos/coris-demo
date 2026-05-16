import { createClient } from "@/lib/supabase/server"
import GoalsView from "@/components/goals/GoalsView"

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  return <GoalsView initialGoals={goals ?? []} />
}
