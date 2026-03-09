import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Flame, Star, BookOpen, Calendar, ArrowUpRight, Play, CheckCircle2, Lock, FileText, Repeat } from 'lucide-react';
import { FollowButton } from '@/components/community/follow-button';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- GET CURRENT USER + FOLLOW STATE ---

async function getCurrentUserAndFollow(targetUserId: string) {
    const cookieStore = await cookies();
    const supabaseUser = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user || user.id === targetUserId) return { currentUserId: null, isFollowing: false };

    const { data } = await supabaseAdmin
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

    return { currentUserId: user.id, isFollowing: !!data };
}

// --- ALUNO PROFILE LOGIC ---

async function getStudentProfile(username: string) {
    const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, username, full_name, avatar_url, bio, created_at, is_profile_public')
        .eq('username', username)
        .maybeSingle();

    if (!user || !user.is_profile_public) return null;

    const { data: xpData } = await supabaseAdmin
        .from('progress')
        .select('xp_awarded')
        .eq('user_id', user.id);

    const totalXp = (xpData || []).reduce((sum, r) => sum + (r.xp_awarded || 0), 0);

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
    const achievementsCount = authUser?.user?.user_metadata?.achievements_claimed?.length || 0;

    const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select(`
            courses(id, title, thumbnail_url,
                tenants(name, slug)
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(6);

    return {
        ...user,
        totalXp,
        achievementsCount: achievementsCount || 0,
        enrollments: enrollments || [],
    };
}

// --- TENANT (ESCOLA) PROFILE LOGIC ---

async function getTenantProfile(slug: string) {
    const { data: tenant } = await supabaseAnon
        .from('tenants')
        .select('id, name, slug, bio, avatar_url, instagram, owner_id, brand_color, logo_url')
        .eq('slug', slug)
        .single();

    if (!tenant) return null;

    const { data: courses } = await supabaseAnon
        .from('courses')
        .select('id, title, description, price, pricing_type, thumbnail_url, min_price')
        .eq('tenant_id', tenant.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    // Fetch materials count per course
    const courseIds = (courses || []).map(c => c.id);
    const materialsMap: Record<string, number> = {};
    if (courseIds.length > 0) {
        const { data: materials } = await supabaseAnon
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
        const { data: lessons } = await supabaseAnon
            .from('lessons')
            .select('course_id')
            .in('course_id', courseIds);

        (lessons || []).forEach(l => {
            lessonsMap[l.course_id] = (lessonsMap[l.course_id] || 0) + 1;
        });
    }

    const { data: activePlan } = await supabaseAnon
        .from('subscription_plans')
        .select('id, name, price, billing_cycle')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(1)
        .maybeSingle(); // Better than .single() if it might not exist

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

// --- METADATA ---

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    if (decodedSlug.startsWith('@')) {
        const username = decodedSlug.replace(/^@/, '');
        const profile = await getStudentProfile(username);
        if (!profile) return { title: 'Perfil não encontrado | XTAGE' };

        return {
            title: `@${profile.username} | XTAGE`,
            description: profile.bio || `Conheça o perfil de ${profile.full_name} na XTAGE — plataforma de dança urbana.`,
            openGraph: {
                title: `@${profile.username} | XTAGE`,
                description: profile.bio || `${profile.full_name} está evoluindo na XTAGE.`,
                images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
            },
        };
    } else {
        const data = await getTenantProfile(decodedSlug);
        if (!data) return { title: 'Escola não encontrada | XTAGE' };

        return {
            title: `${data.tenant.name} | XTAGE`,
            description: data.tenant.bio || `Conheça os treinamentos de ${data.tenant.name} na XTAGE.`,
        };
    }
}

// --- PAGE RENDERER ---

export default async function GenericProfilePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    // 1. RENDER STUDENT PROFILE (@username)
    if (decodedSlug.startsWith('@')) {
        const username = decodedSlug.replace(/^@/, '');
        const profile = await getStudentProfile(username);

        if (!profile) notFound();

        const joinedDate = new Date(profile.created_at).toLocaleDateString('pt-BR', {
            month: 'long', year: 'numeric'
        });

        return (
            <div className="min-h-screen bg-[#020202] text-white">
                <header className="border-b border-[#111] bg-[#080808]/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                        <Link href="/explore" className="flex items-center gap-2">
                            <Image src="/images/xpace-logo-branca.png" alt="XTAGE" width={80} height={22} className="object-contain" />
                        </Link>
                        <Link
                            href="/login"
                            className="text-xs font-mono uppercase tracking-widest text-[#666] hover:text-white transition-colors border border-[#222] hover:border-[#444] px-3 py-1.5 rounded"
                        >
                            Entrar
                        </Link>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-12">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-12">
                        <div className="relative shrink-0">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/40 bg-[#111] relative">
                                {profile.avatar_url ? (
                                    <Image src={profile.avatar_url} alt={profile.full_name || ''} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-3xl font-heading font-bold text-primary">
                                            {(profile.full_name || 'XP').substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 rounded-full ring-2 ring-primary/20 animate-pulse pointer-events-none" />
                        </div>

                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl font-heading font-bold text-white uppercase tracking-tight">
                                {profile.full_name || profile.username}
                            </h1>
                            <p className="text-primary font-mono text-sm mt-0.5">@{profile.username}</p>
                            {profile.bio && (
                                <p className="text-[#888] text-sm mt-2 max-w-md leading-relaxed">{profile.bio}</p>
                            )}
                            <div className="flex items-center gap-1 mt-3 justify-center sm:justify-start">
                                <Calendar size={12} className="text-[#555]" />
                                <span className="text-[#555] text-xs font-mono">membro desde {joinedDate}</span>
                            </div>

                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-5 text-center hover:border-primary/30 transition-colors">
                            <Star className="mx-auto text-primary mb-2" size={20} />
                            <p className="text-2xl font-bold font-mono text-white">{profile.totalXp.toLocaleString('pt-BR')}</p>
                            <p className="text-[#555] text-xs font-mono uppercase tracking-widest mt-1">XP Total</p>
                        </div>
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-5 text-center hover:border-[#333] transition-colors">
                            <Trophy className="mx-auto text-amber-400 mb-2" size={20} />
                            <p className="text-2xl font-bold font-mono text-white">{profile.achievementsCount}</p>
                            <p className="text-[#555] text-xs font-mono uppercase tracking-widest mt-1">Conquistas</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-5 text-center hover:border-[#333] transition-colors">
                            <BookOpen className="mx-auto text-blue-400 mb-2" size={20} />
                            <p className="text-2xl font-bold font-mono text-white">{profile.enrollments.length}</p>
                            <p className="text-[#555] text-xs font-mono uppercase tracking-widest mt-1">Cursos</p>
                        </div>
                    </div>

                    {profile.enrollments.length > 0 && (
                        <section>
                            <h2 className="text-xs font-mono uppercase tracking-widest text-[#555] mb-4">
                                Aprendendo agora
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {profile.enrollments.map((enrollment: any) => {
                                    const course = enrollment.courses;
                                    if (!course) return null;
                                    return (
                                        <Link
                                            key={course.id}
                                            href={`/course/${course.id}`}
                                            className="group bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden hover:border-primary/30 transition-all duration-300"
                                        >
                                            <div className="relative aspect-video bg-[#111]">
                                                {course.thumbnail_url ? (
                                                    <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Image src="/images/xpace-on-branco.png" alt="" width={60} height={18} className="opacity-10" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <p className="text-white text-sm font-medium line-clamp-1">{course.title}</p>
                                                {course.tenants?.name && (
                                                    <p className="text-primary text-[10px] font-mono uppercase tracking-widest mt-1 flex items-center gap-1">
                                                        {course.tenants.name}
                                                        <ArrowUpRight size={10} />
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {profile.enrollments.length === 0 && (
                        <div className="text-center py-16 border border-[#111] rounded-xl">
                            <BookOpen className="mx-auto text-[#333] mb-3" size={32} />
                            <p className="text-[#555] text-sm">Nenhum curso público ainda.</p>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // 2. RENDER TENANT PROFILE (/school-slug)
    const data = await getTenantProfile(decodedSlug);
    if (!data) notFound();

    const { currentUserId: tenantCurrentUserId, isFollowing: tenantIsFollowing } = data.tenant.owner_id
        ? await getCurrentUserAndFollow(data.tenant.owner_id)
        : { currentUserId: null, isFollowing: false };

    const { tenant, courses, activePlan } = data;
    const brandColor = tenant.brand_color || "#6324b2";

    return (
        <div className="min-h-screen bg-[#050505] font-sans selection:bg-primary/30 text-white relative">
            <div
                className="absolute top-0 left-0 w-full h-[500px] z-0 opacity-20 pointer-events-none"
                style={{ background: `radial-gradient(circle at center top, ${brandColor}, transparent 70%)` }}
            ></div>

            <div className="max-w-4xl mx-auto px-6 py-20 relative z-10">
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
                                <img src={tenant.logo_url} alt={tenant.name} className="w-4 h-4 rounded-sm object-contain" />
                            )}
                            {tenant.logo_url ? "ESCOLA PARCEIRA" : "CRIADOR XTAGE"}
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
                        {tenantCurrentUserId && tenant.owner_id && (
                            <div className="mt-5">
                                <FollowButton targetUserId={tenant.owner_id} initialIsFollowing={tenantIsFollowing} />
                            </div>
                        )}
                    </div>
                </div>

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
                                <span className="text-xs text-primary font-mono ml-1">/{activePlan.billing_cycle === 'MONTHLY' ? 'mês' : 'ano'}</span>
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
