import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Compass, Clock, Star, Play } from 'lucide-react';

interface ExploreProps {
    searchParams: Promise<{ q?: string; category?: string }>;
}

const CATEGORIES = [
    { id: 'all', label: 'Todos os Estilos' },
    { id: 'hiphop', label: 'Hip Hop' },
    { id: 'jazz', label: 'Jazz Funk' },
    { id: 'commercial', label: 'Commercial Dance' },
    { id: 'dancehall', label: 'Dancehall' },
    { id: 'heels', label: 'Heels' },
    { id: 'locking', label: 'Locking' },
    { id: 'popping', label: 'Popping' },
    { id: 'kpop', label: 'K-Pop' },
    { id: 'contemporaneo', label: 'Contemporâneo' },
    { id: 'ballet', label: 'Ballet Clássico' },
    { id: 'breakdance', label: 'Breakdance' },
    { id: 'house', label: 'House Dance' },
    { id: 'afro', label: 'Afrobeat' },
    { id: 'salsa', label: 'Salsa / Bachata' },
];

async function getSearchResults(query: string, category: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    let dbQuery = supabase
        .from('courses')
        .select(`
            id, title, description, thumbnail_url, price, min_price, pricing_type,
            tenants!inner(name, brand_color, logo_url)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    // Se tiver termo de busca, aplica ilike em title ou description
    if (query) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (category && category !== 'all') {
        dbQuery = dbQuery.eq('category', category);
    }

    const { data: courses, error } = await dbQuery.limit(20);
    // Ignore schema errors gracefully if 'category' column doesn't exist yet
    if (error && error.code === '42703') {
        const fallback = await supabase.from('courses').select('id, title, description, thumbnail_url, price, min_price, pricing_type, tenants!inner(name, brand_color, logo_url)').eq('is_published', true).order('created_at', { ascending: false }).limit(20);
        return fallback.data || [];
    }
    return courses || [];
}

export default async function ExplorePage({ searchParams }: ExploreProps) {
    const parsedParams = await searchParams;
    const query = parsedParams.q || '';
    const category = parsedParams.category || 'all';
    const courses = await getSearchResults(query, category);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header / Hero */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0a0a0a] to-[#111] border border-[#1a1a1a] p-8 md:p-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -ml-20 -mb-20"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight uppercase mb-4 text-white">
                            Descubra Novos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Horizontes</span>
                        </h1>
                        <p className="text-[#888] font-sans text-lg max-w-xl">
                            {query
                                ? `Mostrando resultados para "${query}"`
                                : "Explore milhares de cursos em nossa rede de criadores XTAGE."}
                        </p>
                    </div>
                    <div className="hidden md:flex items-center justify-center p-6 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                        <Compass className="text-primary w-12 h-12" />
                    </div>
                </div>
            </div>

            {/* Netflix Filter Buttons */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-2">
                {CATEGORIES.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/dashboard/explore?${new URLSearchParams({
                            ...(query ? { q: query } : {}),
                            ...(cat.id !== 'all' ? { category: cat.id } : {})
                        }).toString()}`}
                        className={`
                            whitespace-nowrap px-5 py-2 rounded-full font-bold uppercase tracking-widest text-xs transition-colors border
                            ${category === cat.id
                                ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(99,36,178,0.3)]'
                                : 'bg-[#111] text-[#888] border-[#222] hover:bg-[#1a1a1a] hover:text-white hover:border-[#333]'}
                        `}
                    >
                        {cat.label}
                    </Link>
                ))}
            </div>

            {/* Results */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white font-bold font-heading uppercase tracking-wide flex items-center gap-2">
                        <Search size={18} className="text-primary" />
                        {query ? 'Resultados da Busca' : category !== 'all' ? `Estilo: ${CATEGORIES.find(c => c.id === category)?.label}` : 'Destaques Globais'}
                    </h2>
                    <span className="text-[#666] text-xs font-mono uppercase tracking-widest">{courses.length} encontrados</span>
                </div>

                {courses.length === 0 ? (
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-16 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#111] border border-[#222] text-[#444] mb-6">
                            <Search size={32} />
                        </div>
                        <h3 className="text-2xl font-heading text-white uppercase tracking-tight mb-2">Nada Encontrado</h3>
                        <p className="text-[#888]">Não encontramos nenhum curso com o termo &quot;{query}&quot;. Tente outra palavra-chave.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {courses.map((course: any) => {
                            const isFree = course.pricing_type === 'free';
                            const price = course.pricing_type === 'pay_what_you_want' ? course.min_price : course.price;
                            const tenantName = course.tenants?.name || 'Escola Invisível';

                            return (
                                <Link key={course.id} href={`/dashboard/cursos/${course.id}`} className="group relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-primary/50 transition-colors flex flex-col h-full">
                                    <div className="aspect-video relative bg-[#111] overflow-hidden shrink-0">
                                        {course.thumbnail_url ? (
                                            <Image
                                                src={course.thumbnail_url}
                                                alt={course.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Play size={32} className="text-[#333]" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

                                        {/* Tag de Preço */}
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-1 rounded text-[10px] font-mono tracking-widest uppercase text-white">
                                            {isFree ? 'Gratuito' : `R$ ${price?.toFixed(2)}`}
                                        </div>
                                    </div>
                                    <div className="p-5 pb-4 flex-1 flex flex-col gap-1">
                                        <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1 line-clamp-1">
                                            {tenantName}
                                        </p>
                                        <h3 className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-[#888] line-clamp-2 leading-relaxed mb-auto">
                                            {course.description || 'Nenhuma descrição fornecida para este curso.'}
                                        </p>
                                    </div>
                                    <div className="px-5 py-3 border-t border-[#1a1a1a] bg-[#050505] flex items-center justify-between text-[#666] mt-auto">
                                        <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
                                            <Star size={12} className="text-primary" />
                                            <span>Novo</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
                                            <Clock size={12} />
                                            <span>{course.pricing_type === 'subscription' ? 'Assinatura' : 'Curso Avulso'}</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
