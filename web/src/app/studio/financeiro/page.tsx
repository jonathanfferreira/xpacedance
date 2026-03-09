"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, TrendingUp, ArrowUpRight, DollarSign, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface BalanceData {
    balance: number;
    income_expected: number;
    wallet_id: string;
    is_mock: boolean;
    pix_key: string | null;
    warning?: string;
}

export default function StudioFinanceiroPage() {
    const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
    const [loading, setLoading] = useState(true);

    // Form fields
    const [amount, setAmount] = useState("");
    const [pixKeyType, setPixKeyType] = useState("CPF");
    const [pixKey, setPixKey] = useState("");

    // Withdraw State
    const [withdrawing, setWithdrawing] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const fetchBalance = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/studio/finance/balance");
            const json = await res.json();
            if (res.ok) {
                setBalanceData(json);
                if (json.pix_key) setPixKey(json.pix_key);
            }
        } catch (err) {
            console.error("Erro ao puxar saldo:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    async function handleWithdraw(e: React.FormEvent) {
        e.preventDefault();
        setWithdrawing(true);
        setFeedback(null);

        try {
            const res = await fetch("/api/studio/finance/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: Number(amount), pixKey, pixKeyType })
            });
            const json = await res.json();

            if (!res.ok) {
                setFeedback({ type: 'error', msg: json.error || 'Erro ao realizar transação.' });
            } else {
                setFeedback({ type: 'success', msg: json.message || 'Transferência solicitada e agendada para hoje!' });
                setAmount("");
                // Atualiza o saldo após a transferência
                setTimeout(() => fetchBalance(), 2000);
            }
        } catch (err) {
            setFeedback({ type: 'error', msg: 'Falha de conexão com a carteira.' });
        } finally {
            setWithdrawing(false);
        }
    }

    const fmtPrice = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-3">
                    <Wallet size={28} className="text-primary" />
                    Hub Financeiro
                </h1>
                <p className="text-[#888] font-mono text-xs uppercase tracking-widest">
                    Gerencie seus recebimentos, saldos asaas e transferências pix.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : (
                <>
                    {/* Alerta de Mock / Testing */}
                    {balanceData?.is_mock && (
                        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded p-4 flex items-start gap-3">
                            <AlertCircle size={20} className="text-yellow-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-yellow-500 font-bold font-heading text-sm uppercase tracking-wider mb-1">
                                    Modo de Homologação / Sem KYC
                                </h4>
                                <p className="text-[#aaa] text-xs">
                                    Sua conta Asaas de recebível ({balanceData?.wallet_id}) está operando em modelo Mock Test. Os saques funcionarão simuladamente até a aprovação de seus documentos na Master.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Alerta de Erro de API (Fallback) */}
                    {balanceData?.warning && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded p-4 flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-[#aaa] text-xs mt-1">
                                {balanceData.warning}
                            </p>
                        </div>
                    )}

                    {/* KPIs de Saldo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors group-hover:bg-green-500/10"></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-2 bg-[#111] rounded border border-[#222]">
                                    <DollarSign size={20} className="text-green-400" />
                                </div>
                            </div>
                            <h3 className="text-[#888] font-mono uppercase tracking-widest text-[10px] mb-1 relative z-10">Saldo Disponível (Livre)</h3>
                            <p className="text-3xl font-display font-bold text-white relative z-10">{fmtPrice(balanceData?.balance || 0)}</p>
                        </div>

                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors group-hover:bg-yellow-500/10"></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-2 bg-[#111] rounded border border-[#222]">
                                    <Clock size={20} className="text-yellow-400" />
                                </div>
                            </div>
                            <h3 className="text-[#888] font-mono uppercase tracking-widest text-[10px] mb-1 relative z-10">Cartão de Crédito a Receber (D+30)</h3>
                            <p className="text-3xl font-display font-bold text-white relative z-10">{fmtPrice(balanceData?.income_expected || 0)}</p>
                        </div>

                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -mr-10 -mt-10 transition-colors group-hover:bg-primary/10"></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-2 bg-[#111] rounded border border-[#222]">
                                    <TrendingUp size={20} className="text-primary" />
                                </div>
                            </div>
                            <h3 className="text-[#888] font-mono uppercase tracking-widest text-[10px] mb-1 relative z-10">Previsão Total em Caixa</h3>
                            <p className="text-3xl font-display font-bold text-white relative z-10">{fmtPrice((balanceData?.balance || 0) + (balanceData?.income_expected || 0))}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Solicitar Saque */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-[#1a1a1a] bg-[#111]">
                                <h2 className="text-white font-heading uppercase tracking-wide text-sm font-bold flex items-center gap-2">
                                    <ArrowUpRight size={16} className="text-primary" />
                                    Solicitar Transferência (Saque PIX)
                                </h2>
                                <p className="text-[#666] text-xs font-mono uppercase tracking-widest mt-1">
                                    Retire seus lucros diretos da sua subconta Asaas.
                                </p>
                            </div>

                            <form onSubmit={handleWithdraw} className="p-6 flex-1 flex flex-col">
                                {feedback && (
                                    <div className={`mb-6 p-4 rounded text-sm flex items-start gap-2 border ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                        {feedback.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                                        <p>{feedback.msg}</p>
                                    </div>
                                )}

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Valor do Saque (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="5.00"
                                            max={balanceData?.is_mock ? 99999 : balanceData?.balance}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="Ex: 500.00"
                                            required
                                            className="w-full bg-[#111] border border-[#2a2a2a] text-white px-4 py-3 rounded text-sm focus:outline-none focus:border-primary font-mono transition-colors"
                                        />
                                        <p className="text-[#555] text-[10px] mt-1 text-right">Saldo Livre: {fmtPrice(balanceData?.balance || 0)}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Tipo de Chave</label>
                                            <select
                                                value={pixKeyType}
                                                onChange={(e) => setPixKeyType(e.target.value)}
                                                className="w-full bg-[#111] border border-[#2a2a2a] text-white px-4 py-3 rounded text-sm focus:outline-none focus:border-primary font-mono transition-colors"
                                            >
                                                <option value="CPF">CPF</option>
                                                <option value="CNPJ">CNPJ</option>
                                                <option value="EMAIL">E-mail</option>
                                                <option value="PHONE">Celular</option>
                                                <option value="EVP">Chave Aleatória</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[#888] text-xs mb-1 block uppercase font-mono tracking-widest">Chave PIX De Destino</label>
                                            <input
                                                type="text"
                                                value={pixKey}
                                                onChange={(e) => setPixKey(e.target.value)}
                                                placeholder="Sua chave..."
                                                required
                                                className="w-full bg-[#111] border border-[#2a2a2a] text-white px-4 py-3 rounded text-sm focus:outline-none focus:border-primary transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <button
                                        type="submit"
                                        disabled={withdrawing || (!balanceData?.is_mock && Number(amount) > (balanceData?.balance || 0)) || Number(amount) < 5 || !pixKey}
                                        className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded font-bold uppercase tracking-widest text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {withdrawing ? <Loader2 size={16} className="animate-spin" /> : <DollarSign size={16} />}
                                        {withdrawing ? "Processando TED/PIX..." : "Solicitar Saque Asaas"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Recent Activity Mock / Informational */}
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded overflow-hidden">
                            <div className="p-6 border-b border-[#1a1a1a] bg-[#111]">
                                <h2 className="text-white font-heading uppercase tracking-wide text-sm font-bold flex items-center gap-2">
                                    <Clock size={16} className="text-[#666]" />
                                    Termos de Repasse (Split Payment)
                                </h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center shrink-0 border border-[#222]">
                                        <DollarSign size={16} className="text-[#888]" />
                                    </div>
                                    <div>
                                        <h4 className="text-white text-sm font-bold mb-1">Como Funciona a Receita?</h4>
                                        <p className="text-[#aaa] text-xs leading-relaxed">
                                            Quando um aluno compra um curso, o dinheiro cai na conta Master da XTAGE. Nossa engine (<span className="text-primary font-mono">Split Flow</span>) automaticamente faz a divisão do percentual contratado e envia o dinheiro líquido para esta tela, sua carteira individual (SubAccount).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-4">
                                    <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center shrink-0 border border-[#222]">
                                        <CheckCircle2 size={16} className="text-[#888]" />
                                    </div>
                                    <div>
                                        <h4 className="text-white text-sm font-bold mb-1">Prazos de Compensação</h4>
                                        <p className="text-[#aaa] text-xs leading-relaxed">
                                            <strong>Transações PIX:</strong> Disponíveis para saque quase instantaneamente.<br />
                                            <strong>Cartão de Crédito:</strong> Liquidadas em 30 dias na sua carteira. Os repasses são 100% blindados (Checkout Seguro de Alta Conversão Asaas).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-4">
                                    <div className="w-10 h-10 rounded-full bg-[#111] flex items-center justify-center shrink-0 border border-[#222]">
                                        <AlertCircle size={16} className="text-[#888]" />
                                    </div>
                                    <div>
                                        <h4 className="text-white text-sm font-bold mb-1">Taxas de Saque</h4>
                                        <p className="text-[#aaa] text-xs leading-relaxed">
                                            As transferências TED para contas bancárias podem incorrer em uma pequena taxa cobrada pela instituição parceira por envio. Saque PIX é geralmente gratuito.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
