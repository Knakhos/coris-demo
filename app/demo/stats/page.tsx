import { DEMO_PROFILE, DEMO_TASKS, DEMO_GOALS, DEMO_CHECK_INS } from "@/lib/demo/mockData"
import StatsView from "@/components/dashboard/StatsView"

export default function DemoStatsPage() {
  return (
    <StatsView
      aiProfile={DEMO_PROFILE.ai_profile}
      checkIns={DEMO_CHECK_INS}
      tasks={DEMO_TASKS}
      goals={DEMO_GOALS}
      weeklyReplay={null}
    />
  )
}
