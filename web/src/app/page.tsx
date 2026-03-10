"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Zap, Flame, MonitorPlay, Smartphone, Shield, Star, Users, BookOpen, Trophy, ChevronRight, Instagram, Youtube, Music2 } from 'lucide-react';
import { WaitlistSection } from '@/components/waitlist/waitlist-section';
import { useEffect, useState } from 'react';

const DANCE_STYLES = ['LOCKING', 'BALLET', 'POPPING', 'BREAKING', 'CONTEMPORÂNEO', 'FREESTYLE', 'HIP-HOP', 'JAZZ'];

export default function LandingPage() {
  const [styleIndex, setStyleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStyleIndex((i) => (i + 1) % DANCE_STYLES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans overflow-x-hidden selection:bg-primary/30 selection:text-white">

      {/* Background Ambient Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full mix-blend-screen opacity-50 animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[180px] rounded-full mix-blend-screen opacity-40" />
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-accent/5 blur-[120px] rounded-full mix-blend-screen opacity-30" />
      </div>

      {/* Navbar */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="relative w-32 h-8">
              <Image src="/images/xpace-on-branco.png" alt="XTAGE" fill className="object-contain object-left" />
            </div>
            <Link href="/explore" className="hidden md:block text-sm font-semibold text-white hover:text-primary transition-colors uppercase tracking-widest">
              Explorar Catálogo
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hidden md:block text-sm font-semibold text-[#888] hover:text-white transition-colors uppercase tracking-widest">
              Acesso Aluno
            </Link>
            <Link href="/register" className="relative group overflow-hidden px-6 py-2.5 rounded-sm bg-primary border border-primary/50 text-white font-bold uppercase tracking-widest text-xs">
              <span className="relative z-10">Tornar-se Membro</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Waitlist Section */}
      <WaitlistSection />

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-mono text-[#aaa] uppercase tracking-widest">A Revolução do Streaming de Dança</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-5xl md:text-8xl leading-[1.1] md:leading-[1.0] font-bold text-white mb-4 tracking-tight"
          >
            APRENDA{' '}
            <span className="inline-block relative min-w-[280px] md:min-w-[540px] h-[1.1em] overflow-hidden align-bottom">
              <AnimatePresence mode="wait">
                <motion.span
                  key={styleIndex}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent block"
                >
                  {DANCE_STYLES[styleIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
            <br />
            <span className="text-white">DO ZERO AO PALCO.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-[#aaa] font-medium mb-12 tracking-wide"
          >
            Masterclasses com os maiores nomes da cena. Qualquer estilo, qualquer nível — um ecossistema construído por e para dançarinos reais.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <Link href="/register" className="w-full sm:w-auto relative group px-10 py-5 bg-white text-black font-bold uppercase tracking-[0.2em] rounded-sm overflow-hidden text-sm flex justify-center items-center">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Começar Jornada <ArrowRight size={18} />
              </span>
              <div className="absolute inset-0 bg-[#ddd] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out z-0" />
            </Link>
            <Link href="/explore" className="w-full sm:w-auto px-10 py-5 bg-transparent border border-[#333] text-white hover:bg-[#111] hover:border-[#555] font-bold uppercase tracking-[0.2em] rounded-sm transition-all duration-300 text-sm flex items-center justify-center gap-2">
              <Play size={18} className="text-secondary" /> Ver Catálogo
            </Link>
          </motion.div>

        </div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, type: "spring" }}
          id="preview"
          className="max-w-6xl mx-auto mt-24 relative"
        >
          <div className="relative rounded-xl border border-white/10 bg-[#050505] shadow-[0_0_100px_rgba(99,36,178,0.25)] overflow-hidden aspect-video transform-gpu rotate-x-[5deg] scale-95 hover:rotate-x-0 hover:scale-100 transition-all duration-700 ease-out group">
            <div className="h-8 md:h-10 bg-[#111] border-b border-[#222] flex items-center px-4 gap-2 w-full">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              <div className="flex-1 text-center hidden md:block">
                <span className="text-[10px] font-mono text-[#555] bg-[#000] px-4 py-1 rounded-full border border-[#222]">xtage.app/dashboard</span>
              </div>
            </div>
            <div className="relative w-full h-full bg-[#050505] overflow-hidden">
              <Image src="/images/dashboard-preview.png" alt="Dashboard Preview" unoptimized fill className="object-cover object-top opacity-60 group-hover:opacity-100 transition-opacity duration-1000 grayscale group-hover:grayscale-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Play className="text-white ml-2" size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 }}
            className="hidden md:flex absolute -left-8 top-1/2 -translate-y-1/2 flex-col gap-3"
          >
            <div className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-white text-xs font-bold">+250 XP</p>
                <p className="text-[#666] text-[10px]">Aula concluída</p>
              </div>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Trophy size={16} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-white text-xs font-bold">#3 Ranking</p>
                <p className="text-[#666] text-[10px]">Brasil — Semanal</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6 }}
            className="hidden md:flex absolute -right-8 bottom-16 flex-col gap-3"
          >
            <div className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Users size={16} className="text-green-500" />
              </div>
              <div>
                <p className="text-white text-xs font-bold">Lista de espera</p>
                <p className="text-[#666] text-[10px]">Abertura em 29 ABR</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Stats Bar */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 py-10 border-y border-[#111] bg-[#020202] overflow-hidden"
      >
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-[#1a1a1a]">
          {[
            { value: '29 ABR', label: 'Abertura da plataforma', color: 'text-primary' },
            { value: '100%', label: 'Dedicado à dança', color: 'text-secondary' },
            { value: '100%', label: 'Construído por dançarinos', color: 'text-accent' },
            { value: '∞', label: 'Estilos suportados', color: 'text-yellow-400' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center px-4 py-2">
              <span className={`font-display text-4xl md:text-5xl font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-[#555] text-xs uppercase tracking-widest mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Features Grid */}
      <section className="relative z-10 py-24 bg-[#020202]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-[10px] font-mono text-primary uppercase tracking-widest border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-full mb-4">Plataforma</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4 uppercase tracking-tight">Evolução em <span className="text-secondary">Ultra Definição</span></h2>
            <p className="text-[#666] font-light max-w-2xl mx-auto">Muito mais que um player. O XTAGE foi desenhado com inteligência e ferramentas gamificadas para garantir seu desenvolvimento real.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{ visible: { opacity: 1, transition: { staggerChildren: 0.15 } }, hidden: { opacity: 0 } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {[
              { icon: <MonitorPlay size={28} className="text-primary" />, title: "Ultra Definição", desc: "Player focado em dança com espelhamento dinâmico, loop de trecho e controle de velocidade preciso." },
              { icon: <Zap size={28} className="text-secondary" />, title: "Sistema de XP", desc: "Transforme treino em jogo. Acumule pontos por aula finalizada e suba no Ranking Global." },
              { icon: <Shield size={28} className="text-accent" />, title: "Painel do Professor", desc: "Ferramentas para criadores. Gerencie cursos, alunos e seu financeiro em um só lugar." },
              { icon: <Flame size={28} className="text-orange-500" />, title: "Programa Afiliados", desc: "Recomende cursos e receba comissões. Monetize sua influência dentro do ecossistema." },
              { icon: <Star size={28} className="text-yellow-400" />, title: "Conquistas", desc: "Desbloqueie badges, participe de desafios e exiba seu nível no perfil XTAGE." },
              { icon: <Smartphone size={28} className="text-green-400" />, title: "Cross-Platform PWA", desc: "Experiência nativa no celular ou tablet. Seu treino vai junto com você." },
            ].map((card, i) => (
              <motion.div key={i} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} transition={{ duration: 0.5 }}>
                <FeatureCard {...card} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="relative z-10 py-28 bg-black border-t border-[#111]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <span className="inline-block text-[10px] font-mono text-secondary uppercase tracking-widest border border-secondary/30 bg-secondary/5 px-3 py-1.5 rounded-full mb-4">Simples assim</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white uppercase tracking-tight">Do Zero ao Palco em <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">3 Passos</span></h2>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-primary/50 via-secondary/50 to-accent/50" />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ visible: { opacity: 1, transition: { staggerChildren: 0.2 } }, hidden: { opacity: 0 } }}
              className="grid grid-cols-1 md:grid-cols-3 gap-10"
            >
              {[
                {
                  step: '01',
                  icon: <BookOpen size={28} />,
                  color: 'primary',
                  title: 'Escolha seu Curso',
                  desc: 'Navegue pelo catálogo de masterclasses e coreografias. Avulso ou por assinatura — você decide.',
                },
                {
                  step: '02',
                  icon: <Play size={28} />,
                  color: 'secondary',
                  title: 'Aprenda no Seu Ritmo',
                  desc: 'Player com espelhamento, loop e velocidade variável. Pause, retroceda e domine cada movimento.',
                },
                {
                  step: '03',
                  icon: <Trophy size={28} />,
                  color: 'accent',
                  title: 'Evolua e Suba no Rank',
                  desc: 'Ganhe XP, desbloqueie conquistas, receba certificado e dispute o ranking global da academia.',
                },
              ].map(({ step, icon, color, title, desc }) => (
                <motion.div
                  key={step}
                  variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className={`relative w-24 h-24 rounded-full bg-${color}/10 border-2 border-${color}/30 flex items-center justify-center mb-8 text-${color}`}>
                    {icon}
                    <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-${color} text-white text-xs font-bold flex items-center justify-center font-mono`}>{step}</span>
                  </div>
                  <h3 className="text-white font-bold text-xl uppercase tracking-wider mb-3">{title}</h3>
                  <p className="text-[#666] text-sm leading-relaxed max-w-xs">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Prova Social */}
      <section className="relative z-10 py-28 bg-[#020202] border-t border-[#111]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-[10px] font-mono text-accent uppercase tracking-widest border border-accent/30 bg-accent/5 px-3 py-1.5 rounded-full mb-4">Comunidade</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white uppercase tracking-tight mb-4">
              Dançarinos Reais. <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">Resultados Reais.</span>
            </h2>
            <p className="text-[#666] max-w-xl mx-auto text-sm">Quem já está na lista de espera sabe o que vem por aí. Esses são os primeiros a acreditar.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { opacity: 1, transition: { staggerChildren: 0.15 } }, hidden: { opacity: 0 } }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            {[
              {
                quote: "Finalmente uma plataforma que entende o que dançarino precisa. Player com loop e espelho? Era o que faltava.",
                name: "Lucas M.",
                role: "Bailarino de Locking, SP",
                stars: 5,
              },
              {
                quote: "Me inscrevi no dia que abriu a lista. A proposta de gamificação com XP e ranking me vendeu na hora. Não vejo a hora de começar.",
                name: "Camila R.",
                role: "Instrutora de Hip-Hop, RJ",
                stars: 5,
                highlight: true,
              },
              {
                quote: "Sempre quis uma plataforma brasileira séria, focada em dança de verdade. O XTAGE parece ser exatamente isso.",
                name: "Rafael T.",
                role: "Estudante de Popping, MG",
                stars: 5,
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5 }}
              >
                <TestimonialCard {...t} />
              </motion.div>
            ))}
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-[#111]"
          >
            {[
              { icon: <Shield size={16} />, text: 'Pagamentos Seguros via Asaas' },
              { icon: <Star size={16} />, text: 'Certificado Reconhecido' },
              { icon: <Users size={16} />, text: 'Comunidade Verificada' },
              { icon: <Zap size={16} />, text: 'Suporte em Português' },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-[#555] text-xs uppercase tracking-widest">
                <span className="text-primary">{badge.icon}</span>
                {badge.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-32 bg-black border-t border-[#111]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111] border border-[#222] mb-6">
              <Shield color="#eb00bc" size={14} />
              <span className="text-[10px] font-mono text-[#eb00bc] uppercase tracking-widest">Acesso Desbloqueado</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-tight">
              O Palco é <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6324b2] to-[#eb00bc]">Todo Seu</span>
            </h2>
            <p className="text-[#666] font-light max-w-2xl mx-auto">
              Liberdade para aprender. Evolua no seu ritmo escolhendo o modelo ideal para a sua jornada.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingModelCard
              title="Cursos Avulsos"
              desc="Vá direto ao ponto. Compre apenas a coreografia ou masterclass que deseja."
              features={["Pagamento único via PIX/Cartão", "Acesso vitalício ao curso", "Direitos a atualizações do material", "Conquistas e XP por conclusão"]}
            />
            <PricingModelCard
              title="Assinatura VIP"
              desc="Assine sua escola favorita ou o passe global XTAGE e acesse catálogos completos."
              features={["Cobrança mensal ou anual", "Acesso a múltiplos cursos", "Cancele a qualquer momento", "Benefícios exclusivos do curador"]}
              highlighted
            />
            <PricingModelCard
              title="Para Escolas (OS)"
              desc="Traga sua escola real para o app e tenha o controle da sua tecnologia."
              features={["White-label na plataforma", "Painel XTAGE OS de gestão", "Múltiplos professores por escola", "Gateway de pagamentos com Split"]}
            />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative z-10 py-32 overflow-hidden border-t border-[#111]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-black to-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,36,178,0.15)_0%,transparent_70%)]" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block text-[10px] font-mono text-white/50 uppercase tracking-widest border border-white/10 bg-white/5 px-3 py-1.5 rounded-full mb-8">29 de Abril de 2026</span>

            <h2 className="font-display text-5xl md:text-7xl font-bold text-white uppercase tracking-tight mb-6 leading-none">
              O PALCO<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">TE ESPERA.</span>
            </h2>

            <p className="text-[#888] text-lg mb-12 max-w-xl mx-auto">
              Garanta sua vaga na lista VIP e seja o primeiro a acessar quando o XTAGE abrir as portas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="#waitlist"
                className="group relative px-12 py-5 bg-white text-black font-bold uppercase tracking-[0.2em] rounded-sm overflow-hidden text-sm flex items-center gap-3"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Garantir Minha Vaga <ChevronRight size={18} />
                </span>
                <div className="absolute inset-0 bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-400 ease-out z-0" />
                <span className="absolute inset-0 text-white z-20 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-bold uppercase tracking-[0.2em] text-sm">
                  Garantir Minha Vaga <ChevronRight size={18} />
                </span>
              </Link>

              <Link
                href="/explore"
                className="px-12 py-5 border border-white/20 text-white hover:bg-white/5 font-bold uppercase tracking-[0.2em] rounded-sm transition-all duration-300 text-sm"
              >
                Explorar Catálogo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#111] bg-[#030303] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="relative w-32 h-8 mb-5">
                <Image src="/images/xpace-on-branco.png" alt="XTAGE" fill className="object-contain object-left" />
              </div>
              <p className="text-[#555] text-sm max-w-sm leading-relaxed mb-6">
                Elevando a arte e o aprendizado físico para a era digital. A tecnologia não substitui — ela te impulsiona.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-4">
                <a
                  href="https://instagram.com/xtageapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-[#666] hover:text-white hover:border-[#444] hover:bg-[#1a1a1a] transition-all duration-200"
                  aria-label="Instagram"
                >
                  <Instagram size={16} />
                </a>
                <a
                  href="https://tiktok.com/@xtage.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-[#666] hover:text-white hover:border-[#444] hover:bg-[#1a1a1a] transition-all duration-200"
                  aria-label="TikTok"
                >
                  <Music2 size={16} />
                </a>
                <a
                  href="https://youtube.com/@xtage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#111] border border-[#222] flex items-center justify-center text-[#666] hover:text-white hover:border-[#444] hover:bg-[#1a1a1a] transition-all duration-200"
                  aria-label="YouTube"
                >
                  <Youtube size={16} />
                </a>
              </div>
            </div>

            {/* Plataforma */}
            <div>
              <span className="text-white font-bold text-xs uppercase tracking-widest block mb-5">Plataforma</span>
              <div className="flex flex-col gap-3">
                <Link href="/explore" className="text-[#555] hover:text-white transition-colors text-sm">Catálogo de Cursos</Link>
                <Link href="/login" className="text-[#555] hover:text-white transition-colors text-sm">Login de Aluno</Link>
                <Link href="/register" className="text-[#555] hover:text-white transition-colors text-sm">Criar Conta</Link>
                <Link href="/seja-parceiro" className="text-[#555] hover:text-white transition-colors text-sm">Seja Parceiro</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <span className="text-white font-bold text-xs uppercase tracking-widest block mb-5">Legal</span>
              <div className="flex flex-col gap-3">
                <Link href="/termos" className="text-[#555] hover:text-white transition-colors text-sm">Termos de Uso</Link>
                <Link href="/privacidade" className="text-[#555] hover:text-white transition-colors text-sm">Política de Privacidade</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-[#111] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[#333] text-xs font-mono uppercase">© 2026 XTAGE. Todos os direitos reservados.</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-500/70 text-xs font-mono uppercase tracking-widest">Sistemas Operacionais</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-[#050505] border border-[#1a1a1a] p-8 rounded-xl hover:bg-[#080808] hover:border-[#2a2a2a] transition-all duration-300 group h-full">
      <div className="w-14 h-14 bg-[#111] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-[#1f1f1f]">
        {icon}
      </div>
      <h3 className="text-white font-bold text-lg uppercase tracking-wider mb-3">{title}</h3>
      <p className="text-[#555] leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function TestimonialCard({ quote, name, role, stars, highlight = false }: {
  quote: string; name: string; role: string; stars: number; highlight?: boolean;
}) {
  return (
    <div className={`relative rounded-xl p-[1px] ${highlight ? 'bg-gradient-to-b from-primary/60 to-secondary/60' : 'bg-[#111]'}`}>
      <div className="bg-[#050505] rounded-xl p-6 h-full flex flex-col">
        <div className="flex gap-0.5 mb-4">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        <p className="text-[#888] text-sm leading-relaxed flex-1 mb-5 italic">"{quote}"</p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
            {name[0]}
          </div>
          <div>
            <p className="text-white text-sm font-bold">{name}</p>
            <p className="text-[#555] text-xs">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Star size={11} className="text-primary" />
      </div>
      <span className="text-[#888] text-sm">{text}</span>
    </li>
  );
}

function PricingModelCard({ title, desc, features, highlighted = false }: {
  title: string; desc: string; features: string[]; highlighted?: boolean;
}) {
  return (
    <div className={`rounded-xl p-[1px] ${highlighted ? 'bg-gradient-to-b from-primary to-secondary' : 'bg-[#1a1a1a] hover:bg-[#252525] transition-colors'}`}>
      <div className="bg-[#050505] rounded-xl p-8 h-full flex flex-col">
        {highlighted && (
          <span className="text-[10px] font-mono text-secondary uppercase tracking-widest border border-secondary/30 bg-secondary/5 px-2 py-1 rounded-full self-start mb-4">Mais popular</span>
        )}
        <h3 className={`text-xl font-bold uppercase tracking-widest mb-2 ${highlighted ? 'text-white' : 'text-[#bbb]'}`}>{title}</h3>
        <p className="text-[#555] text-sm mb-8">{desc}</p>
        <ul className="space-y-4 mb-8 flex-1">
          {features.map((f, i) => <PricingFeature key={i} text={f} />)}
        </ul>
        <Link
          href={highlighted ? "/register" : "/explore"}
          className={`w-full py-4 text-center font-bold text-xs uppercase tracking-[0.15em] rounded-sm transition-all duration-200 border ${highlighted
            ? 'bg-primary text-white hover:bg-primary/80 border-primary'
            : 'bg-transparent text-white border-[#2a2a2a] hover:bg-[#111] hover:border-[#444]'
          }`}
        >
          {highlighted ? 'Tornar-se Membro' : 'Saber Mais'}
        </Link>
      </div>
    </div>
  );
}
