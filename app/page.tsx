"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Zap, Target, Calendar, BarChart3, MessageCircle } from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
}

const features = [
  {
    icon: Zap,
    title: "Motor de Prioridade Dinâmica",
    desc: "Suas tarefas se reorganizam em tempo real conforme seu estado energético, urgência e impacto cruzados.",
  },
  {
    icon: Target,
    title: "Metas com Negociação",
    desc: "Quando você está atrasado, a IA não impõe — apresenta 3 planos de recuperação com custos reais em outras áreas.",
  },
  {
    icon: Calendar,
    title: "Calendário Adaptativo",
    desc: "A IA protege janelas de recuperação, redistribui tarefas e reescreve sua semana quando necessário.",
  },
  {
    icon: BarChart3,
    title: "Replay de Semana",
    desc: "Toda segunda-feira: planejado vs. executado, o momento exato em que a semana descarrilou, e o que a IA aprendeu.",
  },
  {
    icon: MessageCircle,
    title: "Chat com Memória Total",
    desc: '"Tô doente hoje" → reorganiza o calendário, pausa metas não críticas, protege sua recuperação. Instantaneamente.',
  },
  {
    icon: Zap,
    title: "Previsão de Colapso",
    desc: "Monitora sinais de esgotamento antes que você perceba. Age proativamente — não espera você pedir.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-ink overflow-x-hidden">
      {/* Nav — floating, no divider */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <Image src="/logo-coris.png" alt="Coris" height={44} width={110} className="object-contain" style={{ width: "auto" }} />
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm">
            Entrar
          </Link>
          <Link href="/signup" className="btn-primary text-sm">
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="text-left -ml-2 md:-ml-4"
        >
          <motion.div variants={fadeUp} custom={0}>
            <span className="pill bg-accent-light text-accent font-medium mb-8 inline-flex">
              Otimização pessoal com IA
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-title italic text-6xl md:text-8xl leading-[0.95] tracking-tight mb-8"
          >
            A IA que{" "}
            <em className="text-accent">aprende</em>
            <br />
            quem você é.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-ink-muted text-xl max-w-2xl mb-12 leading-relaxed"
          >
            Não é um app de tarefas com IA colada. A IA é o núcleo — ela observa seus padrões,
            cruza dados de múltiplas dimensões da sua vida e reorganiza sua rotina{" "}
            <strong className="text-ink font-medium">antes que você precise pedir.</strong>
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex items-center gap-4">
            <Link href="/signup" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
              Começar agora
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-3.5">
              Já tenho conta
            </Link>
          </motion.div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-base via-transparent to-transparent z-10 pointer-events-none" />
          <DashboardPreview />
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          <motion.p variants={fadeUp} className="text-center text-ink-muted text-sm font-medium uppercase tracking-widest mb-4">
            Funcionalidades
          </motion.p>
          <motion.h2 variants={fadeUp} className="font-title text-5xl text-center mb-16">
            Inteligência que <em>age</em>, não que sugere.
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="card p-6 hover:shadow-card-hover transition-shadow duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-accent" />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-ink-muted text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Briefing example */}
      <section className="py-24 px-6 bg-ink text-base">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.p variants={fadeUp} className="text-gray-400 text-sm uppercase tracking-widest mb-8">
              Briefing diário — hoje, 07h12
            </motion.p>
            <motion.blockquote
              variants={fadeUp}
              className="font-title text-2xl md:text-3xl italic leading-relaxed text-gray-100 mb-12"
            >
              &ldquo;Você está em uma sequência de 4 dias com energia abaixo do normal. Suas tarefas
              criativas estão sendo sistematicamente empurradas para o fim do dia — horário em que
              você historicamente não as executa. Hoje reorganizei sua manhã em torno disso.&rdquo;
            </motion.blockquote>
            <motion.div variants={fadeUp}>
              <Link href="/signup" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2">
                Quero esse nível de clareza
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 text-center border-t border-border">
        <Image src="/logo-coris.png" alt="Coris" height={32} width={80} className="object-contain mx-auto mb-2" style={{ width: "auto" }} />
        <p className="text-ink-faint text-sm mt-2">Otimização pessoal com IA</p>
      </footer>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="rounded-3xl border border-border shadow-float overflow-hidden bg-white">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-6 py-4 bg-surface-raised">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="text-xs text-ink-faint font-mono bg-white border border-border px-4 py-1 rounded-lg">
            coris.app/alma
          </div>
        </div>
      </div>

      <div className="flex h-[500px]">
        {/* Sidebar */}
        <div className="w-16 border-r border-border flex flex-col items-center py-6 gap-4 bg-white">
          {["⊙", "◎", "◈", "◻", "♡", "◉", "⊕"].map((icon, i) => (
            <div
              key={i}
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm cursor-pointer transition-colors ${
                i === 4 ? "bg-accent text-white" : "text-ink-faint hover:bg-surface-raised"
              }`}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Main — Alma */}
        <div className="flex-1 p-6 overflow-hidden">
          {/* Header */}
          <div className="mb-5">
            <h2 className="font-title text-xl font-semibold mb-0.5">Alma</h2>
            <p className="text-xs text-ink-muted">Análise dos seus padrões de vida</p>
          </div>

          {/* KPIs */}
          <div className="flex gap-3 mb-4">
            {[
              { label: "Energia média", value: "7.8", delta: "+0.4 esta semana" },
              { label: "Humor médio", value: "8.1", delta: "+0.6 esta semana" },
              { label: "Metas no prazo", value: "73%", delta: "+12% este mês" },
            ].map((kpi) => (
              <div key={kpi.label} className="flex-1 card p-3">
                <p className="text-xs text-ink-muted mb-1">{kpi.label}</p>
                <p className="text-xl font-semibold">{kpi.value}</p>
                <p className="text-xs text-green-500">{kpi.delta}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="flex gap-3 mb-4">
            {/* Bar chart */}
            <div className="flex-1 card p-3">
              <p className="text-xs text-ink-muted mb-2">Energia e Humor — 7 dias</p>
              <div className="flex items-end gap-1 h-14">
                {[6, 7, 7.5, 8, 7, 8.5, 8].map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end gap-0.5">
                    <div
                      className="bg-accent rounded-t-sm"
                      style={{ height: `${(v / 10) * 100}%`, opacity: 0.7 + i * 0.04 }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                  <span key={i} className="flex-1 text-center text-[9px] text-ink-faint">{d}</span>
                ))}
              </div>
            </div>

            {/* Radar */}
            <div className="w-[110px] card p-2 flex items-center justify-center">
              <svg viewBox="0 0 80 80" className="w-full h-full">
                <polygon points="40,8 68,26 64,58 16,58 12,26" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                <polygon points="40,20 58,32 55,52 25,52 22,32" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                <polygon points="40,16 62,30 58,54 22,54 18,30" fill="#FEF3C7" stroke="#F0A500" strokeWidth="1.5" fillOpacity="0.5" />
                {[
                  [40, 8], [68, 26], [64, 58], [16, 58], [12, 26]
                ].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="2.5" fill="#F0A500" fillOpacity="0.6" />
                ))}
                <line x1="40" y1="8" x2="40" y2="58" stroke="#e5e7eb" strokeWidth="0.5" />
                <line x1="12" y1="26" x2="68" y2="26" stroke="#e5e7eb" strokeWidth="0.5" />
                <line x1="16" y1="58" x2="64" y2="58" stroke="#e5e7eb" strokeWidth="0.5" />
              </svg>
            </div>
          </div>

          {/* Padrões */}
          <div className="card p-3">
            <p className="text-xs font-semibold mb-2 text-ink">Padrões identificados</p>
            <div className="space-y-1.5">
              {[
                "Produtividade cai 40% após reuniões acima de 90 min.",
                "Exercício → humor +1.2 pts no dia seguinte, consistentemente.",
                "Tarefas criativas: taxa de sucesso 90%+ entre 9h–11h.",
              ].map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-ink-muted leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
