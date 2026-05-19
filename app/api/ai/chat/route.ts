import { type NextRequest } from "next/server"
import { getModel } from "@/lib/ai/client"

export async function POST(request: NextRequest) {
  const { messages } = await request.json()

  const model = getModel()

  const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const chat = model.startChat({ history })
        const result = await chat.sendMessageStream(lastMessage?.content ?? "")

        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) send({ text })
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      } catch (error) {
        send({ text: "Erro ao processar. Verifique se GEMINI_API_KEY está configurado." })
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
