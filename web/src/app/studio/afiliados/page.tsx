import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Users, DollarSign, TrendingUp, CheckCircle2, ShieldAlert } from 'lucide-react';

async function getStudioAffiliates() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Achar o tenant do usuario
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!tenant) return null;

    // Buscar todos afiliados desse tenant com dados do usuario
    const { data: affiliates } = await supabase
        .from('affiliates')
        .select(`
            id, affiliate_code, commission_pct, is_active, created_at,
            users(full_name, email)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

    if (!affiliates) return { affiliates: [] };

    // Buscar vendas de afiliados desse tenant
    const affiliateIds = affiliates.map(a => a.id);
    const { data: trackings } = await supabase
        .from('referral_tracking')
        .select('affiliate_id, converted, commission_amt')
        .in('affiliate_id', affiliateIds)
        .eq('converted', true);

    const revenueMap: Record<string, number> = {};
    const conversionsMap: Record<string, number> = {};

    affiliateIds.forEach(id => {
        revenueMap[id] = 0;
        conversionsMap[id] = 0;
    });

    (trackings || []).forEach(t => {
        revenueMap[t.affiliate_id] += Number(t.commission_amt || 0);
        conversionsMap[t.affiliate_id] += 1;
    });

    const enriched = affiliates.map(a => ({
        ...a,
        conversions: conversionsMap[a.id],
        total_commission: revenueMap[a.id]
    }));

    return { affiliates: enriched };
}

export default async function StudioAffiliatesPage() {
    const data = await getStudioAffiliates();

    if (!data) return <div className="text-white p-8">Carregando...</div>;

    const { affiliates } = data;

    const totalAffiliates = affiliates.length;
    const totalConversions = affiliates.reduce((acc, curr) => acc + curr.conversions, 0);
    const totalOwed = affiliates.reduce((acc, curr) => acc + curr.total_commission, 0);

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Users size={28} className="text-secondary" />
                    Gestão de Afiliados
                </h1>
                <p className="text-[#888] font-mono text-xs uppercase tracking-widest">
                    Monitore vendas geradas por terceiros e comissões a pagar
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors group-hover:bg-primary/10"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-[#111] rounded-lg border border-[#222]">
                            <Users size={20} className="text-primary" />
                        </div>
                    </div>
                    <h3 className="text-[#888] font-mono uppercase tracking-widest text-[10px] mb-1 relative z-10">Total de Afiliados</h3>
                    <p className="text-3xl font-display font-bold text-white relative z-10">{totalAffiliates}</p>
                </div>

                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors group-hover:bg-secondary/10"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-[#111] rounded-lg border border-[#222]">
                            <TrendingUp size={20} className="text-secondary" />
                        </div>
                    </div>
                    <h3 className="text-[#888] font-mono uppercase tracking-widest text-[10px] mb-1 relative z-10">Vendas por Indicação</h3>
                    <p className="text-3xl font-display font-bold text-white relative z-10">{totalConversions}</p>
                </div>

                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors group-hover:bg-accent/10"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="p-2 bg-[#111] rounded-lg border border-[#222]">
                            <DollarSign size={20} className="text-accent" />
                        </div>
                    </div>
                    <h3 className="text-[#888] font-mono uppercase tracking-widest text-[10px] mb-1 relative z-10">Comissões a Pagar</h3>
                    <p className="text-3xl font-display font-bold text-white relative z-10">R$ {totalOwed.toFixed(2).replace('.', ',')}</p>
                </div>
            </div>

            {/* Lista */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#1a1a1a] bg-[#111]">
                    <h2 className="text-white font-mono uppercase tracking-widest text-xs">Afiliados Ativos</h2>
                </div>

                {affiliates.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <ShieldAlert size={32} className="text-[#333] mb-4" />
                        <p className="text-[#666] font-mono uppercase tracking-widest text-sm">Sua escola ainda não possui afiliados.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#1a1a1a] bg-[#050505]">
                                    <th className="p-4 text-[#666] font-mono text-[10px] uppercase tracking-widest font-normal">Afiliado</th>
                                    <th className="p-4 text-[#666] font-mono text-[10px] uppercase tracking-widest font-normal hidden md:table-cell">Código</th>
                                    <th className="p-4 text-[#666] font-mono text-[10px] uppercase tracking-widest font-normal text-center">Taxa (%)</th>
                                    <th className="p-4 text-[#666] font-mono text-[10px] uppercase tracking-widest font-normal text-center">Vendas</th>
                                    <th className="p-4 text-[#666] font-mono text-[10px] uppercase tracking-widest font-normal text-right">Comissão R$</th>
                                    <th className="p-4 text-[#666] font-mono text-[10px] uppercase tracking-widest font-normal text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1a1a1a]">
                                {affiliates.map(aff => (
                                    <tr key={aff.id} className="hover:bg-[#111] transition-colors">
                                        <td className="p-4">
                                            <p className="text-white text-sm font-medium">{(aff.users as any)?.full_name || 'Desconhecido'}</p>
                                            <p className="text-[#555] text-xs font-mono">{(aff.users as any)?.email}</p>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <code className="text-primary bg-primary/10 px-2 py-1 rounded text-xs font-mono">
                                                {aff.affiliate_code}
                                            </code>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-[#ccc] text-sm">{aff.commission_pct}%</span>
                                        </td>
                                        <td className="p-4 text-center text-white font-medium">{aff.conversions}</td>
                                        <td className="p-4 text-right text-secondary font-medium">
                                            R$ {aff.total_commission.toFixed(2).replace('.', ',')}
                                        </td>
                                        <td className="p-4 text-center">
                                            {aff.is_active ? (
                                                <span className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 text-[10px] font-mono uppercase tracking-widest">
                                                    <CheckCircle2 size={10} /> Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 text-[10px] font-mono uppercase tracking-widest">
                                                    Inativo
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
