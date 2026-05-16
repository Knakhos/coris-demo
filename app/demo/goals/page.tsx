import { DEMO_GOALS } from "@/lib/demo/mockData"
import GoalsView from "@/components/goals/GoalsView"

export default function DemoGoalsPage() {
  return <GoalsView initialGoals={DEMO_GOALS} />
}
