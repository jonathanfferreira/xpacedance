import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Plus, TrendingUp, Users, DollarSign, CheckCircle2, Search } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';

async function getAffiliateData() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Buscar afiliações desse usuário
    const { data: affiliates } = await supabase
        .from('affiliates')
        .select(`
            id, affiliate_code, commission_pct, is_active, created_at,
            tenants(id, name, slug)
        `)
        .eq('user_id', user.id);

    if (!affiliates || affiliates.length === 0) return { isAffiliate: false, affiliates: [] };

    // Buscar métricas de tracking para os afiliados desse user
    const affiliateIds = affiliates.map(a => a.id);
    const { data: trackings } = await supabase
        .from('referral_tracking')
        .select('affiliate_id, converted, commission_amt')
        .in('affiliate_id', affiliateIds);

    // Agrupar métricas por affiliate_id
    const metricsMap: Record<string, { clicks: number, conversions: number, revenue: number }> = {};

    affiliateIds.forEach(id => {
        metricsMap[id] = { clicks: 0, conversions: 0, revenue: 0 };
    });

    (trackings || []).forEach(t => {
        if (metricsMap[t.affiliate_id]) {
            metricsMap[t.affiliate_id].clicks += 1;
            if (t.converted) {
                metricsMap[t.affiliate_id].conversions += 1;
                metricsMap[t.affiliate_id].revenue += Number(t.commission_amt || 0);
            }
        }
    });

    const enrichedAffiliates = affiliates.map(a => ({
        ...a,
        metrics: metricsMap[a.id]
    }));

    return { isAffiliate: true, affiliates: enrichedAffiliates };
}

export default async function AffiliatesDashboardPage() {
    const data = await getAffiliateData();

    if (!data) {
        return <div className="p-8 text-white font-mono uppercase tracking-widest text-sm">Carregando...</div>;
    }

    const { isAffiliate, affiliates } = data;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <TrendingUp size={28} className="text-primary" />
                    Programa de Afiliados
                </h1>
                <p className="text-[#888] font-mono text-xs uppercase tracking-widest leading-relaxed max-w-2xl">
                    Indique cursos das nossas escolas parceiras e ganhe comissões diretas em dinheiro por cada nova matrícula gerada através do seu link exclusivo.
                </p>
            </div>

            {!isAffiliate ? (
                <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-[#1a1a1a] rounded-xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#111] border border-[#222] text-[#666] mb-6 relative z-10">
                        <DollarSign size={32} />
                    </div>
                    <h2 className="text-2xl font-heading text-white uppercase tracking-tight mb-4 relative z-10">
                        Você ainda não é parceiro de nenhuma escola
                    </h2>
                    <p className="text-[#888] max-w-xl mx-auto mb-8 relative z-10 font-sans leading-relaxed">
                        Encontre cursos incríveis na nossa rede, solicite afiliação e comece a gerar uma nova fonte de renda indicando a educação que você confia.
                    </p>
                    <Link
                        href="/dashboard/explore"
                        className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-md font-mono text-sm uppercase tracking-widest hover:bg-[#ccc] transition-colors relative z-10 font-bold"
                    >
                        <Search size={16} /> Explorar Cursos
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {affiliates.map((aff: any) => {
                        const tenantName = aff.tenants?.name || 'Escola Invisível';
                        const slug = aff.tenants?.slug || 'xpace';
                        const affiliateLink = `https://${slug}.xtage.app/?ref=${aff.affiliate_code}`;
                        const metrics = aff.metrics;

                        return (
                            <div key={aff.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#333] transition-colors">
                                {/* Cabeçalho do Card */}
                                <div className="p-6 border-b border-[#151515] bg-gradient-to-r from-[#111] to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold text-white tracking-tight">{tenantName}</h3>
                                            {!aff.is_active && (
                                                <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest">Inativo</span>
                                            )}
                                            {aff.is_active && (
                                                <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest flex items-center gap-1">
                                                    <CheckCircle2 size={10} /> Ativo
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[#666] text-xs font-mono uppercase tracking-widest">
                                            Comissão: <span className="text-primary font-bold">{aff.commission_pct}%</span> por venda
                                        </p>
                                    </div>

                                    {/* Link Box */}
                                    <div className="bg-[#050505] border border-[#222] rounded p-2 flex items-center gap-3 mt-4 md:mt-0 max-w-md w-full">
                                        <code className="flex-1 text-primary text-xs font-mono px-2 truncate selection:bg-primary/30">
                                            {affiliateLink}
                                        </code>
                                        <CopyButton text={affiliateLink} />
                                    </div>
                                </div>

                                {/* KPIs */}
                                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#151515] bg-[#050505]">
                                    <div className="p-6 flex flex-col justify-center">
                                        <span className="text-[#666] text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Users size={12} className="text-[#888]" /> Cliques (Views)
                                        </span>
                                        <span className="text-2xl font-display font-medium text-white">{metrics.clicks}</span>
                                    </div>
                                    <div className="p-6 flex flex-col justify-center">
                                        <span className="text-[#666] text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <CheckCircle2 size={12} className="text-green-500" /> Matrículas (Conversões)
                                        </span>
                                        <span className="text-2xl font-display font-medium text-white">{metrics.conversions}</span>
                                    </div>
                                    <div className="p-6 flex flex-col justify-center">
                                        <span className="text-[#666] text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <DollarSign size={12} className="text-[#ffbd2e]" /> Saldo Acumulado
                                        </span>
                                        <span className="text-2xl font-display font-medium text-[#ffbd2e]">
                                            R$ {metrics.revenue.toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Botão para procurar mais escolas */}
                    <div className="pt-4 flex justify-end">
                        <Link
                            href="/dashboard/explore"
                            className="inline-flex items-center gap-2 text-primary hover:text-white font-mono text-xs tracking-widest uppercase transition-colors"
                        >
                            <Plus size={14} /> Afiliar-se a outras Escolas
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
