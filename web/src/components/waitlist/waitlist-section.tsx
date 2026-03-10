'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Check, Loader2, Users, Zap, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FEATURES_LEFT = [
    { label: 'Dia Internacional da Dança', sub: '29 de Abril de 2026' },
    { label: 'Acesso Antecipado', sub: 'Lista VIP exclusiva' },
    { label: 'Cursos de Dança', sub: 'Os melhores do Brasil' },
    { label: 'Comunidade', sub: 'Grupo VIP no WhatsApp' },
];

const FEATURES_RIGHT = [
    { label: 'Para Alunos', sub: 'Aprenda com os melhores professores de dança' },
    { label: 'Para Professores', sub: 'Crie sua escola e monetize seus cursos' },
    { label: 'Plataforma Completa', sub: 'Vídeos, comunidade e certificados' },
    { label: 'Lançamento Exclusivo', sub: 'Benefícios só para quem entrar primeiro' },
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

    // Countdown para 29/04/2026 — Dia Internacional da Dança
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

    return (
        <section id="pre-save" className="relative z-10 pt-52 pb-32 overflow-hidden bg-[#030303]">
            {/* Glow de fundo */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/10 blur-[140px] rounded-full" />
            </div>

            {/* Número decorativo gigante ao fundo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                <span className="font-display font-black text-[28vw] leading-none text-white/[0.02] uppercase tracking-tight">
                    29
                </span>
            </div>

            <div className="relative w-full max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-12 lg:gap-8 items-start">

                    {/* ── LATERAL ESQUERDA ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="hidden lg:flex flex-col justify-center gap-8 pt-24"
                    >
                        {/* "29" outline decorativo */}
                        <div className="relative">
                            <span
                                className="font-display font-black text-[10rem] leading-none uppercase tracking-tight select-none"
                                style={{
                                    WebkitTextStroke: '1px rgba(99,36,178,0.3)',
                                    color: 'transparent',
                                }}
                            >
                                29
                            </span>
                            <span className="absolute bottom-2 left-2 font-mono text-xs text-[#444] uppercase tracking-[0.3em]">
                                Abril
                            </span>
                        </div>

                        {/* 4 boxes de features */}
                        <div className="grid grid-cols-2 gap-3">
                            {FEATURES_LEFT.map((f, i) => (
                                <motion.div
                                    key={f.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                                    className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 hover:border-primary/20 transition-colors"
                                >
                                    <p className="text-white text-xs font-bold uppercase tracking-widest leading-tight mb-1">{f.label}</p>
                                    <p className="text-[#555] text-[11px] font-mono leading-tight">{f.sub}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ── CENTRO ── */}
                    <div className="w-full lg:w-[480px]">
                        {/* Badge lançamento */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center text-center mb-12"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-xs font-mono text-primary uppercase tracking-widest">Lançamento Oficial</span>
                            </div>

                            <h2 className="font-display text-5xl md:text-7xl font-bold text-white uppercase tracking-tight leading-none mb-4">
                                29 DE<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">ABRIL</span>
                            </h2>
                            <p className="text-[#888] text-sm font-mono uppercase tracking-widest mb-2">Dia Internacional da Dança</p>
                            <p className="text-[#666] text-base max-w-sm mx-auto leading-relaxed">
                                Seja um dos primeiros a entrar. Cadastre seu e-mail e você será notificado assim que as portas abrirem.
                            </p>

                            {/* Countdown */}
                            <div className="flex items-center gap-3 mt-8">
                                {[
                                    { value: timeLeft.days, label: 'dias' },
                                    { value: timeLeft.hours, label: 'horas' },
                                    { value: timeLeft.minutes, label: 'min' },
                                    { value: timeLeft.seconds, label: 'seg' },
                                ].map(({ value, label }, i) => (
                                    <div key={label}>
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-[#0a0a0a] border border-[#222] rounded-lg flex items-center justify-center">
                                                <span className="font-mono text-2xl font-bold text-white tabular-nums">{pad(value)}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest mt-1">{label}</span>
                                        </div>
                                        {i < 3 && <span className="text-[#333] font-mono text-xl font-bold mb-4 mx-1">:</span>}
                                    </div>
                                ))}
                            </div>

                            {count !== null && count > 0 && (
                                <div className="mt-6 flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2 text-[#666] text-sm">
                                        <Users size={14} />
                                        <span className="font-mono"><strong className="text-white">{count}</strong> {count === 1 ? 'pessoa já está' : 'pessoas já estão'} na lista</span>
                                    </div>
                                    {countByType && (countByType.alunos > 0 || countByType.professores > 0) && (
                                        <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5 text-primary/70">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                                {countByType.alunos} {countByType.alunos === 1 ? 'aluno' : 'alunos'}
                                            </span>
                                            <span className="text-[#333]">·</span>
                                            <span className="flex items-center gap-1.5 text-secondary/70">
                                                <span className="w-1.5 h-1.5 rounded-full bg-secondary/60" />
                                                {countByType.professores} {countByType.professores === 1 ? 'professor' : 'professores'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>

                        {/* Form / Success */}
                        <AnimatePresence mode="wait">
                            {status === 'success' ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    className="bg-[#0a0a0a] border border-green-500/20 rounded-2xl p-10 text-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                                        <Check size={32} className="text-green-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Você está dentro!</h3>
                                    <p className="text-[#888] mb-6">Confira seu e-mail — mandamos uma confirmação com tudo que você precisa saber para o dia 29 de Abril.</p>
                                    <div className="flex items-center justify-center gap-2 text-sm text-[#666]">
                                        <Users size={14} />
                                        <span className="font-mono">{count !== null ? <><strong className="text-white">{count}</strong> pessoas já estão aguardando</> : 'Aguardando o lançamento'}</span>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    onSubmit={handleSubmit}
                                    className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 md:p-10 space-y-5"
                                >
                                    {/* Toggle aluno / professor */}
                                    <div className="flex gap-2 p-1 bg-[#111] border border-[#222] rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setType('aluno')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${type === 'aluno' ? 'bg-primary text-white shadow-lg' : 'text-[#666] hover:text-white'}`}
                                        >
                                            <Zap size={14} /> Quero Aprender
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setType('criador')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-bold uppercase tracking-widest transition-all ${type === 'criador' ? 'bg-secondary text-white shadow-lg' : 'text-[#666] hover:text-white'}`}
                                        >
                                            <GraduationCap size={14} /> Quero ser Professor
                                        </button>
                                    </div>

                                    {/* Campos */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">Nome *</label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="Seu nome"
                                                className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors placeholder:text-[#444]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">E-mail *</label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="seu@email.com"
                                                className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors placeholder:text-[#444]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-mono uppercase tracking-widest text-[#666] mb-1.5">
                                            WhatsApp <span className="text-[#444]">(opcional — para grupo VIP)</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={whatsapp}
                                            onChange={e => setWhatsapp(e.target.value)}
                                            placeholder="(11) 9 9999-9999"
                                            className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded-lg px-4 py-3 text-white text-sm outline-none transition-colors placeholder:text-[#444]"
                                        />
                                    </div>

                                    {status === 'error' && (
                                        <p className="text-red-500 text-sm font-mono">{errorMsg}</p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black font-bold uppercase tracking-[0.2em] rounded-lg text-sm hover:bg-[#eee] transition-colors disabled:opacity-50"
                                    >
                                        {status === 'loading' ? (
                                            <><Loader2 size={16} className="animate-spin" /> Cadastrando...</>
                                        ) : (
                                            <>Garantir meu lugar <ArrowRight size={16} /></>
                                        )}
                                    </button>

                                    <p className="text-center text-[#444] text-xs font-mono">
                                        Sem spam. Só um e-mail no dia do lançamento.
                                    </p>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── LATERAL DIREITA ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="hidden lg:flex flex-col justify-center gap-6 pt-24"
                    >
                        {FEATURES_RIGHT.map((f, i) => (
                            <motion.div
                                key={f.label}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
                                className="group"
                            >
                                {/* linha decorativa */}
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-px bg-gradient-to-r from-primary/40 to-transparent flex-1 max-w-[60px] group-hover:max-w-[80px] transition-all duration-500" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors duration-300" />
                                </div>
                                <p className="text-white text-sm font-bold uppercase tracking-widest leading-tight">{f.label}</p>
                                <p className="text-[#555] text-xs font-mono mt-1 leading-relaxed">{f.sub}</p>
                            </motion.div>
                        ))}

                        {/* linha decorativa final */}
                        <div className="flex items-center gap-2 mt-2">
                            <div className="h-px bg-gradient-to-r from-secondary/30 to-transparent w-full max-w-[120px]" />
                            <div className="h-px bg-gradient-to-r from-primary/20 to-transparent w-full max-w-[80px]" />
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
