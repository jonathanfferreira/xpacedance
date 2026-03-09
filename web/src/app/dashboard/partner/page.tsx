'use client';

import { useState, useEffect } from 'react';
import { Rocket, DollarSign, Users, LayoutDashboard, CheckCircle2, ArrowRight, AlertTriangle, Loader2, Clock, ShieldCheck } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

type TenantStatus = 'pending' | 'active' | 'suspended' | null;

export default function PartnerProgramPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [existingStatus, setExistingStatus] = useState<TenantStatus>(null);
    const [schoolName, setSchoolName] = useState('');
    const [checkingStatus, setCheckingStatus] = useState(true);

    useEffect(() => {
        const checkExisting = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setCheckingStatus(false); return; }

            const { data: tenant } = await supabase
                .from('tenants')
                .select('name, status')
                .eq('owner_id', user.id)
                .single();

            if (tenant) {
                setExistingStatus(tenant.status as TenantStatus);
                setSchoolName(tenant.name);
            }
            setCheckingStatus(false);
        };
        checkExisting();
    }, []);

    if (checkingStatus) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center">
                <Loader2 className="animate-spin mx-auto mb-4 text-[#555]" size={32} />
                <p className="text-[#666]">Verificando status...</p>
            </div>
        );
    }

    // Show status card if already applied
    if (existingStatus) {
        return (
            <div className="max-w-2xl mx-auto py-20 animate-fade-in">
                <div className={`border rounded-2xl p-10 text-center ${existingStatus === 'active' ? 'border-green-500/30 bg-green-500/5' :
                    existingStatus === 'pending' ? 'border-yellow-500/30 bg-yellow-500/5' :
                        'border-red-500/30 bg-red-500/5'
                    }`}>
                    {existingStatus === 'active' && <ShieldCheck className="mx-auto mb-4 text-green-500" size={48} />}
                    {existingStatus === 'pending' && <Clock className="mx-auto mb-4 text-yellow-500" size={48} />}
                    {existingStatus === 'suspended' && <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />}

                    <h2 className="text-white font-heading text-2xl uppercase mb-3">{schoolName}</h2>
                    <p className={`font-mono text-sm uppercase tracking-widest mb-6 ${existingStatus === 'active' ? 'text-green-500' :
                        existingStatus === 'pending' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                        {existingStatus === 'active' && '✅ ESCOLA ATIVA — Acesse seu Creator Studio'}
                        {existingStatus === 'pending' && '⏳ SOLICITAÇÃO EM ANÁLISE — Aguarde aprovação do Master'}
                        {existingStatus === 'suspended' && '⛔ ESCOLA SUSPENSA — Entre em contato com o suporte'}
                    </p>

                    {existingStatus === 'active' ? (
                        <div className="text-left mt-8 space-y-6">
                            <div className="bg-[#111] border border-[#222] p-5 rounded-xl">
                                <h3 className="text-white font-bold font-heading uppercase text-lg mb-2 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs">1</div>
                                    Pagamentos & Split
                                </h3>
                                <p className="text-[#888] text-sm">A sua escola já foi conectada ao Asaas. Todos os seus ganhos vão direto para a carteira cadastrada. Acesse seu Creator Studio para configurar a chave PIX recebedora de royalties.</p>
                            </div>

                            <div className="bg-[#111] border border-[#222] p-5 rounded-xl">
                                <h3 className="text-white font-bold font-heading uppercase text-lg mb-2 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs">2</div>
                                    Suba seu Material
                                </h3>
                                <p className="text-[#888] text-sm">O XTAGE OS fornece encriptação automática (DRM). Basta subir seus arquivos de aula e a plataforma gera a Landing Page do curso e rastreia o XP dos seus alunos automaticamente.</p>
                            </div>

                            <div className="flex justify-center pt-6">
                                <Link href="/studio" className="bg-white text-black font-bold px-10 py-4 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-3">
                                    <LayoutDashboard size={20} /> ENTRAR NO CREATOR STUDIO
                                </Link>
                            </div>
                        </div>
                    ) : existingStatus === 'pending' ? (
                        <p className="text-[#888] text-sm mt-4">Nossa diretoria está verificando suas credenciais de professor. O processo leva em média 2 a 3 dias úteis. Um e-mail será disparado com o parecer.</p>
                    ) : null}
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);

        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            schoolName: formData.get('schoolName'),
            instagram: formData.get('instagram'),
            whatsapp: formData.get('whatsapp'),
            videoUrl: formData.get('videoUrl'),
        };

        try {
            const res = await fetch('/api/partner/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || 'Erro ao enviar solicitação.');
            }

            setIsSubmitted(true);
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
            {/* Header / Hero */}
            <div className="relative rounded-2xl overflow-hidden border border-[#222] bg-[#050505] pt-12 px-6 pb-6 md:px-12 md:py-16 text-center isolate">
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent z-0"></div>
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <Rocket className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-white uppercase tracking-wider mb-4">
                        XTAGE <span className="text-red-500">PARTNER</span>
                    </h1>
                    <p className="text-[#888] md:text-lg max-w-2xl font-sans mb-8">
                        Seja dono do seu próprio pedaço na pista. Transforme seus alunos presenciais em globais,
                        crie assinaturas, cursos avulsos e tenha seu próprio Studio Manager.
                    </p>
                    <a href="#application-form" className="bg-red-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2">
                        Quero Ser um Professor <ArrowRight size={16} />
                    </a>
                </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl hover:border-red-500/30 transition-colors group">
                    <DollarSign className="text-red-500 mb-4 group-hover:scale-110 transition-transform" size={28} />
                    <h3 className="text-white font-bold font-heading uppercase tracking-wide mb-2">Monetização Direta</h3>
                    <p className="text-[#666] text-sm leading-relaxed">Venda assinaturas mensais ou masterclasses avulsas. O dinheiro cai direto na sua conta operada pelo Asaas (Gateway).</p>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl hover:border-red-500/30 transition-colors group">
                    <LayoutDashboard className="text-red-500 mb-4 group-hover:scale-110 transition-transform" size={28} />
                    <h3 className="text-white font-bold font-heading uppercase tracking-wide mb-2">Studio Dashboard</h3>
                    <p className="text-[#666] text-sm leading-relaxed">Você ganha acesso à aba secreta /studio. Lá você faz upload de aulas criptografadas (Anti-Pirataria) e gere seus alunos.</p>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl hover:border-red-500/30 transition-colors group">
                    <Users className="text-red-500 mb-4 group-hover:scale-110 transition-transform" size={28} />
                    <h3 className="text-white font-bold font-heading uppercase tracking-wide mb-2">Comunidade Global</h3>
                    <p className="text-[#666] text-sm leading-relaxed">Seu catálogo ficará exposto para toda a rede XTAGE, permitindo que dançarinos do mundo inteiro descubram sua didática.</p>
                </div>
            </div>

            {/* Application Form */}
            <div id="application-form" className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                {isSubmitted ? (
                    <div className="text-center py-12 relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="text-green-500" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Solicitação Recebida!</h2>
                        <p className="text-[#888] mb-6 max-w-md">
                            Nossa equipe de curadoria master está analisando seu perfil. Quando você for aprovado, seu
                            Painel Studio será ativado automaticamente e você receberá um e-mail de boas vindas com as chaves bancárias SubAsaas.
                        </p>
                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="text-red-500 underline text-sm hover:text-white"
                        >
                            Verificar status no dashboard
                        </button>
                    </div>
                ) : (
                    <div className="relative z-10">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white font-display uppercase tracking-wide mb-2">Formulário de Inscrição</h2>
                            <p className="text-[#666]">Preencha os dados abaixo para a curadoria do CEO.</p>
                        </div>

                        {errorMsg && (
                            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm flex items-center gap-3">
                                <AlertTriangle size={18} /> {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-mono text-[#888] uppercase mb-2">Nome da Escola ou Prof. (Artístico)</label>
                                    <input
                                        type="text"
                                        name="schoolName"
                                        required
                                        placeholder="Ex: Urban Dynamics"
                                        className="w-full bg-[#111] border border-[#222] rounded-lg p-3.5 text-white font-sans text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-mono text-[#888] uppercase mb-2">Instagram (Curadoria)</label>
                                    <input
                                        type="text"
                                        name="instagram"
                                        required
                                        placeholder="@seu.instagram"
                                        className="w-full bg-[#111] border border-[#222] rounded-lg p-3.5 text-white font-sans text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-[#888] uppercase mb-2">WhatsApp para Contato Direto</label>
                                <input
                                    type="tel"
                                    name="whatsapp"
                                    required
                                    placeholder="+55 (11) 99999-9999"
                                    className="w-full bg-[#111] border border-[#222] rounded-lg p-3.5 text-white font-sans text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                                />
                                <p className="text-[#555] text-xs mt-2">Nossa equipe entrará em contato via WhatsApp caso aprovado.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-mono text-[#888] uppercase mb-2">Link de Vídeo (Opcional - YouTube, TikTok, Drive)</label>
                                <input
                                    type="url"
                                    name="videoUrl"
                                    placeholder="https://"
                                    className="w-full bg-[#111] border border-[#222] rounded-lg p-3.5 text-white font-sans text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                                />
                                <p className="text-[#555] text-xs mt-2">Um link mostrando você ou seus alunos dançando acelera o processo.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 mt-8 flex items-center justify-center gap-2 font-bold uppercase tracking-widest rounded-lg transition-colors ${isLoading ? 'bg-red-500/50 text-white/50 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
                            >
                                {isLoading ? <><Loader2 className="animate-spin" size={20} /> Transmitindo...</> : 'Enviar para Curadoria'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
