import { DEMO_PROFILE, DEMO_TASKS, DEMO_GOALS, DEMO_EVENTS, DEMO_CHECK_INS } from "@/lib/demo/mockData"
import { format, subDays } from "date-fns"
import TodayView from "@/components/dashboard/TodayView"
import DemoShell from "@/components/demo/DemoShell"

export default function DemoPage() {
  const today = format(new Date(), "yyyy-MM-dd")
  const todayCheckIn = DEMO_CHECK_INS.find((c) => c.date === today) ?? null
  const recentCheckIns = DEMO_CHECK_INS

  return (
    <DemoShell profile={DEMO_PROFILE}>
      <TodayView
        profile={DEMO_PROFILE}
        tasks={DEMO_TASKS}
        goals={DEMO_GOALS}
        todayCheckIn={todayCheckIn}
        recentCheckIns={recentCheckIns}
        todayEvents={DEMO_EVENTS}
        briefing={null}
      />
    </DemoShell>
  )
}
