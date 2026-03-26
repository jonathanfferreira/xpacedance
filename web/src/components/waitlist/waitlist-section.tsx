'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Check, Loader2, Users, Zap, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FEATURES_LEFT = [
    { label: 'Dia Internacional da Dança', sub: '29 de Abril de 2026' },
    { label: 'Fila de Espera', sub: 'Seja notificado no lançamento' },
    { label: 'Diversos Estilos', sub: 'Aprenda no seu próprio ritmo' },
    { label: 'Notificações', sub: 'Receba alertas oficiais' },
];

const FEATURES_RIGHT = [
    { label: 'Para Alunos', sub: 'Aprenda onde e como quiser' },
    { label: 'Para Professores', sub: 'Crie sua própria escola digital' },
    { label: 'Plataforma Completa', sub: 'Vídeos, ferramentas e performance' },
    { label: 'Aviso de Abertura', sub: 'Seja alertado assim que abrir' },
];

export function WaitlistSection() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [type, setType] = useState<'aluno' | 'criador'>('aluno');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [count, setCount] = useState<number | null>(null);
    const [countByType, setCountByType] = useState<{ alunos: number; professores: number } | null>(null);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    // Countdown para 29/04/2026
    useEffect(() => {
        const target = new Date('2026-04-29T10:00:00-03:00').getTime();
        const tick = () => {
            const diff = target - Date.now();
            if (diff <= 0) return;
            setTimeLeft({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                minutes: Math.floor((diff % 3600000) / 60000),
                seconds: Math.floor((diff % 60000) / 1000),
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        fetch('/api/waitlist')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.count) setCount(data.count);
                if (data?.alunos !== undefined) setCountByType({ alunos: data.alunos, professores: data.professores });
            })
            .catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, whatsapp, type }),
            });
            const data = await res.json();
            if (!res.ok) {
                setErrorMsg(data.error || 'Erro ao cadastrar.');
                setStatus('error');
                return;
            }
            if (data.count) setCount(data.count);
            if (data.alunos !== undefined) setCountByType({ alunos: data.alunos, professores: data.professores });
            setStatus('success');
        } catch {
            setErrorMsg('Erro de conexão. Tente novamente.');
            setStatus('error');
        }
    };

    const pad = (n: number) => String(n).padStart(2, '0');

    const isProfessor = type === 'criador';
    const accentBorder = isProfessor ? 'border-[#ff0080]/30' : 'border-primary/30';
    const accentGlow = isProfessor ? 'bg-[#ff0080]/10' : 'bg-primary/10';
    const accentText = isProfessor ? 'text-[#ff0080]' : 'text-primary';
    const accentFocusBorder = isProfessor ? 'focus:border-[#ff0080]/50' : 'focus:border-primary/50';
    const accentBtnBg = isProfessor ? 'bg-[#ff0080]/20' : 'bg-primary/20';

    return (
        <section id="pre-save" className="relative z-10 pt-16 pb-32 overflow-hidden bg-[#020202]">
            
            {/* Outline 29 gigante ao fundo para compor com a página */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none overflow-hidden opacity-30">
                <span className="font-display font-black text-[25vw] md:text-[35vw] leading-none text-white/[0.015] uppercase tracking-tight">
                    29
                </span>
            </div>

            <div className="relative w-full max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">

                    {/* ── COLUNA ESQUERDA: FORM & MAIOR FEATURES ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="flex flex-col gap-12 w-full"
                    >
                        {/* THE FORM */}
                        <div className="w-full">
                            <AnimatePresence mode="wait">
                                {status === 'success' ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                        className="bg-[#050505] border border-green-500/20 rounded-2xl p-10 text-center shadow-[0_0_50px_rgba(34,197,94,0.05)]"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                                            <Check size={32} className="text-green-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Você está na fila!</h3>
                                        <p className="text-[#888] mb-6 text-sm">Confira seu e-mail — mandamos a confirmação com tudo que você precisa saber.</p>
                                        <div className="flex items-center justify-center gap-2 text-sm text-[#666]">
                                            <Users size={14} />
                                            <span className="font-mono">{count !== null ? <><strong className="text-white">{count}</strong> pessoas já estão aguardando</> : 'Aguardando o lançamento'}</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        key="form"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onSubmit={handleSubmit}
                                        className={`bg-[#0a0a0a]/80 backdrop-blur-xl border rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden transition-colors duration-300 ${accentBorder}`}
                                    >
                                        <div className={`absolute -top-10 -right-10 w-48 h-48 blur-[80px] rounded-full pointer-events-none transition-colors duration-300 ${accentGlow}`} />

                                        {/* Informador de lista */}
                                        {count !== null && count > 0 && (
                                            <div className="flex flex-col items-center gap-1.5 mb-2 relative z-10 w-full text-center">
                                                <div className={`flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${accentText}`}>
                                                    <Users size={12} />
                                                    <span className="font-mono">{count} Pessoas na Fila</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Toggle aluno / professor */}
                                        <div className="flex gap-2 p-1 bg-[#111] border border-[#222] rounded-lg relative z-10">
                                            <button
                                                type="button"
                                                onClick={() => setType('aluno')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${type === 'aluno' ? 'bg-primary text-white shadow-lg' : 'text-[#666] hover:text-white'}`}
                                            >
                                                <Zap size={14} /> Sou Aluno
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setType('criador')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${type === 'criador' ? 'bg-[#ff0080] text-white shadow-lg' : 'text-[#666] hover:text-white'}`}
                                            >
                                                <GraduationCap size={14} /> Sou Professor
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                                            <div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    placeholder="Seu nome"
                                                    className={`w-full bg-[#111] border border-[#222] focus:bg-[#151515] rounded-lg px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder:text-[#444] ${accentFocusBorder}`}
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    placeholder="seu@email.com"
                                                    className={`w-full bg-[#111] border border-[#222] focus:bg-[#151515] rounded-lg px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder:text-[#444] ${accentFocusBorder}`}
                                                />
                                            </div>
                                        </div>

                                        <div className="relative z-10">
                                            <input
                                                type="tel"
                                                value={whatsapp}
                                                onChange={e => setWhatsapp(e.target.value)}
                                                placeholder="WhatsApp (opcional)"
                                                className={`w-full bg-[#111] border border-[#222] focus:bg-[#151515] rounded-lg px-4 py-3.5 text-white text-sm outline-none transition-colors placeholder:text-[#444] ${accentFocusBorder}`}
                                            />
                                        </div>

                                        {status === 'error' && (
                                            <p className="text-red-500 text-xs font-mono text-center relative z-10">{errorMsg}</p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={status === 'loading'}
                                            className="w-full relative group bg-white text-black py-4 rounded-lg text-sm transition-all disabled:opacity-50 overflow-hidden"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2 font-bold uppercase tracking-[0.2em]">
                                                {status === 'loading' ? (
                                                    <><Loader2 size={16} className="animate-spin" /> Adicionando...</>
                                                ) : (
                                                    <>Entrar na Fila Oficial <ArrowRight size={16} /></>
                                                )}
                                            </span>
                                            <div className={`absolute inset-0 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out z-0 opacity-30 ${accentBtnBg}`} />
                                        </button>
                                        
                                        <p className="text-center text-[#444] text-[10px] font-mono uppercase tracking-widest relative z-10">
                                            Sem spam. Prometemos.
                                        </p>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* FEATURES LEFT (MAIOR) */}
                        <div className="grid grid-cols-2 gap-4">
                            {FEATURES_LEFT.map((f, i) => (
                                <motion.div
                                    key={f.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                                    className="bg-[#080808] border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-colors shadow-lg"
                                >
                                    <p className="text-white text-sm font-bold uppercase tracking-widest leading-tight mb-2">{f.label}</p>
                                    <p className="text-[#666] text-xs font-mono leading-relaxed">{f.sub}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ── COLUNA DIREITA: CONTAGEM & FEATURES DESCE ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="flex flex-col gap-12 lg:pl-10 lg:pt-8"
                    >
                        {/* 29 DE ABRIL & COUNTDOWN */}
                        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                            <h2 className="font-display text-5xl md:text-7xl font-bold text-white uppercase tracking-tight leading-none mb-4">
                                29 DE<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#ff0080]">ABRIL</span>
                            </h2>
                            <p className="text-[#888] text-sm font-mono uppercase tracking-widest mb-2">Abertura: Dia da Dança</p>
                            <p className="text-[#666] text-sm max-w-sm leading-relaxed mb-8">
                                Inscreva-se para receber as notificações oficiais do ecossistema e não perca sua vaga.
                            </p>

                            {/* Countdown */}
                            <div className="flex items-center gap-3">
                                {[
                                    { value: timeLeft.days, label: 'dias' },
                                    { value: timeLeft.hours, label: 'hr' },
                                    { value: timeLeft.minutes, label: 'min' },
                                    { value: timeLeft.seconds, label: 'seg' },
                                ].map(({ value, label }, i) => (
                                    <div key={label} className="flex flex-col items-center">
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-[#0a0a0a] border border-[#222] rounded-lg flex items-center justify-center">
                                            <span className="font-mono text-xl md:text-2xl font-bold text-white tabular-nums">{pad(value)}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest mt-2">{label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Detalhamento Pessoas na Fila (Abaixo Countdown) se houver */}
                            {countByType && (countByType.alunos > 0 || countByType.professores > 0) && (
                                <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest mt-6">
                                    <span className="flex items-center gap-1.5 text-primary/70">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                        {countByType.alunos} {countByType.alunos === 1 ? 'aluno' : 'alunos'}
                                    </span>
                                    <span className="text-[#333]">·</span>
                                    <span className="flex items-center gap-1.5 text-[#ff0080]/70">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff0080]/60" />
                                        {countByType.professores} {countByType.professores === 1 ? 'professor' : 'professores'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* FEATURES RIGHT (DESCE) */}
                        <div className="flex flex-col gap-6">
                            {FEATURES_RIGHT.map((f, i) => (
                                <motion.div
                                    key={f.label}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                                    className="group"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-px bg-gradient-to-r from-primary/40 to-transparent flex-1 max-w-[60px] group-hover:max-w-[80px] transition-all duration-500" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors duration-300" />
                                    </div>
                                    <p className="text-white text-sm font-bold uppercase tracking-widest leading-tight">{f.label}</p>
                                    <p className="text-[#555] text-xs font-mono mt-1 leading-relaxed">{f.sub}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
