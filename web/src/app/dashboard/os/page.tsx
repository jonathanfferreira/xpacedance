'use client'

import { DollarSign, Users, BookOpen, TrendingUp, BarChart3, ArrowUpRight, Loader2, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Transaction {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    users: { full_name: string | null; email: string } | null;
    courses: { title: string } | null;
}

interface OSStats {
    totalRevenue: number;
    activeStudents: number;
    publishedCourses: number;
    monthlySales: { month: string; total: number }[];
    recentSales: Transaction[];
}

export default function XpaceOSPage() {
    const [stats, setStats] = useState<OSStats | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const loadStats = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            // Get tenant
            const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single();
            if (!tenant) { setStats({ totalRevenue: 0, activeStudents: 0, publishedCourses: 0, monthlySales: [], recentSales: [] }); setLoading(false); return; }

            // Get courses
            const { data: courses } = await supabase.from('courses').select('id').eq('tenant_id', tenant.id);
            const courseIds = (courses || []).map((c: any) => c.id);

            if (courseIds.length === 0) {
                setStats({ totalRevenue: 0, activeStudents: 0, publishedCourses: 0, monthlySales: [], recentSales: [] });
                setLoading(false);
                return;
            }

            const [
                { count: activeStudents },
                { count: publishedCourses },
                { data: transactions },
            ] = await Promise.all([
                supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('course_id', courseIds).eq('status', 'active'),
                supabase.from('courses').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('is_published', true),
                supabase.from('transactions')
                    .select('id, amount, status, created_at, users:user_id(full_name, email), courses:course_id(title)')
                    .in('course_id', courseIds)
                    .eq('status', 'confirmed')
                    .order('created_at', { ascending: false })
                    .limit(100),
            ]);

            const txList: Transaction[] = (transactions || []) as any[];
            const totalRevenue = txList.reduce((sum, t) => sum + Number(t.amount), 0);

            // Aggregate monthly (last 6 months)
            const monthMap: Record<string, number> = {};
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                monthMap[key] = 0;
            }
            txList.forEach(t => {
                const d = new Date(t.created_at);
                const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
                if (key in monthMap) monthMap[key] += Number(t.amount);
            });
            const monthlySales = Object.entries(monthMap).map(([month, total]) => ({ month, total }));

            setStats({
                totalRevenue,
                activeStudents: activeStudents || 0,
                publishedCourses: publishedCourses || 0,
                monthlySales,
                recentSales: txList.slice(0, 5),
            });
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadStats(); }, []);

    const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const maxSale = stats ? Math.max(...stats.monthlySales.map(s => s.total), 1) : 1;

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="font-heading text-4xl mb-2 tracking-tight uppercase">
                        XTAGE <span className="text-transparent bg-clip-text text-gradient-neon">OS</span>
                    </h1>
                    <p className="text-[#888] font-sans">Painel administrativo do criador de conteúdo.</p>
                </div>
                <button
                    onClick={loadStats}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 border border-[#222] bg-[#111] text-[#888] rounded text-sm font-mono hover:text-white hover:border-[#333] transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-[#555]">
                    <Loader2 size={24} className="animate-spin mr-3" /> Carregando dados reais...
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                        <KPICard icon={<DollarSign size={20} />} label="Receita Confirmada" value={`R$ ${fmt(stats?.totalRevenue || 0)}`} color="text-emerald-400" borderColor="border-emerald-500/20" />
                        <KPICard icon={<Users size={20} />} label="Alunos Ativos" value={String(stats?.activeStudents || 0)} color="text-primary" borderColor="border-primary/20" />
                        <KPICard icon={<BookOpen size={20} />} label="Cursos Publicados" value={String(stats?.publishedCourses || 0)} color="text-secondary" borderColor="border-secondary/20" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Revenue Chart */}
                        <div className="lg:col-span-3 bg-[#0A0A0A] border border-[#222] rounded-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={18} className="text-primary" />
                                    <h2 className="font-heading text-lg uppercase tracking-widest text-white">Vendas</h2>
                                </div>
                                <span className="text-xs font-sans text-[#666]">Últimos 6 meses (confirmadas)</span>
                            </div>

                            {stats?.monthlySales.every(s => s.total === 0) ? (
                                <div className="h-48 flex items-center justify-center text-[#555] text-sm">
                                    Nenhuma venda confirmada no período.
                                </div>
                            ) : (
                                <div className="flex items-end gap-3 h-48">
                                    {stats?.monthlySales.map((sale) => (
                                        <div key={sale.month} className="flex-1 flex flex-col items-center gap-2">
                                            <span className="text-[10px] font-sans text-[#666]">
                                                {sale.total > 0 ? `R$${(sale.total / 1000).toFixed(1)}k` : '—'}
                                            </span>
                                            <div
                                                className="w-full bg-gradient-to-t from-primary/80 to-secondary/60 rounded-t-sm transition-all duration-500 hover:from-primary hover:to-secondary"
                                                style={{ height: `${Math.max((sale.total / maxSale) * 100, sale.total > 0 ? 4 : 0)}%` }}
                                            />
                                            <span className="text-[10px] font-sans text-[#555] uppercase tracking-widest">{sale.month}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Sales */}
                        <div className="lg:col-span-2 bg-[#0A0A0A] border border-[#222] rounded-sm p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <ArrowUpRight size={18} className="text-emerald-400" />
                                <h2 className="font-heading text-lg uppercase tracking-widest text-white">Recentes</h2>
                            </div>

                            {!stats?.recentSales.length ? (
                                <p className="text-[#555] text-sm text-center py-8">Nenhuma venda confirmada ainda.</p>
                            ) : (
                                <div className="space-y-4">
                                    {stats.recentSales.map((sale) => (
                                        <div key={sale.id} className="flex items-center justify-between py-2 border-b border-[#151515] last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                    <span className="text-xs font-sans font-bold text-primary">
                                                        {((sale.users?.full_name || sale.users?.email || '?').charAt(0)).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-sans text-white">{sale.users?.full_name || 'Aluno'}</p>
                                                    <p className="text-[10px] font-sans text-[#555]">{sale.courses?.title || '—'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-sans font-bold text-emerald-400">+R$ {fmt(Number(sale.amount))}</p>
                                                <p className="text-[10px] font-sans text-[#555]">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

function KPICard({ icon, label, value, color, borderColor }: {
    icon: React.ReactNode; label: string; value: string; color: string; borderColor: string
}) {
    return (
        <div className={`bg-[#0A0A0A] border ${borderColor} rounded-sm p-5 relative overflow-hidden group hover:border-[#333] transition-colors`}>
            <div className="flex items-center justify-between mb-3">
                <span className={color}>{icon}</span>
            </div>
            <p className="font-display text-3xl text-white mb-1">{value}</p>
            <p className="text-[10px] font-sans text-[#555] uppercase tracking-widest">{label}</p>
        </div>
    )
}
