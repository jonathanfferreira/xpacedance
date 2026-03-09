'use client';

import {
    Users,
    TrendingUp,
    DollarSign,
    ArrowUpRight,
    ShieldCheck,
    AlertOctagon,
    Building2,
    Activity,
    CheckCircle,
    XCircle,
    RefreshCw,
    Instagram
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface DashboardData {
    totalTenants: number;
    activeTenants: number;
    pendingTenants: number;
    totalUsers: number;
    totalTransactions: number;
    totalRevenue: number;
    pendingSchools: { id: string; name: string; owner_name: string; instagram: string }[];
}

export default function MasterDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchDashboard = async () => {
        setLoading(true);

        const [tenantsRes, usersRes, txRes, pendingRes] = await Promise.all([
            supabase.from('tenants').select('id, status'),
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('transactions').select('amount, status').eq('status', 'confirmed'),
            supabase.from('tenants').select(`id, name, instagram, owner:users!owner_id(full_name)`).eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
        ]);

        const tenants = tenantsRes.data || [];
        const totalRevenue = (txRes.data || []).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

        setData({
            totalTenants: tenants.length,
            activeTenants: tenants.filter(t => t.status === 'active').length,
            pendingTenants: tenants.filter(t => t.status === 'pending').length,
            totalUsers: usersRes.count || 0,
            totalTransactions: (txRes.data || []).length,
            totalRevenue,
            pendingSchools: (pendingRes.data || []).map((s: any) => ({
                id: s.id,
                name: s.name,
                owner_name: s.owner?.full_name || 'N/A',
                instagram: s.instagram || '',
            })),
        });
        setLoading(false);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchDashboard(); }, []);

    const handleApprove = async (tenantId: string) => {
        if (!confirm("Aprovar esta escola e criar Sub-Conta Asaas?")) return;
        try {
            const res = await fetch('/api/master/schools/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            alert("✅ Escola aprovada! Wallet: " + result.walletId);
            fetchDashboard();
        } catch (e: any) {
            alert("Erro: " + e.message);
        }
    };

    const handleReject = async (tenantId: string) => {
        if (!confirm("Recusar e remover esta solicitação?")) return;
        const { error } = await supabase.from('tenants').delete().eq('id', tenantId);
        if (error) { alert("Erro: " + error.message); return; }
        fetchDashboard();
    };

    const xpaceRevenue = data ? data.totalRevenue * 0.15 : 0;

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight mb-2">Suprema Corte XTAGE</h1>
                    <p className="text-[#888] font-sans text-sm">Visão global da Plataforma (Todas as Escolas Combinadas). Acesso restrito Nível 5.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchDashboard} className="flex items-center gap-2 bg-[#111] border border-[#222] px-4 py-2 rounded-sm text-[#aaa] text-xs font-mono uppercase hover:text-white transition-colors">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync
                    </button>
                    <div className="flex items-center gap-2 bg-[#111] border border-[#222] px-4 py-2 rounded-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-mono text-xs text-[#aaa] uppercase tracking-widest">Sistemas Operacionais</span>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <h2 className="text-xl font-heading font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                <DollarSign className="text-primary" /> Faturamento Global (Hoje)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                <MetricCard
                    title="Volume Bruto (GMV)"
                    value={loading ? '...' : `R$ ${data?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0'}`}
                    trend={`${data?.totalTransactions || 0} transações`}
                    icon={<Activity />}
                    isMoney
                />
                <MetricCard
                    title="Net Revenue XTAGE (15%)"
                    value={loading ? '...' : `R$ ${xpaceRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    trend="Split automático"
                    icon={<DollarSign />}
                    isMoney
                    highlight
                />
                <MetricCard
                    title="Alunos Ativos (Global)"
                    value={loading ? '...' : String(data?.totalUsers || 0)}
                    trend="cadastrados"
                    icon={<Users />}
                />
                <MetricCard
                    title="Escolas Registradas"
                    value={loading ? '...' : String(data?.totalTenants || 0)}
                    trend={`${data?.pendingTenants || 0} na fila`}
                    icon={<Building2 />}
                />
            </div>

            {/* Lower Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Pending Schools */}
                <div className="lg:col-span-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck size={120} /></div>
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h2 className="font-heading font-bold uppercase text-white tracking-wide flex items-center gap-2">
                            <AlertOctagon className="text-accent" size={18} /> Escolas Pendentes de Aprovação
                        </h2>
                        <Link href="/master/escolas" className="text-xs text-primary font-mono hover:text-white transition-colors">VER FILA COMPLETA</Link>
                    </div>

                    <div className="flex flex-col gap-4 relative z-10">
                        {loading ? (
                            <p className="text-[#555] text-sm text-center py-8">Carregando pendências...</p>
                        ) : (data?.pendingSchools.length === 0) ? (
                            <p className="text-[#555] text-sm text-center py-8">Nenhuma escola aguardando aprovação. 🎉</p>
                        ) : (
                            data?.pendingSchools.map((school) => (
                                <div key={school.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#111] border border-[#222] rounded">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#1a1a1a] rounded flex items-center justify-center shrink-0 border border-white/5">
                                            <Building2 size={20} className="text-[#666]" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{school.name}</h4>
                                            <p className="text-xs text-[#888]">Prof: {school.owner_name} • Instagram: {school.instagram}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                        <a
                                            href={`https://instagram.com/${school.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 sm:flex-none px-4 py-2 text-xs font-mono uppercase font-bold text-white bg-blue-600/10 border border-blue-600/30 hover:bg-blue-600 rounded transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <Instagram size={14} /> Redes
                                        </a>
                                        <button
                                            onClick={() => handleApprove(school.id)}
                                            className="flex-1 sm:flex-none px-4 py-2 text-xs font-mono uppercase font-bold text-white bg-green-600/20 border border-green-600/50 hover:bg-green-600 rounded transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle size={14} /> Aprovar
                                        </button>
                                        <button
                                            onClick={() => handleReject(school.id)}
                                            className="flex-1 sm:flex-none px-4 py-2 text-xs font-mono uppercase font-bold text-white bg-red-600/10 border border-red-600/30 hover:bg-red-600 rounded transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
                                        >
                                            <XCircle size={14} /> Recusar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Audit Log */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6">
                    <h2 className="font-heading font-bold uppercase text-white tracking-wide mb-6">Auditoria Recente</h2>
                    <div className="flex flex-col gap-5 relative before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#222]">
                        <ActivityItem text={`${data?.activeTenants || 0} escola(s) ativa(s) gerando receita na plataforma.`} time="Agora" isGood />
                        <ActivityItem text={`${data?.pendingTenants || 0} escola(s) aguardando aprovação na fila.`} time="Agora" isAlert={(data?.pendingTenants || 0) > 0} />
                        <ActivityItem text="Servidor Bunny.net operando com 99.9% HLS Delivery." time="Última verificação" isGood />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, trend, icon, isMoney = false, highlight = false, tooltip }: any) {
    return (
        <div className={`
            p-5 rounded-sm flex flex-col relative overflow-hidden group border
            ${highlight ? 'bg-primary/5 border-primary shadow-[0_0_30px_rgba(99,36,178,0.15)]' : 'bg-[#0a0a0a] border-[#1a1a1a]'}
        `}>
            <div className="absolute -right-4 -top-4 text-[#111] group-hover:text-primary/10 transition-colors w-24 h-24 pointer-events-none">
                {icon}
            </div>
            <div className={`mb-4 relative z-10 w-8 h-8 flex items-center justify-center rounded border ${highlight ? 'bg-primary/20 border-primary text-primary' : 'bg-[#111] border-[#222] text-[#888]'}`}>
                {icon}
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-end">
                <p className={`text-xs font-sans mb-1 flex items-center gap-1 ${highlight ? 'text-white' : 'text-[#666]'}`} title={tooltip}>
                    {title}
                </p>
                <div className="flex flex-wrap items-end gap-3">
                    <h3 className={`text-2xl font-display font-medium ${isMoney ? 'text-white' : 'text-[#ddd]'}`}>{value}</h3>
                    <span className={`flex items-center text-xs font-mono mb-1 ${highlight ? 'text-[#fff]' : 'text-secondary'}`}>
                        <ArrowUpRight size={12} className="mr-0.5" />
                        {trend}
                    </span>
                </div>
            </div>
        </div>
    );
}

function ActivityItem({ text, time, isAlert, isGood }: any) {
    return (
        <div className="pl-6 relative">
            <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border-[3px] border-[#0a0a0a] 
                ${isAlert ? 'bg-accent' : isGood ? 'bg-green-500' : 'bg-primary'}
            `}></div>
            <p className="text-sm text-[#ddd] mb-1 leading-snug">{text}</p>
            <span className="text-xs text-[#555] font-mono">{time}</span>
        </div>
    );
}
