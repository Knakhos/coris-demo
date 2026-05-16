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
      briefing={{
        id: "demo-briefing",
        user_id: "demo-user",
        date: format(new Date(), "yyyy-MM-dd"),
        content: "Sua energia está acima da média esta semana — aproveite a manhã para avançar na especificação do produto antes das reuniões da tarde. A meta da meia maratona ganhou ritmo, mas os últimos 4 dias sem treino pedem atenção. Foque no que importa: uma entrega hoje vale mais do que dez amanhã.",
        generated_at: new Date().toISOString(),
      }}
      briefingEndpoint="/api/ai/demo-briefing"
    />
  )
}
