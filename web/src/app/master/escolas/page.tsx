'use client';

import { Search, Plus, Filter, MoreVertical, ShieldCheck, Ban, Edit2, PlayCircle, CheckCircle, RefreshCw, X, Save, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface School {
    id: string;
    name: string;
    status: 'pending' | 'active' | 'suspended';
    created_at: string;
    owner: { full_name: string; email: string };
    _courses_count: number;
}

interface EditForm {
    name: string;
    status: School['status'];
}

export default function MasterSchoolsPage() {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({ name: '', status: 'active' });
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    const fetchSchools = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tenants')
            .select(`
                id, name, status, created_at,
                owner:users!owner_id(full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setSchools(data as unknown as School[]);
        }
        setLoading(false);
    }

    useEffect(() => { fetchSchools() }, []);

    const approveSchool = async (tenantId: string) => {
        if (!confirm("Deseja aprovar esta escola, criar C/C na Asaas e dar permissão de Studio ao Dono?")) return;

        try {
            const res = await fetch('/api/master/schools/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            alert("✅ Escola Aprovada! Carteira gerada: " + result.walletId);
            fetchSchools();
        } catch (e: unknown) {
            alert("Erro: " + (e instanceof Error ? e.message : String(e)));
        }
    }

    const openEdit = (school: School) => {
        setEditingSchool(school);
        setEditForm({ name: school.name, status: school.status });
    };

    const handleSaveEdit = async () => {
        if (!editingSchool) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('tenants')
                .update({ name: editForm.name.trim(), status: editForm.status })
                .eq('id', editingSchool.id);
            if (error) throw error;
            setSchools(prev => prev.map(s =>
                s.id === editingSchool.id
                    ? { ...s, name: editForm.name.trim(), status: editForm.status }
                    : s
            ));
            setEditingSchool(null);
        } catch (e: unknown) {
            alert("Erro ao salvar: " + (e instanceof Error ? e.message : String(e)));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight mb-2">Escolas & Criadores</h1>
                    <p className="text-[#888] font-sans text-sm">Gerencie os Inquilinos Multi-Tenant, aprovações, bloqueios master e Split Asaas.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchSchools} className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-[#aaa] px-4 py-2.5 rounded font-mono text-sm uppercase transition-all">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Sync
                    </button>
                    <button className="flex items-center gap-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-white px-5 py-2.5 rounded font-mono text-sm uppercase tracking-wider font-bold transition-all">
                        <Filter size={18} /> Filtrar
                    </button>
                    <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded font-mono text-sm uppercase tracking-wider font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        <Plus size={18} /> Cadastrar Escola
                    </button>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm overflow-hidden">
                <div className="p-4 border-b border-[#1a1a1a] flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar inquilino por nome ou ID..."
                            className="w-full bg-[#111] border border-[#222] rounded py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#111] border-b border-[#222] text-xs font-mono uppercase tracking-widest text-[#888]">
                                <th className="p-4 font-normal">Inquilino (Escola)</th>
                                <th className="p-4 font-normal">Master Owner</th>
                                <th className="p-4 font-normal">Cursos</th>
                                <th className="p-4 font-normal">Mês</th>
                                <th className="p-4 font-normal">Status Asaas</th>
                                <th className="p-4 font-normal text-right">Controles</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-sans divide-y divide-[#1a1a1a]">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-[#555]">Carregando rede...</td></tr>
                            ) : schools.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-[#555]">Nenhum inquilino cadastrado na sua operação local.</td></tr>
                            ) : (
                                schools.map(s => (
                                    <SchoolRow
                                        key={s.id}
                                        school={s}
                                        onApprove={() => approveSchool(s.id)}
                                        onEdit={() => openEdit(s)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de edição */}
            {editingSchool && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                    <div className="bg-[#0a0a0a] border border-[#222] rounded-sm w-full max-w-md p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="text-white font-heading text-lg uppercase tracking-widest">Editar Escola</h2>
                            <button onClick={() => setEditingSchool(null)} className="text-[#555] hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-mono uppercase tracking-widest text-[#888] block mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                    className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-2.5 px-3 text-white text-sm outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-mono uppercase tracking-widest text-[#888] block mb-1">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value as School['status'] }))}
                                    className="w-full bg-[#111] border border-[#222] rounded py-2.5 px-3 text-white text-sm outline-none cursor-pointer"
                                >
                                    <option value="pending">Pendente</option>
                                    <option value="active">Ativo</option>
                                    <option value="suspended">Suspenso</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setEditingSchool(null)}
                                className="flex-1 px-4 py-2.5 border border-[#333] text-[#888] hover:text-white rounded text-sm font-mono uppercase transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 rounded text-sm font-mono uppercase font-bold transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SchoolRow({ school, onApprove, onEdit }: { school: School; onApprove: () => void; onEdit: () => void }) {
    const { name, id, owner, status } = school;
    return (
        <tr className="hover:bg-[#111] transition-colors group">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#1a1a1a] border border-[#222] flex items-center justify-center shrink-0">
                        <span className="text-[#666] font-heading font-bold">{name.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                        <p className="font-bold text-white">{name}</p>
                        <p className="text-[10px] text-[#666] font-mono">{id}</p>
                    </div>
                </div>
            </td>
            <td className="p-4 text-[#aaa]">{owner?.full_name || owner?.email || "N/A"}</td>
            <td className="p-4 text-[#aaa] flex items-center gap-2 mt-2"><PlayCircle size={14} /> 0</td>
            <td className="p-4 font-display font-medium text-white">R$ 0</td>
            <td className="p-4">
                {status === 'active' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-500/10 text-green-500 text-xs font-mono uppercase tracking-widest border border-green-500/20"><ShieldCheck size={14} /> Ativo (Split OK)</span>}
                {status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-yellow-500/10 text-yellow-500 text-xs font-mono uppercase tracking-widest border border-yellow-500/20">Aguardando Avaliação</span>}
                {status === 'suspended' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 text-red-500 text-xs font-mono uppercase tracking-widest border border-red-500/20"><Ban size={14} /> Suspenso</span>}
            </td>
            <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {status === 'pending' && (
                        <button onClick={onApprove} className="p-2 text-green-500/70 hover:text-green-500 hover:bg-green-500/10 rounded transition-colors" title="Aprovar e Criar Split Asaas">
                            <CheckCircle size={16} />
                        </button>
                    )}
                    <button onClick={onEdit} className="p-2 text-[#888] hover:text-white hover:bg-[#222] rounded transition-colors" title="Editar Escola">
                        <Edit2 size={16} />
                    </button>
                    <button className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Suspender Operação">
                        <Ban size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
}
