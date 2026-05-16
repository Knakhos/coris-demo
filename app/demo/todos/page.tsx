import { DEMO_TASKS, DEMO_GOALS } from "@/lib/demo/mockData"
import TodosView from "@/components/dashboard/TodosView"

export default function DemoTodosPage() {
  return (
    <TodosView
      initialTasks={DEMO_TASKS}
      goals={DEMO_GOALS.map((g) => ({ id: g.id, title: g.title }))}
      currentEnergy={8}
    />
  )
}
