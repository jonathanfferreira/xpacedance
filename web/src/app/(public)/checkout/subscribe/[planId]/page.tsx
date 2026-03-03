"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Copy, Repeat } from "lucide-react";
import Image from "next/image";

interface Plan {
    id: string;
    name: string;
    price: number;
    cycle: string;
    tenant_id: string;
}

interface FormData {
    name: string;
    email: string;
    phone: string;
    cpf: string;
    paymentMethod: "pix" | "credit";
}

interface PixData {
    pixQrCodeUrl: string | null;
    pixCopiaECola: string | null;
    subscriptionId: string;
}

export default function SubscribeCheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const planId = params.planId as string;

    const [plan, setPlan] = useState<Plan | null>(null);
    const [loadingPlan, setLoadingPlan] = useState(true);
    const [form, setForm] = useState<FormData>({
        name: "", email: "", phone: "", cpf: "", paymentMethod: "pix",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pixData, setPixData] = useState<PixData | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchPlan = useCallback(async () => {
        const res = await fetch(`/api/studio/subscription-plans`);
        const json = await res.json();
        const found = (json.plans || []).find((p: Plan) => p.id === planId);
        if (!found) {
            router.push("/");
        } else {
            setPlan(found);
        }
        setLoadingPlan(false);
    }, [planId, router]);

    useEffect(() => { fetchPlan(); }, [fetchPlan]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/checkout/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, planId }),
            });
            const json = await res.json();

            if (!res.ok) {
                setError(json.error || "Erro ao processar assinatura.");
                return;
            }

            if (form.paymentMethod === "pix") {
                setPixData({ pixQrCodeUrl: json.pixQrCodeUrl, pixCopiaECola: json.pixCopiaECola, subscriptionId: json.subscriptionId });
            } else {
                router.push("/dashboard");
            }
        } catch {
            setError("Erro de conexão. Tente novamente.");
        } finally {
            setSubmitting(false);
        }
    }

    function copyPix() {
        if (pixData?.pixCopiaECola) {
            navigator.clipboard.writeText(pixData.pixCopiaECola);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    const fmtPrice = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    if (loadingPlan) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!plan) return null;

    if (pixData) {
        return (
            <div className="min-h-screen bg-[#050505] font-sans text-white flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-[#0a0a0a] border border-[#222] p-8 text-center">
                    <CheckCircle2 className="text-green-400 mx-auto mb-4" size={48} />
                    <h1 className="text-2xl font-heading uppercase mb-2">Assinatura Criada!</h1>
                    <p className="text-[#888] text-sm mb-6">Pague o PIX abaixo para ativar seu acesso imediatamente.</p>

                    {pixData.pixQrCodeUrl && (
                        <Image src={pixData.pixQrCodeUrl} alt="QR Code PIX" width={192} height={192} className="mx-auto mb-6 border border-[#222] p-2" unoptimized />
                    )}

                    {pixData.pixCopiaECola && (
                        <button
                            onClick={copyPix}
                            className="w-full flex items-center justify-center gap-2 border border-[#333] text-[#888] py-3 px-4 rounded text-sm hover:border-primary hover:text-white transition mb-4"
                        >
                            <Copy size={14} />
                            {copied ? "Copiado!" : "Copiar código PIX"}
                        </button>
                    )}

                    <p className="text-[10px] text-[#555] font-mono uppercase">
                        Após o pagamento, seu acesso será liberado automaticamente.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] font-sans text-white">
            <div className="max-w-lg mx-auto px-6 py-20">

                {/* Plan info */}
                <div className="border border-primary/30 bg-primary/5 p-5 mb-8 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-primary block mb-0.5">
                            Plano selecionado
                        </span>
                        <span className="font-heading text-white text-lg uppercase">{plan.name}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-display text-white">{fmtPrice(plan.price)}</span>
                        <span className="text-xs text-primary font-mono ml-1">/{plan.cycle === "MONTHLY" ? "mês" : "ano"}</span>
                    </div>
                </div>

                <h1 className="text-3xl font-heading uppercase tracking-tight mb-8 flex items-center gap-3">
                    <Repeat size={24} className="text-primary" />
                    Dados da Assinatura
                </h1>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-4 rounded mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input label="Nome completo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                    <Input label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                    <Input label="Telefone" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                    <Input label="CPF" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: v })} />

                    <div>
                        <label className="text-[#888] text-xs mb-2 block">Método de Pagamento</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(["pix", "credit"] as const).map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setForm({ ...form, paymentMethod: method })}
                                    className={`py-3 border text-sm font-bold uppercase transition ${form.paymentMethod === method
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-[#222] text-[#666] hover:border-[#444]"
                                        }`}
                                >
                                    {method === "pix" ? "PIX" : "Cartão de Crédito"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-primary text-white py-4 font-bold uppercase tracking-wide text-sm hover:bg-white hover:text-black transition-colors mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : <><Repeat size={16} /> Assinar por {fmtPrice(plan.price)}/mês</>}
                    </button>

                    <p className="text-center text-[10px] text-[#555] font-mono uppercase">
                        Cancelável a qualquer momento · Sem taxa de cancelamento
                    </p>
                </form>
            </div>
        </div>
    );
}

function Input({ label, value, onChange, type = "text", required }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
    return (
        <div>
            <label className="text-[#888] text-xs mb-1 block">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="w-full bg-[#0a0a0a] border border-[#222] text-white px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
            />
        </div>
    );
}
