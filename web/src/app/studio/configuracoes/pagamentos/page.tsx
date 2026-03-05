"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Loader2, Landmark, CheckCircle2, AlertCircle, Building2, UserCircle } from "lucide-react";
import Link from "next/link";

export default function PagamentosSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [hasActiveWallet, setHasActiveWallet] = useState(false);
    const [walletId, setWalletId] = useState("");

    const [form, setForm] = useState({
        name: "",
        loginEmail: "",
        cpfCnpj: "",
        birthDate: "",
        companyType: "FISICA",
        mobilePhone: "",
        postalCode: "",
        address: "",
        addressNumber: "",
        complement: "",
        province: "",
        city: ""
    });

    useEffect(() => {
        // Checando se a escola já tem conta real vinculada
        fetch("/api/studio/finance/balance")
            .then(res => res.json())
            .then(data => {
                if (data.wallet_id && !data.is_mock) {
                    setHasActiveWallet(true);
                    setWalletId(data.wallet_id);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setFeedback(null);

        try {
            const res = await fetch("/api/studio/finance/kyc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Erro desconhecido.");

            setFeedback({ type: 'success', text: "Conta Master criada e verificada no Asaas com sucesso!" });
            setHasActiveWallet(true);
            setWalletId(data.walletId);
        } catch (err: any) {
            setFeedback({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-[#333]" size={32} />
            </div>
        );
    }

    // Se já preencheu KYC ou se for conta já aprovada no Asaas
    if (hasActiveWallet) {
        return (
            <div className="max-w-3xl animate-fade-in pb-20">
                <div className="mb-8">
                    <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                        <Landmark size={28} className="text-green-500" />
                        Aprovação KYC Oficializada
                    </h1>
                    <p className="text-[#888] font-mono text-xs uppercase tracking-widest">
                        Sua escola está verificada e pronta para faturar.
                    </p>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded p-6 flex flex-col items-center justify-center text-center">
                    <CheckCircle2 size={48} className="text-green-400 mb-4" />
                    <h2 className="text-white font-bold font-heading text-xl uppercase mb-2">Conta Branca Ativa</h2>
                    <p className="text-[#aaa] text-sm mb-4 max-w-lg">
                        Você já enviou seus dados fiscais. Uma Subconta ASAAS (<span className="text-white font-mono">{walletId}</span>) está vinculada à sua escola.
                        Todos os pagamentos realizados pelos seus alunos estão fluindo diretamente para você pelo nosso parceiro ASAAS.
                    </p>
                    <Link href="/studio/financeiro" className="px-6 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded font-bold uppercase tracking-wider text-xs transition-colors">
                        Acessar Hub Financeiro
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Landmark size={28} className="text-[#6324b2]" />
                    Ativação da Conta (Recebíveis)
                </h1>
                <p className="text-[#888] font-mono text-xs uppercase tracking-widest leading-relaxed mt-2 max-w-2xl">
                    Para que possamos realizar o <strong className="text-white text-xs">Split Automático de Pagamentos</strong> das suas vendas, precisamos conectar sua escola oficialmente à nossa Conta Master no Asaas (Bacen). Preencha seus dados reais fiscais abaixo.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {feedback && (
                    <div className={`p-4 rounded text-sm flex items-start gap-2 border ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {feedback.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                        <p>{feedback.text}</p>
                    </div>
                )}

                {/* Bloco de Tipo de Conta */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded space-y-4">
                    <h2 className="text-white font-bold font-heading uppercase tracking-wide text-sm flex items-center gap-2">
                        <Building2 size={16} />
                        1. Classificação Fiscal
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <label className={`cursor-pointer border p-4 rounded flex flex-col items-center gap-2 transition-colors ${form.companyType === 'FISICA' ? 'bg-primary/10 border-primary text-primary' : 'bg-[#111] border-[#2a2a2a] text-[#888] hover:bg-[#1a1a1a]'}`}>
                            <input type="radio" name="companyType" value="FISICA" checked={form.companyType === 'FISICA'} onChange={handleChange} className="hidden" />
                            <UserCircle size={24} />
                            <span className="font-bold uppercase text-xs tracking-wider">Pessoa Física - CPF</span>
                        </label>
                        <label className={`cursor-pointer border p-4 rounded flex flex-col items-center gap-2 transition-colors ${form.companyType === 'MEI' || form.companyType === 'LIMITED' ? 'bg-primary/10 border-primary text-primary' : 'bg-[#111] border-[#2a2a2a] text-[#888] hover:bg-[#1a1a1a]'}`}>
                            <input type="radio" name="companyType" value="MEI" checked={form.companyType === 'MEI'} onChange={handleChange} className="hidden" />
                            <Building2 size={24} />
                            <span className="font-bold uppercase text-xs tracking-wider">Pessoa Jurídica - CNPJ</span>
                        </label>
                    </div>
                </div>

                {/* Bloco de Dados Principais */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded space-y-4">
                    <h2 className="text-white font-bold font-heading uppercase tracking-wide text-sm flex items-center gap-2">
                        <UserCircle size={16} />
                        2. Titularidade & Contato
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Nome Completo {form.companyType !== 'FISICA' && '/ Razão Social'}</label>
                            <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2.5 rounded text-sm focus:border-primary focus:outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Email do Responsável</label>
                            <input type="email" name="loginEmail" value={form.loginEmail} onChange={handleChange} required className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2.5 rounded text-sm focus:border-primary focus:outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">{form.companyType === 'FISICA' ? 'CPF' : 'CNPJ'} (Apenas Números)</label>
                            <input type="text" name="cpfCnpj" value={form.cpfCnpj} onChange={handleChange} required placeholder="000.000.000-00" className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2.5 rounded text-sm focus:border-primary focus:outline-none transition-colors font-mono" />
                        </div>
                        <div>
                            <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Data Nasc. {form.companyType !== 'FISICA' && '/ Fundação'}</label>
                            <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} required className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2.5 rounded text-sm focus:border-primary focus:outline-none transition-colors" />
                        </div>
                        <div>
                            <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Celular Responsável (com DDD)</label>
                            <input type="text" name="mobilePhone" value={form.mobilePhone} onChange={handleChange} required placeholder="(11) 90000-0000" className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2.5 rounded text-sm focus:border-primary focus:outline-none transition-colors font-mono" />
                        </div>
                    </div>
                </div>

                {/* Endereço Físico */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded space-y-4">
                    <h2 className="text-white font-bold font-heading uppercase tracking-wide text-sm flex items-center gap-2">
                        <Settings size={16} />
                        3. Endereço Fiscal
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">CEP (Apenas Números)</label>
                            <input type="text" name="postalCode" value={form.postalCode} onChange={handleChange} required placeholder="00000-000" className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2.5 rounded text-sm focus:border-primary focus:outline-none transition-colors font-mono" />
                        </div>
                        <div>
                            <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Endereço (Rua, Av)</label>
                            <input type="text" name="address" value={form.address} onChange={handleChange} required placeholder="Av. Paulista" className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2.5 rounded text-sm focus:border-primary focus:outline-none transition-colors" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Número</label>
                                <input type="text" name="addressNumber" value={form.addressNumber} onChange={handleChange} required className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2.5 rounded text-sm focus:border-primary focus:outline-none transition-colors font-mono" />
                            </div>
                            <div>
                                <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Comple. / Apto</label>
                                <input type="text" name="complement" value={form.complement} onChange={handleChange} className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2.5 rounded text-sm focus:border-primary focus:outline-none transition-colors" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Bairro / Cidade</label>
                                <input type="text" name="city" value={form.city} onChange={handleChange} required className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2.5 rounded text-sm focus:border-primary focus:outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Estado (UF)</label>
                                <input type="text" name="province" value={form.province} onChange={handleChange} required placeholder="SP" maxLength={2} className="w-full bg-[#111] border border-[#2a2a2a] text-white px-3 py-2.5 rounded text-sm focus:border-primary focus:outline-none transition-colors uppercase font-mono" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded font-bold uppercase tracking-widest text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Validando Bacen...' : 'Criar Subconta (Verificada)'}
                    </button>
                </div>
            </form>
        </div>
    );
}
