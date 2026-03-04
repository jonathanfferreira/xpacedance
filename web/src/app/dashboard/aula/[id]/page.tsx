import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { VideoPlayer } from "@/components/player/video-player";
import { LessonSidebar } from "@/components/player/lesson-sidebar";
import { LessonComments } from "@/components/dashboard/lesson-comments";
import { LessonActions } from "@/components/player/lesson-actions";
import { LessonTour } from "@/components/pwa/lesson-tour";
import { generateBunnyTokenizedUrl } from "@/utils/bunny/token";
import type { Module } from "@/lib/mock-data";

export default async function AulaPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const lessonId = resolvedParams.id;

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch the current lesson (includes course_id and video_id)
    const { data: lesson } = await supabase
        .from('lessons')
        .select('id, title, description, module_name, video_id, course_id, order_index, likes_count')
        .eq('id', lessonId)
        .single();

    if (!lesson) redirect('/dashboard/cursos');

    // Gera o token Server-Side (com validade de 6h e blindado por HMAC SHA256)
    const secureTokenUrl = lesson.video_id ? generateBunnyTokenizedUrl(lesson.video_id) : undefined;

    // Fetch all lessons of this course + user progress + course title in parallel
    const [{ data: allLessons }, { data: userProgress }, { data: courseData }, { data: userLike }, { data: watchData }] = await Promise.all([
        supabase
            .from('lessons')
            .select('id, title, module_name, order_index')
            .eq('course_id', lesson.course_id)
            .order('order_index'),
        supabase
            .from('progress')
            .select('lesson_id, completed')
            .eq('user_id', user.id),
        supabase
            .from('courses')
            .select('title, is_linear_progression')
            .eq('id', lesson.course_id)
            .single(),
        supabase
            .from('lesson_likes')
            .select('id')
            .eq('lesson_id', lessonId)
            .eq('user_id', user.id)
            .maybeSingle(),
        supabase
            .from('lesson_views')
            .select('watch_position_seconds')
            .eq('lesson_id', lessonId)
            .eq('user_id', user.id)
            .maybeSingle(),
    ]);

    // Build completed set from user progress
    const completedSet = new Set(
        (userProgress || []).filter(p => p.completed).map(p => p.lesson_id)
    );

    // Group lessons by module_name and map to sidebar format
    const moduleMap = new Map<string, { id: string; title: string; lessons: any[] }>();
    for (const l of allLessons || []) {
        if (!moduleMap.has(l.module_name)) {
            moduleMap.set(l.module_name, {
                id: l.module_name,
                title: l.module_name,
                lessons: [],
            });
        }
        moduleMap.get(l.module_name)!.lessons.push({
            id: l.id,
            title: l.title,
            duration: '',
            isCompleted: completedSet.has(l.id),
            isActive: l.id === lessonId,
        });
    }

    const modules: Module[] = Array.from(moduleMap.values());

    return (
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] -mx-6 lg:-mx-10 -my-6 lg:-my-10 bg-black overflow-y-auto overflow-x-hidden md:overflow-hidden relative">
            <LessonTour />

            {/* Background Ambience */}
            <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-[180px] pointer-events-none"></div>

            {/* Esquerda: Player e Comunidade */}
            <div className="flex-1 flex flex-col pt-0 md:pt-4 px-0 md:px-6 relative z-10 overflow-y-auto no-scrollbar h-auto md:h-[calc(100vh-64px)]">

                {/* Container do Vídeo */}
                <div className="w-full max-w-5xl mx-auto shadow-2xl rounded-sm overflow-hidden ring-1 ring-[#222] shrink-0 relative lesson-step-1" style={{ aspectRatio: '16/9', minHeight: '30vh' }}>
                    <VideoPlayer
                        videoId={lesson.video_id ?? undefined}
                        tokenizedUrl={secureTokenUrl}
                        userEmail={user.email}
                        lessonId={lessonId}
                        initialPosition={watchData?.watch_position_seconds || 0}
                    />
                </div>

                {/* Metadados da Aula e Interações Base */}
                <div className="w-full max-w-5xl mx-auto mt-6 px-4 md:px-0 mb-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="font-mono text-xs uppercase tracking-widest text-primary border border-primary/20 bg-primary/5 px-2 py-0.5">
                                    {lesson.module_name}
                                </span>
                            </div>
                            <h1 className="text-3xl font-heading font-bold uppercase tracking-tight text-white mb-3">
                                {lesson.title}
                            </h1>
                            {lesson.description && (
                                <p className="text-[#888] font-sans text-sm leading-relaxed max-w-3xl">
                                    {lesson.description}
                                </p>
                            )}
                        </div>

                        {/* Ações Sociais / Relatórios */}
                        <LessonActions
                            lessonId={lessonId}
                            initialLikes={lesson.likes_count || 0}
                            initialIsLiked={!!userLike} // Uses actual data from DB
                        />
                    </div>

                    <div className="mt-4 border-t border-[#1a1a1a] lesson-step-3">
                        <LessonComments lessonId={lessonId} />
                    </div>
                </div>
            </div>

            {/* Direita: Sidebar (Módulos e Aulas) */}
            <div className="lesson-step-2 flex shrink-0">
                <LessonSidebar
                    courseTitle={courseData?.title || ''}
                    modules={modules}
                    isLinearProgression={courseData?.is_linear_progression || false}
                />
            </div>
        </div>
    );
}
