import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Compass, Clock, Star, Play } from 'lucide-react';

interface ExploreProps {
    searchParams: Promise<{ q?: string }>;
}

async function getSearchResults(query: string) {
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

    const { data: courses } = await dbQuery.limit(20);
    return courses || [];
}

export default async function ExplorePage({ searchParams }: ExploreProps) {
    const parsedParams = await searchParams;
    const query = parsedParams.q || '';
    const courses = await getSearchResults(query);

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
                                : "Explore milhares de cursos em nossa rede de criadores XPACE."}
                        </p>
                    </div>
                    <div className="hidden md:flex items-center justify-center p-6 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                        <Compass className="text-primary w-12 h-12" />
                    </div>
                </div>
            </div>

            {/* Results */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white font-bold font-heading uppercase tracking-wide flex items-center gap-2">
                        <Search size={18} className="text-primary" />
                        {query ? 'Resultados da Busca' : 'Destaques Globais'}
                    </h2>
                    <span className="text-[#666] text-xs font-mono uppercase tracking-widest">{courses.length} encontrados</span>
                </div>

                {courses.length === 0 ? (
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-16 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#111] border border-[#222] text-[#444] mb-6">
                            <Search size={32} />
                        </div>
                        <h3 className="text-2xl font-heading text-white uppercase tracking-tight mb-2">Nada Encontrado</h3>
                        <p className="text-[#888]">Não encontramos nenhum curso com o termo "{query}". Tente outra palavra-chave.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {courses.map((course: any) => {
                            const isFree = course.pricing_type === 'free';
                            const price = course.pricing_type === 'pay_what_you_want' ? course.min_price : course.price;
                            const tenantName = course.tenants?.name || 'Escola Invisível';

                            return (
                                <Link key={course.id} href={`/dashboard/cursos/${course.id}`} className="group relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-primary/50 transition-colors block">
                                    <div className="aspect-video relative bg-[#111] overflow-hidden">
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
                                    <div className="p-5">
                                        <p className="text-xs font-mono text-primary uppercase tracking-widest mb-2 line-clamp-1">
                                            {tenantName}
                                        </p>
                                        <h3 className="text-lg font-bold text-white leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-[#888] line-clamp-2 leading-relaxed">
                                            {course.description || 'Nenhuma descrição fornecida para este curso.'}
                                        </p>
                                    </div>
                                    <div className="px-5 py-3 border-t border-[#1a1a1a] bg-[#050505] flex items-center justify-between text-[#666]">
                                        <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
                                            <Star size={12} className="text-yellow-500" />
                                            <span>4.9 (12k)</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
                                            <Clock size={12} />
                                            <span>12h 40m</span>
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
