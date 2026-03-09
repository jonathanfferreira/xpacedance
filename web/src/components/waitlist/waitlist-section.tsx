'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Check, Loader2, Users, Zap, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function WaitlistSection() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [type, setType] = useState<'aluno' | 'criador'>('aluno');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [count, setCount] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    // Countdown para 29/03/2026
    useEffect(() => {
        const target = new Date('2026-03-29T10:00:00-03:00').getTime();
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

    // Busca contagem atual
    useEffect(() => {
        fetch('/api/waitlist')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.count) setCount(data.count); })
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
            setStatus('success');
        } catch {
            setErrorMsg('Erro de conexão. Tente novamente.');
            setStatus('error');
        }
    };

    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        <section id="pre-save" className="relative z-10 py-32 overflow-hidden bg-[#030303] border-t border-[#111]">
            {/* Glow de fundo */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative max-w-3xl mx-auto px-6">
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
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">MARÇO</span>
                    </h2>
                    <p className="text-[#888] text-lg max-w-xl mx-auto leading-relaxed">
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

                    {/* Contador de inscritos */}
                    {count !== null && count > 0 && (
                        <div className="flex items-center gap-2 mt-6 text-[#666] text-sm">
                            <Users size={14} />
                            <span className="font-mono"><strong className="text-white">{count}</strong> {count === 1 ? 'pessoa já está' : 'pessoas já estão'} na lista</span>
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
                            <p className="text-[#888] mb-6">Confira seu e-mail — mandamos uma confirmação com tudo que você precisa saber para o dia 29.</p>
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
                            {/* Toggle aluno / criador */}
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
                                    <Star size={14} /> Quero Criar & Vender
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
        </section>
    );
}
