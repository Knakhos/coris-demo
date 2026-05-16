import { type NextRequest, NextResponse } from "next/server"
import { getLongModel } from "@/lib/ai/client"

const DEMO_CONTEXT = `Perfil do usuário (demo):
- Profissional de produto e tecnologia
- Atleta: corre 4x por semana, meta de meia maratona em 90 dias (61% concluída)
- Padrão identificado: mais produtivo entre 9h–12h, queda criativa nas tardes
- Tarefas urgentes: especificação v2 (score 9.2), revisão de métricas
- Check-in de hoje: humor 7, energia 8, foco 7
- Risco de colapso: baixo (2/10)`

export async function GET(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ briefing: null, error: "GEMINI_API_KEY não configurado" })
  }

  const prompt = `${DEMO_CONTEXT}

Gere um briefing diário para o usuário. Regras:
- Máximo 3 linhas. Nada mais.
- Em português brasileiro.
- Analítico, nunca motivacional. Cada frase baseada nos dados acima.
- Identifique padrões pelo nome específico. Ex: "tarefas criativas empurradas para tarde" não "você tem dificuldade com criatividade"
- Sem emojis, sem exclamações, sem frases vazias
- Tom: coach de alta performance com seus dados, direto ao ponto`

  try {
    const model = getLongModel()
    const result = await model.generateContent(prompt)
    const content = result.response.text()

    return NextResponse.json({
      briefing: { content, date: new Date().toISOString(), id: "demo" },
    })
  } catch (error) {
    return NextResponse.json({ briefing: null, error: String(error) })
  }
}
