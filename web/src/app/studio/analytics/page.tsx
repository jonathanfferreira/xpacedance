import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { TrendingUp, Users, BookOpen, Download, BarChart3, Star } from 'lucide-react';

async function getAnalyticsData() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('owner_id', user.id)
        .single();
    if (!tenant) return null;

    const { data: courses } = await supabase
        .from('courses')
        .select('id, title, is_published, created_at')
        .eq('tenant_id', tenant.id);

    const courseIds = (courses || []).map(c => c.id);

    if (courseIds.length === 0) {
        return { tenant, courses: [], completionRate: 0, topCourses: [], enrollmentsByDay: [], totalRevenue: 0, activeStudents: 0, topLessons: [] };
    }

    const [
        { data: progressData },
        { data: enrollments },
        { data: transactions },
        { data: topLessons },
    ] = await Promise.all([
        // Taxa de conclusão: aulas completadas / total de aulas assistidas
        supabase
            .from('progress')
            .select('completed, lesson_id, user_id')
            .in('lesson_id', courseIds.length > 0
                ? (await supabase.from('lessons').select('id').in('course_id', courseIds)).data?.map(l => l.id) || []
                : []),

        // Matrículas por dia (últimos 30 dias)
        supabase
            .from('enrollments')
            .select('created_at, course_id, status, users:user_id(full_name)')
            .in('course_id', courseIds)
            .eq('status', 'active')
            .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
            .order('created_at', { ascending: false })
            .limit(100),

        // Receita por curso
        supabase
            .from('transactions')
            .select('amount, course_id, status')
            .in('course_id', courseIds)
            .eq('status', 'confirmed'),

        // Top aulas mais assistidas
        supabase
            .from('progress')
            .select('lesson_id, lessons!lesson_id(title, course_id)')
            .in('lesson_id', courseIds.length > 0
                ? (await supabase.from('lessons').select('id').in('course_id', courseIds)).data?.map(l => l.id) || []
                : [])
            .limit(200),
    ]);

    const totalCompleted = (progressData || []).filter(p => p.completed).length;
    const totalWatched = (progressData || []).length;
    const completionRate = totalWatched > 0 ? Math.round((totalCompleted / totalWatched) * 100) : 0;

    const totalRevenue = (transactions || []).reduce((sum, t) => sum + Number(t.amount), 0);

    // Agrupa matrículas por dia
    const byDayMap: Record<string, number> = {};
    (enrollments || []).forEach(e => {
        const day = new Date(e.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        byDayMap[day] = (byDayMap[day] || 0) + 1;
    });
    const enrollmentsByDay = Object.entries(byDayMap)
        .map(([day, count]) => ({ day, count }))
        .slice(0, 10);

    // Receita por curso
    const revenuePerCourse: Record<string, number> = {};
    (transactions || []).forEach((t: any) => {
        revenuePerCourse[t.course_id] = (revenuePerCourse[t.course_id] || 0) + Number(t.amount);
    });

    const topCourses = (courses || [])
        .map(c => ({ ...c, revenue: revenuePerCourse[c.id] || 0 }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // Top aulas por views
    const lessonViewMap: Record<string, { title: string; views: number }> = {};
    (topLessons || []).forEach((p: any) => {
        const id = p.lesson_id;
        if (!lessonViewMap[id]) lessonViewMap[id] = { title: p.lessons?.title || id, views: 0 };
        lessonViewMap[id].views++;
    });
    const topLessonsList = Object.values(lessonViewMap).sort((a, b) => b.views - a.views).slice(0, 5);

    const uniqueStudents = new Set((progressData || []).map(p => p.user_id)).size;

    return {
        tenant,
        courses: courses || [],
        completionRate,
        topCourses,
        enrollmentsByDay,
        totalRevenue,
        activeStudents: Math.max(uniqueStudents, enrollments?.length || 0),
        topLessons: topLessonsList,
    };
}

export default async function StudioAnalyticsPage() {
    const data = await getAnalyticsData();

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64 text-[#555]">
                <p className="font-mono text-sm uppercase tracking-widest">Sessão inválida. Faça login novamente.</p>
            </div>
        );
    }

    const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const maxBarCount = Math.max(...(data.enrollmentsByDay.map(d => d.count)), 1);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-1">
                        Analytics
                    </h1>
                    <p className="text-[#888] font-mono text-xs uppercase tracking-widest">
                        Relatórios de engajamento e receita
                    </p>
                </div>
                {/* Export CSV */}
                <Link
                    href="/api/studio/export?format=csv"
                    className="flex items-center gap-2 border border-[#333] text-[#888] hover:text-white hover:border-white/30 transition-colors px-4 py-2 rounded text-xs font-mono uppercase tracking-widest"
                >
                    <Download size={14} />
                    Exportar CSV
                </Link>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Cursos Ativos', value: data.courses.filter(c => c.is_published).length, icon: BookOpen, suffix: '' },
                    { label: 'Alunos Ativos', value: data.activeStudents, icon: Users, suffix: '' },
                    { label: 'Taxa de Conclusão', value: data.completionRate, icon: TrendingUp, suffix: '%' },
                    { label: 'Receita Total', value: `R$ ${fmt(data.totalRevenue)}`, icon: BarChart3, suffix: '' },
                ].map((kpi) => (
                    <div key={kpi.label} className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded hover:border-[#333] transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <p className="text-[#666] text-xs font-mono uppercase tracking-widest">{kpi.label}</p>
                            <kpi.icon size={16} className="text-[#333]" />
                        </div>
                        <p className="text-white text-2xl font-bold font-mono">
                            {typeof kpi.value === 'number' ? `${kpi.value}${kpi.suffix}` : kpi.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Matrículas por dia (barras) */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-6">
                    <h2 className="text-white font-bold font-heading uppercase tracking-wide mb-6 text-sm">
                        Matrículas — Últimos 30 Dias
                    </h2>
                    {data.enrollmentsByDay.length === 0 ? (
                        <p className="text-[#555] text-sm text-center py-8">Nenhuma matrícula neste período.</p>
                    ) : (
                        <div className="flex items-end gap-2 h-40">
                            {data.enrollmentsByDay.map(({ day, count }) => (
                                <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                                    <span className="text-[#555] text-[10px] font-mono group-hover:text-white transition-colors">
                                        {count}
                                    </span>
                                    <div
                                        className="w-full bg-[#6324b2]/80 rounded-t transition-all duration-300 group-hover:bg-[#6324b2]"
                                        style={{ height: `${Math.max(4, (count / maxBarCount) * 120)}px` }}
                                    />
                                    <span className="text-[#444] text-[9px] font-mono rotate-45 origin-left mt-1 whitespace-nowrap">
                                        {day}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Cursos por Receita */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-6">
                    <h2 className="text-white font-bold font-heading uppercase tracking-wide mb-6 text-sm">
                        Top Cursos por Receita
                    </h2>
                    {data.topCourses.length === 0 ? (
                        <p className="text-[#555] text-sm text-center py-8">Nenhuma venda ainda.</p>
                    ) : (
                        <div className="space-y-3">
                            {data.topCourses.map((course, i) => {
                                const maxRevenue = data.topCourses[0]?.revenue || 1;
                                const pct = Math.round((course.revenue / maxRevenue) * 100);
                                return (
                                    <div key={course.id}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-white text-xs font-mono truncate max-w-[60%]">
                                                <span className="text-[#555] mr-2">#{i + 1}</span>
                                                {course.title}
                                            </span>
                                            <span className="text-[#6324b2] font-mono text-xs font-bold">
                                                R$ {fmt(course.revenue)}
                                            </span>
                                        </div>
                                        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#6324b2] rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Top Aulas mais assistidas */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded">
                <div className="p-6 border-b border-[#1a1a1a]">
                    <h2 className="text-white font-bold font-heading uppercase tracking-wide text-sm flex items-center gap-2">
                        <Star size={14} className="text-[#ffbd2e]" />
                        Aulas Mais Assistidas
                    </h2>
                </div>
                <div className="divide-y divide-[#1a1a1a]">
                    {data.topLessons.length === 0 ? (
                        <p className="text-[#555] text-sm text-center py-8">Sem dados de visualização ainda.</p>
                    ) : (
                        data.topLessons.map((lesson, i) => (
                            <div key={lesson.title} className="flex items-center justify-between px-6 py-4 hover:bg-[#111] transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="text-[#555] font-mono text-sm w-6">#{i + 1}</span>
                                    <span className="text-white text-sm">{lesson.title}</span>
                                </div>
                                <span className="text-[#888] font-mono text-xs">{lesson.views} views</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Link para Cursos */}
            <div className="border border-dashed border-[#222] rounded p-6 text-center">
                <p className="text-[#555] text-sm mb-4">Para detalhes por aluno ou aula, acesse o painel de cursos.</p>
                <Link
                    href="/studio/cursos"
                    className="inline-flex items-center gap-2 text-white border border-[#333] px-4 py-2 rounded text-xs font-mono uppercase tracking-widest hover:border-white/30 transition-colors"
                >
                    <BookOpen size={14} />
                    Ver Meus Cursos
                </Link>
            </div>
        </div>
    );
}
