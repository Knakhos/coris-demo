import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getModel } from "@/lib/ai/client"
import { buildUserContext } from "@/lib/ai/context"
import { format, subDays } from "date-fns"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { messages } = await request.json()

  const [profileResult, tasksResult, goalsResult, checkInsResult, eventsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("tasks").select("*").eq("user_id", user.id).neq("status", "cancelled").limit(20),
    supabase.from("goals").select("*").eq("user_id", user.id).eq("status", "active"),
    supabase.from("check_ins").select("*").eq("user_id", user.id)
      .gte("date", format(subDays(new Date(), 7), "yyyy-MM-dd"))
      .order("date", { ascending: false }),
    supabase.from("calendar_events").select("*").eq("user_id", user.id)
      .gte("start_at", format(new Date(), "yyyy-MM-dd'T'00:00:00"))
      .lte("start_at", format(new Date(), "yyyy-MM-dd'T'23:59:59")),
  ])

  const userContext = buildUserContext({
    profile: profileResult.data,
    tasks: tasksResult.data ?? [],
    goals: goalsResult.data ?? [],
    recentCheckIns: checkInsResult.data ?? [],
    todayEvents: eventsResult.data ?? [],
  })

  const model = getModel()

  const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]
  const userMessage = `${userContext}\n\n${lastMessage?.content ?? ""}`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const chat = model.startChat({ history })
        const result = await chat.sendMessageStream(userMessage)

        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) send({ text })
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      } catch (error) {
        console.error("Chat AI error:", error)
        send({ text: "Erro ao processar sua mensagem." })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
