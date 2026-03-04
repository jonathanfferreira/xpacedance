import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Image from 'next/image'
import { ShoppingBag, Star, TrendingUp, Sparkles, ShoppingCart } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default async function XtorePage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Fetch active products with Seller info
    const { data: products } = await supabase
        .from('xtore_products')
        .select(`
            *,
            tenant:tenants(name, avatar_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    // Pega o XP do aluno p/ mostrar no topo
    const { data: { user } } = await supabase.auth.getUser();
    let totalXp = 0;

    if (user) {
        const { data: xpData } = await supabase
            .from('user_xp_history')
            .select('amount')
            .eq('user_id', user.id);

        totalXp = (xpData || []).reduce((sum, row) => sum + row.amount, 0);
    }

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header / Hero */}
            <div className="relative mb-12 rounded-xl overflow-hidden bg-[#0A0A0A] border border-[#222]">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 via-[#050505] to-transparent z-0"></div>
                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 mb-6">
                            <Sparkles size={14} className="text-secondary" />
                            <span className="text-[10px] uppercase font-mono tracking-widest text-secondary font-bold">Marketplace Oficial</span>
                        </div>
                        <h1 className="font-heading text-5xl md:text-6xl mb-4 tracking-tight uppercase">
                            <span className="text-transparent bg-clip-text text-gradient-neon">XTORE</span>
                        </h1>
                        <p className="text-[#888] font-sans text-lg md:text-xl">
                            Apoie seus professores favoritos. Compre merch exclusivo. Use seu XP para ganhar descontos reais.
                        </p>
                    </div>

                    {/* XP Wallet Widget */}
                    <div className="bg-[#111]/80 backdrop-blur-md border border-[#333] rounded-lg p-6 min-w-[280px] shrink-0 transform md:rotate-3 hover:rotate-0 transition-transform">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs uppercase tracking-widest font-mono text-[#888]">Moeda XP Acumulada</span>
                            <Star size={18} className="text-yellow-400" />
                        </div>
                        <div className="text-5xl font-display text-white mb-2">{totalXp.toLocaleString()}</div>
                        <p className="text-xs font-sans text-secondary">
                            Pode gerar aproximademente <strong className="font-bold">R$ {(totalXp / 100).toFixed(2)}</strong> em descontos hoje.
                        </p>
                    </div>
                </div>
            </div>

            {/* Nav & Filters */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1a1a1a]">
                <div className="flex gap-4">
                    <button className="text-white border-b-2 border-secondary pb-4 text-sm font-bold uppercase tracking-widest">Lançamentos</button>
                    <button className="text-[#666] hover:text-[#bbb] border-b-2 border-transparent pb-4 text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5"><TrendingUp size={16} /> Mais Vendidos</button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#222] hover:bg-[#1a1a1a] rounded text-white text-xs font-mono tracking-widest uppercase transition-colors">
                    <ShoppingCart size={14} />
                    Carrinho
                </button>
            </div>

            {/* Products Grid */}
            {products && products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((p) => (
                        <div key={p.id} className="group bg-[#0A0A0A] border border-[#1a1a1a] hover:border-[#333] rounded-lg overflow-hidden transition-all duration-300">
                            {/* Product Image */}
                            <div className="aspect-square bg-[#050505] relative overflow-hidden">
                                {p.image_url ? (
                                    <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                                        <ShoppingBag size={48} className="mb-4 text-[#888]" />
                                        <span className="font-heading uppercase tracking-widest text-[#555] text-xs">Sem Imagem</span>
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm border border-[#222] px-3 py-1 rounded-full flex items-center gap-2">
                                    {p.tenant.avatar_url && (
                                        <img src={p.tenant.avatar_url} className="w-4 h-4 rounded-full" alt="Seller" />
                                    )}
                                    <span className="text-[10px] text-white font-mono uppercase tracking-widest truncate max-w-[80px]">{p.tenant.name}</span>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-white mb-1 truncate">{p.name}</h3>
                                <p className="text-xs text-[#666] mb-4 truncate">{p.description || "Produto exclusivo da XTAGE."}</p>

                                <div className="flex items-center justify-between mt-auto">
                                    <div>
                                        <div className="text-sm font-sans text-white/50 line-through">R$ {(p.price * 1.2).toFixed(2)}</div>
                                        <div className="text-2xl font-display text-secondary">R$ {p.price.toFixed(2)}</div>
                                    </div>
                                    <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-secondary hover:text-white transition-colors">
                                        <ShoppingCart size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-32 flex flex-col items-center justify-center border border-dashed border-[#222] rounded-xl bg-[#050505]">
                    <ShoppingBag size={64} className="text-[#333] mb-6" />
                    <h3 className="font-heading text-2xl uppercase text-white mb-2 tracking-widest">Nenhum produto listado</h3>
                    <p className="text-[#666] font-sans">A XTORE está sendo abastecida pelos professores. Volte amanhã!</p>
                </div>
            )}
        </div>
    )
}
