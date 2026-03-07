'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, TrendingUp, DollarSign, Video, CheckCircle } from 'lucide-react';

export default function PartnerOnboardingPage() {
    const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormState('loading');

        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch('/api/partner/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schoolName: formData.get('schoolName'),
                    instagram: formData.get('instagram'),
                    whatsapp: formData.get('whatsapp'),
                    videoUrl: formData.get('videoUrl') || undefined,
                }),
            });

            if (res.status === 401) {
                window.location.href = `/login?redirect=${encodeURIComponent('/seja-parceiro')}`;
                return;
            }

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Erro ao enviar aplicação.');

            setFormState('success');
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro inesperado. Tente novamente.');
            setFormState('error');
        }
    }

    return (
        <div className="min-h-screen bg-[#020202] text-[#ededed] font-sans overflow-x-hidden selection:bg-primary/30 selection:text-white">
            {/* Navbar Minimalista */}
            <header className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="relative w-32 h-8 block">
                        <Image src="/images/xpace-on-branco.png" alt="XTAGE" fill className="object-contain object-left" />
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/" className="hidden md:block text-sm font-semibold text-[#888] hover:text-white transition-colors uppercase tracking-widest">
                            Voltar ao Início
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-6">
                {/* Glow Effects */}
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#6324b2]/20 blur-[150px] rounded-full mix-blend-screen opacity-50 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm">
                            <span className="text-secondary font-bold text-xs uppercase tracking-widest">Escale sua Escola</span>
                        </div>

                        <h1 className="font-display text-4xl md:text-6xl leading-[1.1] md:leading-[1.1] font-bold text-white mb-6 uppercase tracking-tight">
                            A Plataforma <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Definitiva</span> Para Criadores de Dança
                        </h1>

                        <p className="text-lg text-[#888] font-light max-w-xl mb-10 leading-relaxed">
                            Junte-se à XTAGE e monetize seu conhecimento. Hospedagem 4K, checkout transparente de alta conversão, split automático de pagamentos e uma experiência de streaming premium para seus alunos.
                        </p>

                        <ul className="space-y-4 mb-12">
                            {[
                                "Infraestrutura de Streaming (Anti-Pirataria)",
                                "Checkout Transparente (PIX e Cartão Asaas)",
                                "Split Automático (Seu dinheiro cai direto na sua conta)",
                                "Sistema de Gamificação e XP"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-[#aaa] font-medium">
                                    <CheckCircle className="text-primary shrink-0" size={18} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Form Card */}
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl opacity-20 blur-xl"></div>
                        <div className="relative bg-[#0a0a0a] border border-[#222] p-8 md:p-10 rounded-2xl shadow-2xl">

                            {formState === 'success' ? (
                                <div className="py-2">
                                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle className="text-primary w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-heading tracking-widest text-white mb-4 uppercase">Aplicação Recebida</h3>
                                    <p className="text-[#888] font-sans text-sm mb-8 leading-relaxed">Nossa diretoria irá examinar o seu portfólio. Se você for aprovado, estes são os próximos passos:</p>

                                    <div className="space-y-4 text-left">
                                        <div className="bg-[#111] border border-[#222] p-4 rounded flex items-start gap-4">
                                            <div className="bg-[#1a1a1a] rounded text-[#888] w-6 h-6 flex items-center justify-center shrink-0 font-mono text-xs">1</div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Onboarding Asaas</h4>
                                                <p className="text-[#666] text-xs">Você receberá um link para ativar sua conta de pagamentos com nosso parceiro bancário.</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#111] border border-[#222] p-4 rounded flex items-start gap-4">
                                            <div className="bg-[#1a1a1a] rounded text-[#888] w-6 h-6 flex items-center justify-center shrink-0 font-mono text-xs">2</div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Acesso ao XTAGE OS</h4>
                                                <p className="text-[#666] text-xs">Seu dashboard de professor será desbloqueado com todas as ferramentas de creator.</p>
                                            </div>
                                        </div>
                                        <div className="bg-[#111] border border-[#222] p-4 rounded flex items-start gap-4">
                                            <div className="bg-[#1a1a1a] rounded text-[#888] w-6 h-6 flex items-center justify-center shrink-0 font-mono text-xs">3</div>
                                            <div>
                                                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Upload & Play</h4>
                                                <p className="text-[#666] text-xs">Cadastre seu primeiro curso em 4K, ajuste os módulos e inicie a revolução.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Aplique para ser Parceiro</h3>
                                    <p className="text-[#666] text-sm mb-8">Vagas limitadas para manter a qualidade e curadoria da plataforma.</p>

                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#888] uppercase tracking-widest">Nome da Escola / Estúdio</label>
                                            <input required name="schoolName" type="text" className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="Estúdio João Coreógrafo" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#888] uppercase tracking-widest">Instagram / Portfólio</label>
                                            <input required name="instagram" type="text" className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="@xtageapp" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#888] uppercase tracking-widest">WhatsApp</label>
                                            <input required name="whatsapp" type="tel" className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="(11) 99999-9999" />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#888] uppercase tracking-widest">Link de Vídeo (opcional)</label>
                                            <input name="videoUrl" type="url" className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="https://youtube.com/..." />
                                        </div>

                                        {formState === 'error' && (
                                            <p className="text-red-400 text-sm font-mono">{errorMsg}</p>
                                        )}

                                        <button
                                            disabled={formState === 'loading'}
                                            type="submit"
                                            className="w-full mt-4 bg-primary text-white font-bold uppercase tracking-[0.2em] py-4 rounded-sm hover:bg-primary/80 transition-all disabled:opacity-50"
                                        >
                                            {formState === 'loading' ? 'Enviando...' : 'Solicitar Convite'}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Blocks */}
            <section className="py-24 bg-black border-y border-[#1a1a1a]">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
                    <FeatureCard
                        icon={<Video />}
                        title="Hospedagem Premium"
                        desc="Esqueça plataformas genéricas. Entregue seu conteúdo em 4K, sem travamentos, com o player de dança imersivo do XTAGE."
                    />
                    <FeatureCard
                        icon={<DollarSign />}
                        title="Split Transparente"
                        desc="Conecte sua conta Asaas no Dashboard. No segundo que o aluno compra, a sua comissão (90%) cai direto na sua carteira."
                    />
                    <FeatureCard
                        icon={<TrendingUp />}
                        title="Dashboard Studio"
                        desc="Acompanhe vendas em tempo real, XP dos seus alunos, conversões de página e dados para escalar suas ofertas."
                    />
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-[#050505] border border-[#1a1a1a] p-8 rounded-xl hover:border-primary/50 transition-colors group">
            <div className="w-12 h-12 bg-[#111] rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-6 border border-[#222]">
                {icon}
            </div>
            <h3 className="text-white font-bold text-xl uppercase tracking-wider mb-3">{title}</h3>
            <p className="text-[#666] leading-relaxed text-sm">{desc}</p>
        </div>
    );
}
