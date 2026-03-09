import { createClient } from '@/utils/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Play, Flame, Shield, Star } from 'lucide-react';
import { SlideUp, ScaleIn, StaggerContainer, StaggerItem, FadeIn } from '@/components/MotionWrappers';
import type { Metadata } from 'next';

export const revalidate = 3600;

type PageProps = { params: Promise<{ courseId: string }> };

/** Busca dados do curso — reutilizado por generateMetadata e page */
async function getCourse(courseId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('courses')
        .select('*, tenants(name, logo_url, brand_color, banner_url), modules: course_modules(id, title, Lessons: lessons(id))')
        .eq('id', courseId)
        .single();
    if (error) return null;
    return data;
}

/** SEO dinâmico por curso */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { courseId } = await params;
    const course = await getCourse(courseId);
    if (!course) return { title: 'Curso não encontrado' };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xtage.app';
    const title = `${course.title} — ${course.tenants?.name || 'XTAGE'}`;
    const description = course.description ||
        `Aprenda com este curso exclusivo de ${course.tenants?.name || 'XTAGE'}. Acesso imediato, aulas em alta definição.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${siteUrl}/course/${courseId}`,
            type: 'website',
            images: course.thumbnail_url
                ? [{ url: course.thumbnail_url, width: 1280, height: 720, alt: course.title }]
                : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: course.thumbnail_url ? [course.thumbnail_url] : [],
        },
        alternates: { canonical: `${siteUrl}/course/${courseId}` },
    };
}

