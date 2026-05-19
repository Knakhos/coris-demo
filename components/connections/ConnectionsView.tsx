"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

interface Integration {
  id: string
  name: string
  description: string
  category: string
  logo: string
  logoColor: string
  connected: boolean
  comingSoon?: boolean
}

const INTEGRATIONS: Integration[] = [
  {
    id: "strava",
    name: "Strava",
    description: "Importe treinos e atividades físicas para enriquecer seu contexto de bem-estar.",
    category: "Saúde",
    logo: "S",
    logoColor: "#FC4C02",
    connected: true,
  },
  {
    id: "whoop",
    name: "Whoop / Garmin",
    description: "Sincronize HRV, sono e recuperação para calibrar sua energia automaticamente.",
    category: "Saúde",
    logo: "W",
    logoColor: "#111111",
    connected: false,
  },
  {
    id: "screen-time",
    name: "Tempo de tela",
    description: "Analise seus padrões de uso do celular e correlacione com foco e produtividade.",
    category: "Bem-estar",
    logo: "T",
    logoColor: "#2563EB",
    connected: false,
  },
  {
    id: "music",
    name: "Spotify / Apple Music",
    description: "Descubra como o que você ouve se conecta ao seu humor e nível de energia.",
    category: "Bem-estar",
    logo: "M",
    logoColor: "#1DB954",
    connected: false,
  },
]

const categories = ["Todos", ...Array.from(new Set(INTEGRATIONS.map((i) => i.category)))]

export default function ConnectionsView() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS)
  const [activeCategory, setActiveCategory] = useState("Todos")

  const filtered = integrations.filter(
    (i) => activeCategory === "Todos" || i.category === activeCategory
  )

  const connectedCount = integrations.filter((i) => i.connected).length

  function toggle(id: string) {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i))
    )
  }

  return (
    <div className="px-8 py-8">
      <motion.div initial="hidden" animate="visible" variants={stagger}>

        {/* Header */}
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="font-title text-4xl font-bold tracking-tight">Conexões</h1>
          <p className="text-ink-muted text-sm mt-1">
            {connectedCount} app{connectedCount !== 1 ? "s" : ""} conectado{connectedCount !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-150",
                activeCategory === cat
                  ? "bg-accent text-ink"
                  : "bg-white/20 text-ink-muted hover:bg-white/40 hover:text-ink"
              )}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <motion.div variants={fadeUp} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((integration) => (
            <motion.div
              key={integration.id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("card p-5 flex flex-col gap-4", integration.comingSoon && "opacity-50")}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: integration.logoColor }}
                  >
                    {integration.logo}
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-snug">{integration.name}</p>
                    <span className="text-[10px] text-ink-faint">{integration.category}</span>
                  </div>
                </div>

                {integration.connected ? (
                  <CheckCircle2 size={16} className="text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle size={16} className="text-ink-faint flex-shrink-0 mt-0.5" />
                )}
              </div>

              <p className="text-sm text-ink-muted leading-snug flex-1">{integration.description}</p>

              <div className="flex items-center justify-between">
                {integration.comingSoon ? (
                  <span className="text-xs text-ink-faint italic">Em breve</span>
                ) : integration.connected ? (
                  <div className="flex items-center gap-3 w-full">
                    <button
                      onClick={() => toggle(integration.id)}
                      className="text-xs text-ink-faint hover:text-danger transition-colors"
                    >
                      Desconectar
                    </button>
                    <button className="ml-auto text-ink-faint hover:text-ink transition-colors">
                      <ExternalLink size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => toggle(integration.id)}
                    className="btn-primary text-xs px-4 py-1.5"
                  >
                    Conectar
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
