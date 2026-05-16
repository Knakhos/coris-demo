import { DEMO_EVENTS, DEMO_TASKS } from "@/lib/demo/mockData"
import CalendarView from "@/components/calendar/CalendarView"

export default function DemoCalendarPage() {
  const tasksWithDueDate = DEMO_TASKS
    .filter((t) => t.due_date)
    .map((t) => ({ id: t.id, title: t.title, due_date: t.due_date, context_tag: t.context_tag }))

  return <CalendarView events={DEMO_EVENTS} tasks={tasksWithDueDate} />
}
