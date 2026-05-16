import type { Task, CheckIn } from "@/types"

export function computePriorityScore(
  task: Pick<Task, "urgency" | "impact" | "energy_cost" | "due_date">,
  currentEnergy: number = 5
): number {
  const urgencyWeight = task.urgency * 0.35
  const impactWeight = task.impact * 0.4
  const energyFit = Math.max(0, 10 - Math.abs(currentEnergy - task.energy_cost)) * 0.15
  const dueSoon = task.due_date
    ? Math.max(0, 10 - (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) * 0.1
    : 0

  return Math.min(10, urgencyWeight + impactWeight + energyFit + dueSoon)
}

export function sortTasksByPriority(tasks: Task[], currentEnergy: number = 5): Task[] {
  return [...tasks].sort((a, b) => {
    const scoreA = computePriorityScore(a, currentEnergy)
    const scoreB = computePriorityScore(b, currentEnergy)
    return scoreB - scoreA
  })
}

export function detectCollapseSignals(
  tasks: Task[],
  recentCheckIns: CheckIn[]
): { hasRisk: boolean; signals: string[] } {
  const signals: string[] = []

  const overdueTasks = tasks.filter(
    (t) => t.status === "pending" && t.due_date && new Date(t.due_date) < new Date()
  )
  if (overdueTasks.length >= 3) {
    signals.push(`${overdueTasks.length} tarefas vencidas sem conclusão`)
  }

  if (recentCheckIns.length >= 3) {
    const avgEnergy = recentCheckIns.slice(0, 3).reduce((s, c) => s + c.energy, 0) / 3
    if (avgEnergy < 4) {
      signals.push(`Energia abaixo de 4/10 por ${recentCheckIns.slice(0, 3).length} dias consecutivos`)
    }
  }

  return { hasRisk: signals.length > 0, signals }
}
