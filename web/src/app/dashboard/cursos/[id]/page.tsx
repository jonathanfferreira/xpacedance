import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Link from "next/link";
import Image from "next/image";
import { Play, Clock, BookOpen, Users, Star, ShieldCheck, ArrowLeft, ShoppingCart, Lock } from "lucide-react";
import { CourseActionButtons, TrailerButton } from "@/components/course/course-action-buttons";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const courseId = resolvedParams.id;

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch course with tenant info
    const { data: course } = await supabase
        .from('courses')
        .select(`
            id, title, description, thumbnail_url, price, min_price, pricing_type, is_published, created_at,
            tenants(id, name, brand_color, logo_url)
        `)
        .eq('id', courseId)
        .single();

    if (!course) redirect('/dashboard/explore');

    // Fetch lessons count and modules
    const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, module_name, order_index, video_id')
        .eq('course_id', courseId)
        .order('order_index');

    // Check if user has enrollment
    const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id, status')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

    const hasAccess = !!enrollment;

    // Group lessons by module
    const modules: Record<string, typeof lessons> = {};
    (lessons || []).forEach((l: any) => {
        const mod = l.module_name || 'Módulo 01';
        if (!modules[mod]) modules[mod] = [];
        modules[mod]!.push(l);
    });

    const totalLessons = lessons?.length || 0;
    const tenant = Array.isArray((course as any).tenants) ? (course as any).tenants[0] : (course as any).tenants;
    const brandColor = tenant?.brand_color || '#6324b2';

    // First lesson for trailer / start
    const firstLesson = lessons?.[0];

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Back Navigation */}
            <Link
                href="/dashboard/explore"
                className="inline-flex items-center gap-2 text-[#666] hover:text-white text-sm font-sans transition-colors"
            >
                <ArrowLeft size={16} /> Voltar ao Catálogo
            </Link>

            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden border border-[#222] bg-[#0A0A0A]">
                {/* Thumbnail / Trailer Area */}
                <div className="relative aspect-video md:aspect-[21/9] bg-[#050505] flex items-center justify-center overflow-hidden">
                    {course.thumbnail_url ? (
                        <Image
                            src={course.thumbnail_url}
                            alt={course.title}
                            fill
                            className="object-cover opacity-60"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#111] to-[#050505]"></div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent"></div>

                    {/* Play Trailer Button */}
                    {firstLesson?.video_id && (
                        <TrailerButton
                            hasAccess={hasAccess}
                            firstLessonId={firstLesson.id}
                            brandColor={brandColor}
                        />
                    )}

                    {/* Course Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
                        <div className="flex items-center gap-3 mb-3">
                            {tenant?.logo_url && (
                                <Image src={tenant.logo_url} alt="" width={24} height={24} className="rounded-full" />
                            )}
                            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: brandColor }}>
                                {tenant?.name || 'XPACE DANCE'}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-display font-bold uppercase tracking-tight text-white mb-2">
                            {course.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6">
                        <h2 className="font-heading text-lg uppercase tracking-widest text-white mb-4">Sobre o Curso</h2>
                        <p className="text-[#888] font-sans text-sm leading-relaxed whitespace-pre-wrap">
                            {course.description || 'Sem descrição disponível.'}
                        </p>
                    </div>

                    {/* Stats Pills */}
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5">
                            <BookOpen size={16} className="text-primary" />
                            <span className="text-white text-sm font-sans">{totalLessons} Aulas</span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5">
                            <ShieldCheck size={16} className="text-green-500" />
                            <span className="text-white text-sm font-sans">Certificado Digital</span>
                        </div>
                        <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#222] rounded-lg px-4 py-2.5">
                            <Star size={16} className="text-yellow-500" />
                            <span className="text-white text-sm font-sans">XP por Aula</span>
                        </div>
                    </div>

                    {/* Module List */}
                    <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 space-y-4">
                        <h2 className="font-heading text-lg uppercase tracking-widest text-white mb-2">
                            Conteúdo Programático
                        </h2>

                        {Object.entries(modules).length === 0 ? (
                            <p className="text-[#555] text-sm font-sans text-center py-8">
                                O criador ainda não publicou aulas neste curso.
                            </p>
                        ) : (
                            Object.entries(modules).map(([moduleName, moduleLessons], modIdx) => (
                                <div key={moduleName} className="border border-[#1a1a1a] rounded-lg overflow-hidden">
                                    <div className="bg-[#080808] px-4 py-3 flex items-center justify-between">
                                        <span className="font-heading text-sm uppercase tracking-wider text-white">
                                            {moduleName}
                                        </span>
                                        <span className="text-[10px] font-mono text-[#555]">
                                            {moduleLessons?.length || 0} aulas
                                        </span>
                                    </div>
                                    <div className="divide-y divide-[#111]">
                                        {(moduleLessons || []).map((lesson: any, lesIdx: number) => (
                                            <div key={lesson.id} className="px-4 py-3 flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-mono text-[#444] w-5">
                                                        {String(lesIdx + 1).padStart(2, '0')}
                                                    </span>
                                                    <span className="text-sm font-sans text-[#ccc]">
                                                        {lesson.title}
                                                    </span>
                                                </div>
                                                {hasAccess ? (
                                                    <Link
                                                        href={`/dashboard/aula/${lesson.id}`}
                                                        className="text-primary text-xs font-mono hover:underline"
                                                    >
                                                        Assistir →
                                                    </Link>
                                                ) : (
                                                    <Lock size={14} className="text-[#333]" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Purchase Card (Sticky) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-[#0A0A0A] border border-[#222] rounded-xl p-6 space-y-5">
                        {/* Price */}
                        <div className="text-center">
                            {course.pricing_type === 'free' ? (
                                <p className="text-3xl font-display font-bold text-green-500">GRÁTIS</p>
                            ) : (
                                <>
                                    <p className="text-3xl font-display font-bold text-white">
                                        R$ {Number(course.price || course.min_price || 0).toFixed(2).replace('.', ',')}
                                    </p>
                                    <p className="text-[10px] font-mono text-[#555] uppercase tracking-widest mt-1">
                                        {course.pricing_type === 'subscription' ? 'Assinatura Mensal' : 'Pagamento Único'}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* CTA Button */}
                        <CourseActionButtons
                            courseId={courseId}
                            hasAccess={hasAccess}
                            firstLessonId={firstLesson?.id || null}
                            pricingType={course.pricing_type}
                            brandColor={brandColor}
                        />

                        {/* Benefits */}
                        <div className="space-y-3 pt-4 border-t border-[#1a1a1a]">
                            <div className="flex items-center gap-3 text-[#888] text-xs font-sans">
                                <ShieldCheck size={14} className="text-green-500 shrink-0" />
                                Acesso vitalício ao conteúdo
                            </div>
                            <div className="flex items-center gap-3 text-[#888] text-xs font-sans">
                                <BookOpen size={14} className="text-primary shrink-0" />
                                {totalLessons} aulas em {Object.keys(modules).length} módulo(s)
                            </div>
                            <div className="flex items-center gap-3 text-[#888] text-xs font-sans">
                                <Star size={14} className="text-yellow-500 shrink-0" />
                                Certificado + XP ao concluir
                            </div>
                        </div>

                        {/* School Badge */}
                        <div className="flex items-center gap-3 bg-[#080808] border border-[#1a1a1a] rounded-lg px-4 py-3 mt-4">
                            {tenant?.logo_url ? (
                                <Image src={tenant.logo_url} alt="" width={32} height={32} className="rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: brandColor }}>
                                    {(tenant?.name || 'X').charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="text-white text-sm font-sans font-bold">{tenant?.name || 'XPACE DANCE'}</p>
                                <p className="text-[10px] font-mono text-[#555] uppercase tracking-widest">Escola Parceira</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
