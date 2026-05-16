"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Send } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [typingContent, setTypingContent] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      startOnboarding()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typingContent])

  async function startOnboarding() {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      })
      await streamResponse(res)
    } catch {
      addMessage("assistant", "Olá. Sou o Coris. Antes de qualquer coisa, preciso entender quem você é — não só o que você faz. Começando pela pergunta mais básica: qual é o objetivo que, se alcançado no próximo ano, faria você sentir que valeu a pena? Um objetivo, específico.")
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function addMessage(role: "user" | "assistant", content: string) {
    setMessages((prev) => [...prev, { role, content }])
  }

  async function streamResponse(res: Response) {
    const reader = res.body?.getReader()
    if (!reader) return

    setIsTyping(true)
    let accumulated = ""

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split("\n")
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              accumulated += parsed.text
              setTypingContent(accumulated)
            }
            if (parsed.complete) {
              setIsComplete(true)
            }
          } catch {}
        }
      }
    }

    setIsTyping(false)
    setTypingContent("")
    if (accumulated) {
      addMessage("assistant", accumulated)
    }
  }

  async function handleSend() {
    if (!input.trim() || loading || isTyping) return

    const userMessage = input.trim()
    setInput("")
    addMessage("user", userMessage)
    setLoading(true)

    const updatedMessages = [...messages, { role: "user" as const, content: userMessage }]

    try {
      const res = await fetch("/api/ai/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      })
      await streamResponse(res)
    } catch {
      addMessage("assistant", "Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function handleComplete() {
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <span className="font-display text-2xl italic text-white">Coris</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-soft" />
          <span className="text-xs text-gray-400 font-medium">Modo Onboarding</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-6 ${msg.role === "user" ? "flex justify-end" : "flex justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-accent flex-shrink-0 flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <div className="text-gray-100 text-sm leading-relaxed font-display italic text-base">
                    {msg.content}
                  </div>
                </div>
              )}
              {msg.role === "user" && (
                <div className="bg-white/10 text-gray-100 px-4 py-3 rounded-2xl rounded-tr-sm text-sm max-w-[75%]">
                  {msg.content}
                </div>
              )}
            </motion.div>
          ))}

          {/* Streaming / typing indicator */}
          {(isTyping || (loading && messages.length === 0)) && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mb-6"
            >
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-accent flex-shrink-0 flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs font-bold">C</span>
                </div>
                {typingContent ? (
                  <div className="text-gray-100 text-sm leading-relaxed font-display italic text-base">
                    {typingContent}
                    <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 py-2">
                    <span className="typing-dot text-gray-400" />
                    <span className="typing-dot text-gray-400" />
                    <span className="typing-dot text-gray-400" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion CTA */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <button onClick={handleComplete} className="btn-primary px-8 py-3.5 text-base">
              Ir para o Dashboard →
            </button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isComplete && (
        <div className="px-6 pb-8 max-w-2xl mx-auto w-full">
          <div className="flex gap-3 bg-white/8 border border-white/10 rounded-2xl p-2 pl-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Responda aqui..."
              disabled={loading || isTyping}
              className="flex-1 bg-transparent text-gray-100 placeholder:text-gray-600 text-sm outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || isTyping}
              className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0
                         hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={15} className="text-white" />
            </button>
          </div>
          <p className="text-center text-gray-600 text-xs mt-3">
            Esta conversa constrói seu perfil de vida — seja honesto.
          </p>
        </div>
      )}
    </div>
  )
}
