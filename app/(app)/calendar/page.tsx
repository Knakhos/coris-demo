import { createClient } from "@/lib/supabase/server"
import { format, startOfMonth, endOfMonth } from "date-fns"
import CalendarView from "@/components/calendar/CalendarView"

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd'T'00:00:00")
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd'T'23:59:59")

  const [{ data: events }, { data: tasks }] = await Promise.all([
    supabase.from("calendar_events").select("*").eq("user_id", user!.id)
      .gte("start_at", monthStart).lte("start_at", monthEnd).order("start_at"),
    supabase.from("tasks").select("id, title, due_date, context_tag").eq("user_id", user!.id)
      .eq("status", "pending").not("due_date", "is", null),
  ])

  return <CalendarView events={events ?? []} tasks={tasks ?? []} />
}
