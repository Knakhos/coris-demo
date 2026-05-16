import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getModel, getLongModel } from "@/lib/ai/client"
import { buildOnboardingSystemPrompt } from "@/lib/ai/context"
import { addDays, format } from "date-fns"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { messages } = await request.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        let fullText = ""
        const isComplete = detectOnboardingComplete(messages)

        const model = getModel()

        const systemPrompt = buildOnboardingSystemPrompt()

        const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }))

        const lastContent = messages.length > 0
          ? messages[messages.length - 1]?.content
          : "Iniciar onboarding"

        const chat = model.startChat({
          history: messages.length === 0 ? [] : history,
          systemInstruction: systemPrompt,
        })

        const result = await chat.sendMessageStream(lastContent)

        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            fullText += text
            send({ text })
          }
        }

        if (isComplete || detectOnboardingCompleteInResponse(fullText)) {
          await finalizeOnboarding(supabase, user.id, messages, fullText)
          send({ complete: true })
        }

        await saveOnboardingSession(supabase, user.id, [
          ...messages,
          { role: "assistant", content: fullText },
        ])

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      } catch (error) {
        console.error("Onboarding AI error:", error)
        send({ text: "Erro de conexão. Por favor, tente novamente." })
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

function detectOnboardingComplete(messages: Array<{ role: string; content: string }>): boolean {
  return messages.length >= 16
}

function detectOnboardingCompleteInResponse(text: string): boolean {
  return text.toLowerCase().includes("modo sombra")
}

async function saveOnboardingSession(
  supabase: SupabaseClient,
  userId: string,
  messages: Array<{ role: string; content: string }>
) {
  await supabase.from("onboarding_sessions").upsert({
    user_id: userId,
    messages,
    updated_at: new Date().toISOString(),
  })
}

async function finalizeOnboarding(
  supabase: SupabaseClient,
  userId: string,
  messages: Array<{ role: string; content: string }>,
  lastResponse: string
) {
  const shadowModeEnd = format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ssxxx")
  const extractedProfile = await extractProfileFromConversation(messages)

  await Promise.all([
    supabase.from("profiles").update({
      onboarding_completed: true,
      shadow_mode_ends_at: shadowModeEnd,
      ai_profile: extractedProfile,
      updated_at: new Date().toISOString(),
    }).eq("id", userId),

    supabase.from("onboarding_sessions").upsert({
      user_id: userId,
      messages: [...messages, { role: "assistant", content: lastResponse }],
      completed: true,
      extracted_profile: extractedProfile,
      updated_at: new Date().toISOString(),
    }),
  ])
}

async function extractProfileFromConversation(
  messages: Array<{ role: string; content: string }>
) {
  const conversationText = messages
    .map((m) => `${m.role === "user" ? "Usuário" : "Coris"}: ${m.content}`)
    .join("\n\n")

  const model = getLongModel()
  const result = await model.generateContent(`Extraia o perfil estruturado do usuário desta conversa de onboarding.
Retorne APENAS JSON válido neste formato exato (sem markdown, sem explicação):
{
  "identity_contexts": [{"label": "string", "description": "string", "goals": ["string"], "energy_weight": 5}],
  "energy_windows": [{"time_start": "09:00", "time_end": "11:00", "type": "creative", "intensity": 7}],
  "life_goals": [{"id": "goal-1", "title": "string", "horizon": "medium", "identity_link": "string", "progress": 0}],
  "current_blockers": ["string"],
  "tried_and_failed": ["string"],
  "productivity_patterns": [],
  "collapse_risk_score": 0,
  "last_updated": "${new Date().toISOString()}"
}

Conversa:
${conversationText}`)

  try {
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch {}

  return {
    identity_contexts: [],
    energy_windows: [],
    life_goals: [],
    current_blockers: [],
    tried_and_failed: [],
    productivity_patterns: [],
    collapse_risk_score: 0,
    last_updated: new Date().toISOString(),
  }
}
