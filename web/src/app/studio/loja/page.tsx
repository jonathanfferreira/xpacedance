import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ShoppingBag, Package, Plus, Search, Tag, DollarSign, Box } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default async function StudioLojaPage() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Faça login para continuar.</div>;

    // Fetch the tenant ID
    const { data: tenantProfile } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('owner_id', user.id)
        .single();

    if (!tenantProfile) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center">
                <ShoppingBag size={48} className="mx-auto text-[#333] mb-6" />
                <h1 className="text-xl font-heading text-white uppercase tracking-widest mb-2">Configure sua Escola Primeiro</h1>
                <p className="text-[#888] font-sans">A XTORE só pode ser ativada por perfis homologados no XPACE DANCE OS.</p>
            </div>
        );
    }

    // Fetch Products
    const { data: products } = await supabase
        .from('xtore_products')
        .select('id, name, price, stock, is_active, created_at')
        .eq('tenant_id', tenantProfile.id)
        .order('created_at', { ascending: false });

    // Pending Orders (Sales)
    const { count: pendingOrders } = await supabase
        .from('xtore_orders')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantProfile.id)
        .eq('status', 'pending');

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="font-heading text-4xl mb-2 tracking-tight uppercase">
                        XTORE <span className="text-transparent bg-clip-text text-gradient-neon">Seller</span>
                    </h1>
                    <p className="text-[#888] font-sans">Venda de Merchandising exclusivo do seu Studio.</p>
                </div>

                <Link
                    href="/studio/loja/novo"
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded font-bold font-sans text-sm hover:bg-primary-hover transition-colors"
                >
                    <Plus size={18} /> Novo Produto
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#050505] border border-[#1a1a1a] rounded p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs uppercase tracking-widest font-mono text-[#666]">Meus Produtos</span>
                        <Tag size={16} className="text-[#888]" />
                    </div>
                    <span className="text-3xl font-display text-white">{products?.length || 0}</span>
                </div>
                <div className="bg-[#050505] border border-secondary/30 rounded p-6 shadow-[0_0_15px_rgba(235,0,188,0.05)]">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs uppercase tracking-widest font-mono text-secondary">Vendas a Enviar</span>
                        <Package size={16} className="text-secondary" />
                    </div>
                    <span className="text-3xl font-display text-white">{pendingOrders || 0}</span>
                </div>
                <div className="bg-[#050505] border border-[#1a1a1a] rounded p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs uppercase tracking-widest font-mono text-[#666]">Receita Bruta (Mês)</span>
                        <DollarSign size={16} className="text-[#888]" />
                    </div>
                    <span className="text-3xl font-display text-white">R$ 0,00</span>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-[#0A0A0A] border border-[#222] rounded-sm overflow-hidden">
                <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#111]">
                    <h2 className="font-heading text-lg text-white uppercase tracking-widest flex items-center gap-2">
                        <Box size={18} className="text-primary" /> Inventário
                    </h2>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            className="bg-[#050505] border border-[#222] rounded pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-primary"
                            disabled
                        />
                    </div>
                </div>

                {products && products.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#222] bg-[#050505]">
                                    <th className="p-4 text-xs font-mono uppercase text-[#666] tracking-widest">Produto</th>
                                    <th className="p-4 text-xs font-mono uppercase text-[#666] tracking-widest">Preço</th>
                                    <th className="p-4 text-xs font-mono uppercase text-[#666] tracking-widest">Estoque</th>
                                    <th className="p-4 text-xs font-mono uppercase text-[#666] tracking-widest">Status</th>
                                    <th className="p-4 text-xs font-mono uppercase text-[#666] tracking-widest text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.id} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-white">{p.name}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-sans text-secondary border border-secondary/30 bg-secondary/10 inline-block px-2 py-0.5 rounded">R$ {p.price.toFixed(2)}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-mono ${p.stock > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                                                {p.stock} un
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {p.is_active ?
                                                <span className="text-[10px] uppercase font-bold text-white bg-primary px-2 py-1 rounded-sm">Ativo</span> :
                                                <span className="text-[10px] uppercase font-bold text-[#888] bg-[#222] px-2 py-1 rounded-sm">Pausado</span>
                                            }
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link href={`/studio/loja/${p.id}`} className="text-xs text-primary hover:text-white underline font-mono uppercase tracking-widest transition-colors">Editar</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-[#555] font-sans text-sm">
                        Nenhum produto cadastrado. Clique em &quot;Novo Produto&quot; para iniciar suas vendas.
                    </div>
                )}
            </div>

        </div>
    )
}
