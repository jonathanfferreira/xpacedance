import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Users, TrendingUp, Award, BookOpen } from 'lucide-react';

async function getStudentProgress() {
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
        .select('id')
        .eq('owner_id', user.id)
        .single();
    if (!tenant) return null;

    // Todos os cursos do tenant
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('tenant_id', tenant.id);
    const courseIds = (courses || []).map(c => c.id);

    if (courseIds.length === 0) return { students: [], courses: [], stats: { total: 0, avgCompletion: 0, certs: 0 } };

    // Matrículas ativas com progresso
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('user_id, course_id, created_at, users!user_id(full_name, email, xp), courses!course_id(title)')
        .in('course_id', courseIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

    // Certificados emitidos para alunos deste tenant
    const { data: certs } = await supabase
        .from('certificates')
        .select('user_id, course_id, issued_at')
        .eq('tenant_id', tenant.id);
    const certSet = new Set((certs || []).map(c => `${c.user_id}__${c.course_id}`));

    // Progresso por user+course
    const { data: progressData } = await supabase
        .from('progress')
        .select('user_id, lesson_id, completed')
        .in('lesson_id',
            courseIds.length > 0
                ? (await supabase.from('lessons').select('id').in('course_id', courseIds)).data?.map(l => l.id) || []
                : []
        );

    // Mapa: courseId → totalLessons
    const { data: lessonCounts } = await supabase
        .from('lessons')
        .select('id, course_modules!module_id(course_id)')
        .in('course_id', courseIds);

    const lessonsByCourse: Record<string, number> = {};
    (lessonCounts || []).forEach((l: any) => {
        const cid = l.course_modules?.course_id;
        if (cid) lessonsByCourse[cid] = (lessonsByCourse[cid] || 0) + 1;
    });

    // Mapa de progresso: userId__courseId → { completed, total }
    const progressMap: Record<string, { completed: number; total: number }> = {};
    (progressData || []).forEach((p: any) => {
        // Precisaria de join com lessons, mas usamos o lessonsByCourse por course
        // Guardamos apenas completados por user
        const key = p.user_id;
        if (!progressMap[key]) progressMap[key] = { completed: 0, total: 0 };
        progressMap[key].total++;
        if (p.completed) progressMap[key].completed++;
    });

    // Agrega alunos únicos
    const studentMap: Record<string, any> = {};
    (enrollments || []).forEach((e: any) => {
        const uid = e.user_id;
        if (!studentMap[uid]) {
            studentMap[uid] = {
                id: uid,
                name: e.users?.full_name || 'Sem nome',
                email: e.users?.email || '—',
                xp: e.users?.xp || 0,
                courses: [],
                hasCert: false,
            };
        }
        const prog = progressMap[uid] || { completed: 0, total: 0 };
        const pct = prog.total > 0 ? Math.round((prog.completed / prog.total) * 100) : 0;
        const hasCert = certSet.has(`${uid}__${e.course_id}`);
        if (hasCert) studentMap[uid].hasCert = true;
        studentMap[uid].courses.push({
            id: e.course_id,
            title: e.courses?.title || '—',
            enrolledAt: e.created_at,
            progress: pct,
            hasCert,
        });
    });

    const students = Object.values(studentMap);
    const avgCompletion = students.length > 0
        ? Math.round(students.reduce((sum, s) => {
            const avg = s.courses.reduce((a: number, c: any) => a + c.progress, 0) / s.courses.length;
            return sum + avg;
        }, 0) / students.length)
        : 0;

    return {
        students,
        courses: courses || [],
        stats: {
            total: students.length,
            avgCompletion,
            certs: (certs || []).length,
        },
    };
}

export default async function StudentProgressPage() {
    const data = await getStudentProgress();

    if (!data) {
        return (
            <div className="flex items-center justify-center h-64 text-[#555]">
                <p className="font-mono text-sm uppercase tracking-widest">Sessão inválida.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-1">
                    Progresso dos Alunos
                </h1>
                <p className="text-[#888] font-mono text-xs uppercase tracking-widest">
                    Matrículas e engajamento por aluno
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Alunos Ativos', value: data.stats.total, icon: Users },
                    { label: 'Conclusão Média', value: `${data.stats.avgCompletion}%`, icon: TrendingUp },
                    { label: 'Certificados Emitidos', value: data.stats.certs, icon: Award },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded hover:border-[#333] transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <p className="text-[#666] text-xs font-mono uppercase tracking-widest">{kpi.label}</p>
                            <kpi.icon size={16} className="text-[#333]" />
                        </div>
                        <p className="text-white text-2xl font-bold font-mono">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabela de alunos */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded">
                <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
                    <h2 className="text-white font-bold font-heading uppercase tracking-wide text-sm flex items-center gap-2">
                        <Users size={14} />
                        Lista de Alunos ({data.students.length})
                    </h2>
                </div>

                {data.students.length === 0 ? (
                    <div className="text-center py-16">
                        <BookOpen size={32} className="text-[#333] mx-auto mb-4" />
                        <p className="text-[#555] text-sm font-mono uppercase tracking-widest">Nenhum aluno matriculado ainda.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#111] text-[#666] text-xs uppercase font-mono tracking-widest">
                                    <th className="p-4 font-normal">Aluno</th>
                                    <th className="p-4 font-normal">Cursos</th>
                                    <th className="p-4 font-normal">Progresso</th>
                                    <th className="p-4 font-normal">XP</th>
                                    <th className="p-4 font-normal text-center">Cert.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#111]">
                                {(data.students as any[]).map(student => {
                                    const avgPct = student.courses.length > 0
                                        ? Math.round(student.courses.reduce((s: number, c: any) => s + c.progress, 0) / student.courses.length)
                                        : 0;
                                    return (
                                        <tr key={student.id} className="hover:bg-[#111] transition-colors">
                                            <td className="p-4">
                                                <p className="text-white text-sm font-medium">{student.name}</p>
                                                <p className="text-[#666] text-xs font-mono">{student.email}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    {student.courses.slice(0, 2).map((c: any) => (
                                                        <p key={c.id} className="text-[#888] text-xs truncate max-w-[180px]">{c.title}</p>
                                                    ))}
                                                    {student.courses.length > 2 && (
                                                        <p className="text-[#555] text-[10px] font-mono">+{student.courses.length - 2} mais</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden min-w-[80px]">
                                                        <div
                                                            className="h-full bg-[#6324b2] rounded-full"
                                                            style={{ width: `${avgPct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-white text-xs font-mono w-8 text-right">{avgPct}%</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-[#ffbd2e] font-mono text-sm">{student.xp} XP</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {student.hasCert ? (
                                                    <Award size={16} className="text-[#6324b2] mx-auto" />
                                                ) : (
                                                    <span className="text-[#333] text-xs font-mono">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
