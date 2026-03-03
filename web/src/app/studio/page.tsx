import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Users, PlayCircle, TrendingUp, DollarSign } from 'lucide-react';

async function getStudioStats() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single();
    if (!tenant) return { students: 0, lessonsWatched: 0, publishedCourses: 0, revenue: 0, recentCourses: [], recentEnrollments: [] };

    const { data: courses } = await supabase
        .from('courses')
        .select('id, title, is_published, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

    const courseIds = (courses || []).map(c => c.id);

    if (courseIds.length === 0) {
        return { students: 0, lessonsWatched: 0, publishedCourses: 0, revenue: 0, recentCourses: [], recentEnrollments: [] };
    }

    const [
        { count: students },
        { count: publishedCourses },
        { data: txData },
        { data: recentEnrollments },
    ] = await Promise.all([
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('course_id', courseIds).eq('status', 'active'),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id).eq('is_published', true),
        supabase.from('transactions').select('amount').in('course_id', courseIds).eq('status', 'confirmed'),
        supabase.from('enrollments')
            .select('created_at, users:user_id(full_name), courses:course_id(title)')
            .in('course_id', courseIds)
            .order('created_at', { ascending: false })
            .limit(3),
    ]);

    const revenue = (txData || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    return {
        students: students || 0,
        publishedCourses: publishedCourses || 0,
        revenue,
        recentCourses: (courses || []).slice(0, 3),
        recentEnrollments: recentEnrollments || [],
    };
}

export default async function StudioDashboardPage() {
    const stats = await getStudioStats();
    const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    return (
        <div className="max-w-6xl mx-auto pb-10">
            <div className="mb-10">
                <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight mb-2">Visão Geral</h1>
                <p className="text-[#888] font-sans text-sm">Acompanhe as métricas de retenção e faturamento da sua escola.</p>
            </div>

            {!stats ? (
                <div className="text-center py-20 text-[#555]">Carregando...</div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                        <MetricCard title="Alunos Ativos" value={String(stats.students)} icon={<Users />} />
                        <MetricCard title="Cursos Publicados" value={String(stats.publishedCourses)} icon={<PlayCircle />} />
                        <MetricCard title="Receita Confirmada" value={fmt(stats.revenue)} icon={<DollarSign />} isMoney />
                        <MetricCard title="Crescimento" value={stats.students > 0 ? '+' + stats.students : '0'} icon={<TrendingUp />} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cursos */}
                        <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="font-heading font-bold uppercase text-white tracking-wide">Seus Cursos</h2>
                                <Link href="/studio/cursos" className="text-xs text-primary font-mono hover:text-white transition-colors">VER TODOS</Link>
                            </div>

                            {stats.recentCourses.length === 0 ? (
                                <div className="text-center py-8 text-[#555] text-sm">
                                    <p>Nenhum curso criado ainda.</p>
                                    <Link href="/studio/cursos/novo" className="text-primary hover:text-white text-xs mt-2 inline-block">+ Criar meu primeiro curso</Link>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {stats.recentCourses.map((c: any) => (
                                        <Link
                                            key={c.id}
                                            href={`/studio/cursos/${c.id}`}
                                            className="flex items-center gap-4 p-3 hover:bg-[#111] border border-transparent hover:border-[#222] transition-colors rounded"
                                        >
                                            <div className="w-16 h-10 bg-[#1a1a1a] rounded flex items-center justify-center shrink-0">
                                                <PlayCircle size={14} className="text-[#444]" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-white">{c.title}</h4>
                                                <p className="text-xs text-[#666]">
                                                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${c.is_published
                                                    ? 'text-green-400 border-green-400/30 bg-green-400/10'
                                                    : 'text-[#666] border-[#333] bg-[#111]'
                                                    }`}>
                                                    {c.is_published ? 'Publicado' : 'Rascunho'}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Matrículas recentes */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6">
                            <h2 className="font-heading font-bold uppercase text-white tracking-wide mb-6">Matrículas Recentes</h2>

                            {stats.recentEnrollments.length === 0 ? (
                                <div className="text-center py-8 text-[#555] text-sm">Nenhuma matrícula ainda.</div>
                            ) : (
                                <div className="flex flex-col gap-5 relative before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#222]">
                                    {stats.recentEnrollments.map((e: any, i: number) => (
                                        <div key={i} className="pl-6 relative">
                                            <div className="absolute left-0 top-1 w-3 h-3 rounded-full border-[3px] border-[#0a0a0a] bg-primary/60" />
                                            <p className="text-sm text-[#ddd] mb-1 leading-snug">
                                                {e.users?.full_name || 'Aluno'} matriculou em <strong>{e.courses?.title || 'curso'}</strong>
                                            </p>
                                            <span className="text-xs text-[#555] font-mono">
                                                {new Date(e.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function MetricCard({ title, value, icon, isMoney = false }: { title: string; value: string; icon: React.ReactNode; isMoney?: boolean }) {
    return (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-sm flex flex-col relative overflow-hidden group">
            <div className="text-[#888] mb-4 relative z-10 w-8 h-8 flex items-center justify-center bg-[#111] rounded border border-[#222]">
                {icon}
            </div>
            <div className="relative z-10">
                <p className="text-xs font-sans text-[#666] mb-1">{title}</p>
                <h3 className="text-2xl font-display font-medium text-white">{value}</h3>
            </div>
        </div>
    );
}
