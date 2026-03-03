import Image from "next/image";
import Link from "next/link";
import { Play, CheckCircle2, ChevronDown, Lock, FileText, Repeat } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Public data fetch - no auth needed
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
    params: Promise<{ slug: string }>;
}

async function getProfileData(slug: string) {
    // Find tenant by slug
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name, slug, bio, avatar_url, instagram, owner_id, brand_color, logo_url')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

    if (!tenant) return null;

    // Fetch published courses from this tenant
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title, description, price, pricing_type, thumbnail_url, min_price')
        .eq('tenant_id', tenant.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    // Fetch materials count per course
    const courseIds = (courses || []).map(c => c.id);
    const materialsMap: Record<string, number> = {};
    if (courseIds.length > 0) {
        const { data: materials } = await supabase
            .from('course_materials')
            .select('course_id')
            .in('course_id', courseIds);

        (materials || []).forEach(m => {
            materialsMap[m.course_id] = (materialsMap[m.course_id] || 0) + 1;
        });
    }

    // Fetch lessons count per course
    const lessonsMap: Record<string, number> = {};
    if (courseIds.length > 0) {
        const { data: lessons } = await supabase
            .from('lessons')
            .select('course_id')
            .in('course_id', courseIds);

        (lessons || []).forEach(l => {
            lessonsMap[l.course_id] = (lessonsMap[l.course_id] || 0) + 1;
        });
    }

    // Fetch active subscription plan for this tenant
    const { data: activePlan } = await supabase
        .from('subscription_plans')
        .select('id, name, price, cycle')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(1)
        .single();

    return {
        tenant,
        activePlan: activePlan || null,
        courses: (courses || []).map(c => ({
            ...c,
            materialsCount: materialsMap[c.id] || 0,
            lessonsCount: lessonsMap[c.id] || 0,
        })),
    };
}

export default async function ProfessorProfilePage({ params }: Props) {
    const { slug } = await params;
    const data = await getProfileData(slug);

    if (!data) {
        return (
            <div className="min-h-screen bg-[#050505] font-sans text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-heading uppercase mb-4">Página Não Encontrada</h1>
                    <p className="text-[#888] mb-6">Este perfil não existe ou não está ativo.</p>
                    <Link href="/" className="text-primary hover:text-white transition-colors">← Voltar ao Início</Link>
                </div>
            </div>
        );
    }

    const { tenant, courses, activePlan } = data;
    const brandColor = tenant.brand_color || "#6324b2"; // XPACE Purple fallback

    return (
        <div className="min-h-screen bg-[#050505] font-sans selection:bg-primary/30 text-white relative">
            {/* Background Cover */}
            <div
                className="absolute top-0 left-0 w-full h-[500px] z-0 opacity-20 pointer-events-none"
                style={{ background: `radial-gradient(circle at center top, ${brandColor}, transparent 70%)` }}
            ></div>

            <div className="max-w-4xl mx-auto px-6 py-20 relative z-10">

                {/* Header - Professor Identity */}
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-20 text-center md:text-left">
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-[#111] border-2 flex items-center justify-center shrink-0 shadow-[0_0_40px_rgba(99,36,178,0.3)] relative overflow-hidden" style={{ borderColor: brandColor }}>
                        {tenant.avatar_url ? (
                            <Image src={tenant.avatar_url} alt={tenant.name} fill className="object-cover" unoptimized />
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-[#222]"></div>
                                <span className="relative z-10 font-heading text-4xl text-[#444]">
                                    {tenant.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex-1 mt-2">
                        <div className="inline-flex items-center gap-2 border border-white/20 px-3 py-1 mb-4 text-[10px] font-mono tracking-widest uppercase bg-white/5 backdrop-blur-sm">
                            {tenant.logo_url && (
                                <Image src={tenant.logo_url} alt={tenant.name} width={16} height={16} className="rounded-sm object-contain" />
                            )}
                            {tenant.logo_url ? "ESCOLA PARCEIRA" : "CRIADOR XPACE"}
                        </div>
                        <h1 className="text-5xl md:text-6xl font-heading uppercase tracking-tight mb-4" style={{ color: brandColor, WebkitTextStroke: '1px white' }}>
                            {tenant.name}
                        </h1>
                        {tenant.bio && (
                            <p className="text-[#888] font-sans leading-relaxed text-lg max-w-2xl">
                                {tenant.bio}
                            </p>
                        )}
                        {tenant.instagram && (
                            <a href={`https://instagram.com/${tenant.instagram.replace('@', '')}`} target="_blank" rel="noopener" className="inline-block mt-4 text-sm text-primary hover:text-white transition-colors">
                                @{tenant.instagram.replace('@', '')}
                            </a>
                        )}
                    </div>
                </div>

                {/* Subscription CTA Banner */}
                {activePlan && (
                    <div
                        className="mb-10 border border-primary/40 bg-primary/5 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
                        style={{ boxShadow: '0 0 40px rgba(99,36,178,0.12)' }}
                    >
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-primary block mb-1">✦ Acesso Completo</span>
                            <h3 className="text-2xl font-heading uppercase text-white mb-1">{activePlan.name}</h3>
                            <p className="text-[#888] text-sm">Acesso ilimitado a todos os treinamentos desta escola.</p>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                            <div className="text-center md:text-right">
                                <span className="text-3xl font-display text-white">
                                    R$ {activePlan.price.toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-xs text-primary font-mono ml-1">/{activePlan.cycle === 'MONTHLY' ? 'mês' : 'ano'}</span>
                            </div>
                            <Link
                                href={`/checkout/subscribe/${activePlan.id}`}
                                className="bg-primary text-white font-bold px-8 py-3 text-sm uppercase tracking-wider hover:bg-white hover:text-black transition-colors border border-primary flex items-center gap-2 whitespace-nowrap"
                            >
                                <Repeat size={14} /> Assinar Todos os Cursos
                            </Link>
                        </div>
                    </div>
                )}

                {/* Products Showcase */}
                <div>
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-3xl font-display uppercase tracking-widest text-[#555]">Treinamentos</h2>
                        <div className="flex-1 h-[1px] bg-gradient-to-r from-[#222] to-transparent"></div>
                    </div>

                    {courses.length === 0 ? (
                        <div className="border border-[#222] bg-[#0a0a0a] p-12 text-center">
                            <p className="text-[#666]">Este criador ainda não publicou nenhum treinamento.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8">
                            {courses.map((course) => (
                                <div key={course.id} className="bg-[#0a0a0a] border border-[#222] flex flex-col group overflow-hidden">
                                    {/* Card Header */}
                                    <div className="flex flex-col md:flex-row border-b border-[#222]">
                                        <div className="w-full md:w-[320px] h-[200px] bg-[#111] relative overflow-hidden shrink-0">
                                            {course.thumbnail_url ? (
                                                <Image src={course.thumbnail_url} alt="" fill className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" unoptimized />
                                            ) : (
                                                <div className="absolute inset-0 bg-[url('/images/bg-degrade.png')] bg-cover opacity-30 contrast-125 sepia group-hover:scale-105 transition-transform duration-700"></div>
                                            )}
                                            <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white/50 z-20" />
                                        </div>

                                        <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-2">
                                                {course.pricing_type === 'subscription' ? (
                                                    <span className="bg-secondary/10 text-secondary border border-secondary/20 text-[10px] font-mono px-2 py-0.5 uppercase tracking-widest flex items-center gap-1">
                                                        <Repeat size={10} /> Assinatura
                                                    </span>
                                                ) : (
                                                    <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono px-2 py-0.5 uppercase tracking-widest">
                                                        Acesso Vitalício
                                                    </span>
                                                )}
                                                {course.materialsCount > 0 && (
                                                    <span className="bg-white/5 text-[#888] border border-white/10 text-[10px] font-mono px-2 py-0.5 uppercase tracking-widest flex items-center gap-1">
                                                        <FileText size={10} /> {course.materialsCount} materiais
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-3xl font-heading uppercase text-white mb-2">{course.title}</h3>
                                            <p className="text-[#888] text-sm mb-6 max-w-md line-clamp-2">{course.description}</p>

                                            <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div>
                                                    <span className="block text-2xl font-display text-white">
                                                        R$ {(course.price || 0).toFixed(2).replace('.', ',')}
                                                    </span>
                                                    {course.pricing_type === 'subscription' ? (
                                                        <span className="text-[10px] font-mono text-secondary uppercase tracking-widest">/mês</span>
                                                    ) : (
                                                        <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest">
                                                            até 12x de R$ {(course.price / 12).toFixed(2).replace('.', ',')}
                                                        </span>
                                                    )}
                                                </div>
                                                <Link
                                                    href={`/checkout/${course.id}`}
                                                    className="bg-white text-black font-bold px-8 py-3 text-sm uppercase tracking-wider hover:bg-primary hover:text-white transition-colors border border-transparent flex items-center gap-2"
                                                >
                                                    {course.pricing_type === 'subscription' ? 'Assinar Escola' : 'Garantir Vaga'} <CheckCircle2 size={16} />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lesson count footer */}
                                    {course.lessonsCount > 0 && (
                                        <div className="p-4 bg-[#050505] text-[#888] text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                                            <Lock size={12} /> {course.lessonsCount} aulas disponíveis
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
