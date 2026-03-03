"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

interface Plan {
    id: string;
    name: string;
    price: number;
    cycle: string;
    is_active: boolean;
    created_at: string;
}

interface PlanForm {
    name: string;
    price: string;
    cycle: "MONTHLY" | "YEARLY";
    is_active: boolean;
}

const emptyForm: PlanForm = { name: "", price: "19.90", cycle: "MONTHLY", is_active: true };

export default function AssinaturasPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<PlanForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/studio/subscription-plans");
        const json = await res.json();
        setPlans(json.plans || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
        setShowModal(true);
    }

    function openEdit(plan: Plan) {
        setEditingId(plan.id);
        setForm({ name: plan.name, price: String(plan.price), cycle: plan.cycle as "MONTHLY" | "YEARLY", is_active: plan.is_active });
        setError(null);
        setShowModal(true);
    }

    async function handleSave() {
        setSaving(true);
        setError(null);

        const payload = { name: form.name, price: Number(form.price), cycle: form.cycle, is_active: form.is_active };
        const url = editingId ? `/api/studio/subscription-plans/${editingId}` : "/api/studio/subscription-plans";
        const method = editingId ? "PATCH" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();

            if (!res.ok) {
                setError(json.error || "Erro ao salvar plano.");
            } else {
                setShowModal(false);
                fetchPlans();
            }
        } catch {
            setError("Erro de conexão.");
        } finally {
            setSaving(false);
        }
    }

    async function handleToggle(plan: Plan) {
        await fetch(`/api/studio/subscription-plans/${plan.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: !plan.is_active }),
        });
        fetchPlans();
    }

    async function handleDelete(planId: string) {
        if (!confirm("Tem certeza que deseja excluir este plano?")) return;
        await fetch(`/api/studio/subscription-plans/${planId}`, { method: "DELETE" });
        fetchPlans();
    }

    const fmtPrice = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight">
                        Planos de Assinatura
                    </h1>
                    <p className="text-[#888] text-sm mt-1">
                        Gerencie planos recorrentes para sua escola.
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-sm font-bold hover:bg-primary/80 transition-colors"
                >
                    <Plus size={16} />
                    Novo Plano
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[#555]" size={32} />
                </div>
            ) : plans.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[#222] rounded">
                    <p className="text-[#555] text-sm mb-3">Nenhum plano de assinatura criado ainda.</p>
                    <button onClick={openCreate} className="text-primary text-sm hover:underline">
                        + Criar meu primeiro plano
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`flex items-center justify-between p-5 border rounded bg-[#0a0a0a] transition-colors ${plan.is_active ? "border-[#1a1a1a]" : "border-[#111] opacity-60"
                                }`}
                        >
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-base">{plan.name}</span>
                                <span className="text-[#888] text-sm">
                                    {fmtPrice(plan.price)} / {plan.cycle === "MONTHLY" ? "mês" : "ano"}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span
                                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${plan.is_active
                                            ? "text-green-400 border-green-400/30 bg-green-400/10"
                                            : "text-[#666] border-[#333] bg-[#111]"
                                        }`}
                                >
                                    {plan.is_active ? "Ativo" : "Inativo"}
                                </span>

                                <button
                                    onClick={() => handleToggle(plan)}
                                    className="text-[#666] hover:text-white transition"
                                    title={plan.is_active ? "Desativar" : "Ativar"}
                                >
                                    {plan.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>

                                <button
                                    onClick={() => openEdit(plan)}
                                    className="text-[#666] hover:text-white transition"
                                    title="Editar"
                                >
                                    <Pencil size={16} />
                                </button>

                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="text-[#666] hover:text-red-400 transition"
                                    title="Excluir"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de criação/edição */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0d0d0d] border border-[#222] rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-white font-bold text-xl mb-6">
                            {editingId ? "Editar Plano" : "Novo Plano"}
                        </h2>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-[#888] text-xs mb-1 block">Nome do Plano</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ex: Plano Premium"
                                    className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="text-[#888] text-xs mb-1 block">Preço (mín. R$ 19,90)</label>
                                <input
                                    type="number"
                                    min="19.90"
                                    step="0.01"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="text-[#888] text-xs mb-1 block">Ciclo de Cobrança</label>
                                <select
                                    value={form.cycle}
                                    onChange={(e) => setForm({ ...form, cycle: e.target.value as "MONTHLY" | "YEARLY" })}
                                    className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-primary"
                                >
                                    <option value="MONTHLY">Mensal</option>
                                    <option value="YEARLY">Anual</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-[#aaa] text-sm">Plano ativo (visível na vitrine)</span>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 border border-[#333] text-[#888] py-2 rounded text-sm hover:border-[#555] transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name || !form.price}
                                className="flex-1 bg-primary text-white py-2 rounded text-sm font-bold hover:bg-primary/80 transition disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Salvar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
