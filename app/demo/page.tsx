import { DEMO_PROFILE, DEMO_TASKS, DEMO_GOALS, DEMO_EVENTS, DEMO_CHECK_INS } from "@/lib/demo/mockData"
import { format } from "date-fns"
import TodayView from "@/components/dashboard/TodayView"

export default function DemoPage() {
  const today = format(new Date(), "yyyy-MM-dd")
  const todayCheckIn = DEMO_CHECK_INS.find((c) => c.date === today) ?? null

  return (
    <TodayView
      profile={DEMO_PROFILE}
      tasks={DEMO_TASKS}
      goals={DEMO_GOALS}
      todayCheckIn={todayCheckIn}
      recentCheckIns={DEMO_CHECK_INS}
      todayEvents={DEMO_EVENTS}
      briefing={null}
      briefingEndpoint="/api/ai/demo-briefing"
    />
  )
}
