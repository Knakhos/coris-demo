import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { anthropic, MODEL } from "@/lib/anthropic/client"
import { buildOnboardingSystemPrompt } from "@/lib/anthropic/context"
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

        const response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 1024,
          system: buildOnboardingSystemPrompt(),
          messages: messages.length > 0 ? messages : [
            { role: "user", content: "Iniciar onboarding" }
          ],
          stream: true,
        })

        for await (const chunk of response) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            fullText += chunk.delta.text
            send({ text: chunk.delta.text })
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

  const extraction = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `Extract structured user profile from the onboarding conversation.
Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "identity_contexts": [{"label": "string", "description": "string", "goals": ["string"], "energy_weight": 5}],
  "energy_windows": [{"time_start": "string", "time_end": "string", "type": "creative", "intensity": 7}],
  "life_goals": [{"id": "string", "title": "string", "horizon": "medium", "identity_link": "string", "progress": 0}],
  "current_blockers": ["string"],
  "tried_and_failed": ["string"],
  "productivity_patterns": [],
  "collapse_risk_score": 0,
  "last_updated": "${new Date().toISOString()}"
}`,
    messages: [{ role: "user", content: conversationText }],
  })

  try {
    const content = extraction.content[0]
    if (content.type === "text") {
      return JSON.parse(content.text)
    }
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
