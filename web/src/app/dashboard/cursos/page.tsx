import Link from 'next/link'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getCoursesData(userId: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Get user enrollments with course info
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
            course_id, status,
            courses:courses!course_id(id, title, thumbnail_url, tenant_id,
                tenants:tenants!tenant_id(name)
            )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) return [];

    // For each enrollment, calculate progress
    const courseIds = enrollments.map(e => e.course_id);
    const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, course_id')
        .in('course_id', courseIds);

    const { data: allProgress } = await supabase
        .from('progress')
        .select('lesson_id, completed')
        .eq('user_id', userId)
        .eq('completed', true);

    const completedSet = new Set((allProgress || []).map(p => p.lesson_id));

    return enrollments.map(e => {
        const course = (e as any).courses;
        const lessons = (allLessons || []).filter(l => l.course_id === e.course_id);
        const completed = lessons.filter(l => completedSet.has(l.id)).length;
        const total = lessons.length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
            id: course?.id || e.course_id,
            title: course?.title || 'Curso',
            teacher: (course as any)?.tenants?.name || 'Professor',
            thumbnail: course?.thumbnail_url || '/images/bg-degrade.png',
            progress,
            totalLessons: total,
            completedLessons: completed,
            status: progress === 100 ? 'completed' : 'active',
        };
    });
}

export default async function MeusAcessosPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    const courses = user ? await getCoursesData(user.id) : [];

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="mb-10">
                <h1 className="font-heading text-4xl mb-2 tracking-tight uppercase">
                    Meus <span className="text-transparent bg-clip-text text-gradient-neon">Acessos</span>
                </h1>
                <p className="text-[#888] font-sans">Cursos que você desbloqueou e pode estudar agora.</p>
            </div>

            {courses.length === 0 ? (
                <div className="border border-[#222] bg-[#0A0A0A] rounded-sm p-12 text-center">
                    <p className="text-[#666] mb-4 text-lg">Você ainda não está matriculado em nenhum curso.</p>
                    <p className="text-[#555] text-sm mb-6">Explore nosso catálogo e encontre o treino perfeito para o seu nível.</p>
                    <Link href="/" className="border border-white hover:bg-white hover:text-black transition-colors px-6 py-2 text-sm font-sans font-bold inline-flex items-center gap-2">
                        <Play size={16} /> EXPLORAR CATÁLOGO
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="bg-[#0A0A0A] border border-[#222] rounded-sm overflow-hidden group hover:border-primary/30 transition-colors">
                            <div className="relative h-40 bg-[#111] overflow-hidden">
                                <Image src={course.thumbnail} alt="" fill className="object-cover opacity-40 group-hover:opacity-60 transition-opacity" unoptimized />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center pl-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_20px_#6324b2]">
                                        <Play size={24} fill="currentColor" className="text-white" />
                                    </div>
                                </div>
                                {course.status === 'completed' && (
                                    <div className="absolute top-3 right-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-sans font-medium px-2 py-0.5 rounded">
                                        Concluído
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-heading text-lg text-white uppercase mb-1">{course.title}</h3>
                                <p className="text-xs font-sans text-[#666] mb-4">{course.teacher}</p>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-1.5 flex-1 bg-[#222] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${course.status === 'completed' ? 'bg-emerald-500' : 'bg-primary'}`}
                                            style={{ width: `${course.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-mono text-[#666]">{course.progress}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-sans text-[#555]">
                                        {course.completedLessons}/{course.totalLessons} aulas
                                    </span>
                                    <Link
                                        href={`/dashboard/aula/${course.id}`}
                                        className="text-xs font-sans font-medium text-primary hover:text-white transition-colors"
                                    >
                                        {course.status === 'completed' ? 'Rever' : 'Continuar'} →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
