"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function ChatPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [typingContent, setTypingContent] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typingContent])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
      if (messages.length === 0) {
        setMessages([
          {
            role: "assistant",
            content: "Estou aqui. O que você precisa?",
          },
        ])
      }
    }
  }, [isOpen])

  async function handleSend() {
    if (!input.trim() || loading || isTyping) return

    const userMessage = input.trim()
    setInput("")
    const updatedMessages: Message[] = [...messages, { role: "user", content: userMessage }]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No reader")

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
            } catch {}
          }
        }
      }

      setIsTyping(false)
      setTypingContent("")
      if (accumulated) {
        setMessages((prev) => [...prev, { role: "assistant", content: accumulated }])
      }
    } catch {
      setIsTyping(false)
      setTypingContent("")
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erro de conexão." },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 24, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] flex flex-col
                     bg-white border border-border rounded-3xl shadow-modal overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <div>
                <p className="text-sm font-semibold">Coris</p>
                <p className="text-xs text-ink-faint">Memória completa do seu perfil</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-faint
                         hover:bg-surface-raised transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" ? (
                    <div className="max-w-[85%] text-sm text-ink leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="max-w-[80%] bg-accent text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm">
                      {msg.content}
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] text-sm text-ink leading-relaxed">
                    {typingContent ? (
                      <>
                        {typingContent}
                        <span className="inline-block w-0.5 h-3.5 bg-accent ml-0.5 animate-pulse" />
                      </>
                    ) : (
                      <div className="flex items-center gap-1 py-1">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 flex gap-2 flex-wrap">
              {["Tô doente hoje", "Me analisa essa semana", "Preciso recuperar atraso"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  className="text-xs px-3 py-1.5 rounded-full bg-surface-raised text-ink-muted
                             hover:bg-gray-100 transition-colors border border-border"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Fale com o Coris..."
                disabled={loading || isTyping}
                className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-border bg-surface-raised
                           placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/20
                           focus:border-accent transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || isTyping}
                className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center
                           hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