export default async function PublicCoursePage({ params }: PageProps) {
    const { courseId } = await params;
    const course = await getCourse(courseId);

    if (!course) return notFound();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xtage.app';

    // JSON-LD Schema.org Course
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.title,
        description: course.description || '',
        provider: {
            '@type': 'Organization',
            name: course.tenants?.name || 'XTAGE',
            url: siteUrl,
        },
        offers: {
            '@type': 'Offer',
            price: course.price,
            priceCurrency: 'BRL',
            availability: 'https://schema.org/InStock',
            url: `${siteUrl}/course/${course.id}`,
        },
        image: course.thumbnail_url || undefined,
        url: `${siteUrl}/course/${course.id}`,
    };

    // Calcula total de aulas
    let totalLessons = 0;
    if (course.modules) {
        (course.modules as any[]).forEach(m => {
            if (m.Lessons) totalLessons += m.Lessons.length;
        });
    }

    const priceFormatted = Number(course.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const brandColor = course.tenants?.brand_color || '#6324B2';

    return (
        <>
            {/* JSON-LD para SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div
                className="min-h-screen bg-[#050505] text-[#ededed] font-sans overflow-x-hidden selection:bg-white/30 selection:text-white"
                style={{ '--tenant-primary': brandColor } as React.CSSProperties}
            >
                {/* Header / Navbar */}
                <header className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <Link href="/" className="relative w-24 h-6 opacity-80 hover:opacity-100 transition-opacity">
                            <Image src="/images/xpace-on-branco.png" alt="XTAGE" fill className="object-contain object-left" />
                        </Link>
                        <Link href="/explore" className="text-xs font-semibold text-[#888] hover:text-white transition-colors uppercase tracking-widest">
                            &larr; Voltar ao Catálogo
                        </Link>
                    </div>
                </header>

                {/* Hero do Produto */}
                <section className="relative pt-24 pb-16 md:pt-32 md:pb-24">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-black/60 z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent z-10" />
                        {course.thumbnail_url ? (
                            <FadeIn delay={0.1} className="w-full h-full">
                                <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover opacity-30 object-top" />
                            </FadeIn>
                        ) : (
                            <div className="w-full h-full bg-[#111]" />
                        )}
                    </div>

                    <div className="relative z-20 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <SlideUp delay={0.1}>
                                <div className="flex items-center gap-3 mb-6">
                                    {course.tenants?.logo_url && (
                                        <Image src={course.tenants.logo_url} alt={course.tenants.name} width={24} height={24} className="rounded-full" />
                                    )}
                                    <span className="font-bold text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--tenant-primary)' }}>
                                        {course.tenants?.name || 'Apresenta'}
                                    </span>
                                    <span className="inline-block border border-white/10 text-[#888] bg-black/50 backdrop-blur-md px-3 py-1 text-xs rounded-full">
                                        {totalLessons} Aulas
                                    </span>
                                </div>
                            </SlideUp>

                            <SlideUp delay={0.2}>
                                <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight leading-tight uppercase">
                                    {course.title}
                                </h1>
                            </SlideUp>

                            <SlideUp delay={0.3}>
                                <p className="text-[#aaa] text-lg md:text-xl font-light mb-8 max-w-xl leading-relaxed">
                                    {course.description || "Liberte seu potencial com esta Masterclass exclusiva. Acesse todo o conteúdo, suba no ranking XP e treine com a mais alta definição da plataforma."}
                                </p>
                            </SlideUp>

                            <SlideUp delay={0.4}>
                                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                                    <Link
                                        href={`/checkout/${course.id}`}
                                        className="flex items-center justify-center gap-2 text-white px-8 py-4 rounded-sm font-bold uppercase tracking-widest text-sm transition-all group"
                                        style={{ backgroundColor: 'var(--tenant-primary)', boxShadow: `0 0 40px var(--tenant-primary)` }}
                                    >
                                        <Play size={18} className="fill-white" />
                                        Desbloquear Acesso
                                    </Link>
                                    <div className="flex items-center justify-center px-6 py-4 border border-white/10 rounded-sm bg-black/40 backdrop-blur-md">
                                        <span className="text-white font-mono text-xl">{priceFormatted}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 text-sm text-[#777]">
                                    <div className="flex items-center gap-2"><Flame size={16} className="text-secondary" /> Acesso Imediato</div>
                                    <div className="flex items-center gap-2"><Shield size={16} className="text-accent" /> Pagamento Seguro (Asaas)</div>
                                </div>
                            </SlideUp>
                        </div>

                        {/* Preview Trailer */}
                        <ScaleIn delay={0.3} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl group cursor-pointer lg:mt-0 mt-8">
                            {course.thumbnail_url ? (
                                <Image src={course.thumbnail_url} alt="Trailer" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full bg-[#1a1a1a]" />
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-primary/90 group-hover:border-primary transition-all duration-300 transform group-hover:scale-110">
                                    <Play size={32} className="text-white ml-2" />
                                </div>
                            </div>
                            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded border border-white/10 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-white text-xs font-bold uppercase tracking-wider">Trailer</span>
                            </div>
                        </ScaleIn>
                    </div>
                </section>

                {/* Módulos */}
                <section className="py-20 border-t border-white/5 bg-[#020202]">
                    <div className="max-w-4xl mx-auto px-6">
                        <SlideUp>
                            <div className="text-center mb-16">
                                <h2 className="text-3xl font-bold text-white uppercase tracking-widest mb-4">Conteúdo Liberado Após Assinatura</h2>
                                <p className="text-[#888]">Junte-se ao curso para destravar todas as masterclasses abaixo.</p>
                            </div>
                        </SlideUp>

                        <StaggerContainer delay={0.2} className="space-y-4">
                            {course.modules && (course.modules as any[]).length > 0 ? (
                                (course.modules as any[]).map((module: any, idx: number) => (
                                    <StaggerItem key={module.id} className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-lg flex items-center justify-between group hover:border-white/20 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-12 h-12 rounded bg-[#111] border border-[#222] flex items-center justify-center font-mono font-bold transition-colors"
                                                style={{ color: 'var(--tenant-primary)' }}
                                            >
                                                {String(idx + 1).padStart(2, '0')}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-lg uppercase">{module.title}</h3>
                                                <p className="text-[#666] text-sm flex items-center gap-2 mt-1">
                                                    <Play size={12} /> {module.Lessons ? module.Lessons.length : 0} aulas
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center bg-[#050505]">
                                            <Star size={14} className="text-[#444]" />
                                        </div>
                                    </StaggerItem>
                                ))
                            ) : (
                                <div className="text-center text-[#555] py-10 border border-[#1a1a1a] border-dashed rounded-lg">
                                    Módulos sendo preparados pelo instrutor.
                                </div>
                            )}
                        </StaggerContainer>

                        <SlideUp delay={0.4} className="mt-16 text-center">
                            <Link href={`/checkout/${course.id}`} className="inline-block px-10 py-5 bg-white text-black font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-[#ddd] transition-colors text-sm">
                                Garantir Minha Vaga Agora
                            </Link>
                        </SlideUp>
                    </div>
                </section>
            </div>
        </>
    );
}
