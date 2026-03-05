"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, CreditCard, ChevronRight, CheckCircle2, FileText, Repeat } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useParams } from "next/navigation";

const INTEREST_RATE = 0.0299;
const calculateInstallment = (cashPrice: number, months: number) => {
    if (months === 1) return cashPrice;
    const amount = cashPrice * Math.pow(1 + INTEREST_RATE, months);
    return amount / months;
};

interface CourseData {
    id: string;
    title: string;
    price: number;
    pricing_type: string;
    thumbnail_url: string | null;
    description: string;
    tenantName: string;
    materialsCount: number;
}

export default function CheckoutPage() {
    const params = useParams();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<CourseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit">("credit");
    const [installments, setInstallments] = useState(1);

    // Form fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [cpf, setCpf] = useState("");
    const [password, setPassword] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvc, setCardCvc] = useState("");

    // UI states
    const [isProcessing, setIsProcessing] = useState(false);
    const [pixData, setPixData] = useState<{ url: string, copiaECola: string } | null>(null);
    const [successMode, setSuccessMode] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Fetch course data
    useEffect(() => {
        const fetchCourse = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('courses')
                .select('id, title, price, pricing_type, thumbnail_url, description, tenant_id, tenants:tenants!tenant_id(name)')
                .eq('id', courseId)
                .single();

            if (data) {
                const { data: materials } = await supabase
                    .from('course_materials')
                    .select('id')
                    .eq('course_id', courseId);

                setCourse({
                    id: data.id,
                    title: data.title,
                    price: data.price || 39.90,
                    pricing_type: data.pricing_type || 'one_time',
                    thumbnail_url: data.thumbnail_url,
                    description: data.description,
                    tenantName: (data as any).tenants?.name || 'Professor',
                    materialsCount: materials?.length || 0,
                });
            }
            setLoading(false);
        };
        if (courseId) fetchCourse();
    }, [courseId]);

    // Pre-fill if logged in
    useEffect(() => {
        const prefill = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setEmail(user.email || '');
                setName(user.user_metadata?.full_name || '');
            }
        };
        prefill();
    }, []);

    const coursePrice = course?.price || 0;
    const isSubscription = course?.pricing_type === 'subscription';
    const installmentOptions = Array.from({ length: 12 }, (_, i) => i + 1);

    const totalChargeAmount = paymentMethod === "pix" || isSubscription
        ? coursePrice
        : calculateInstallment(coursePrice, installments) * installments;

    const handleCheckout = async () => {
        setIsProcessing(true);
        setErrorMsg("");
        try {
            const payload: any = {
                courseId,
                name, email, phone, cpf,
                paymentMethod: isSubscription ? 'credit' : paymentMethod,
                installments: isSubscription ? 1 : installments,
            };

            if (password) payload.password = password;

            if (paymentMethod === 'credit' && !isSubscription) {
                payload.creditCard = {
                    holderName: name,
                    number: cardNumber.replace(/\s/g, ''),
                    expiryMonth: cardExpiry.split('/')[0],
                    expiryYear: "20" + (cardExpiry.split('/')[1] || ''),
                    ccv: cardCvc,
                };
            }

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Erro ao processar pagamento");

            if (paymentMethod === 'pix' && !isSubscription) {
                setPixData({ url: data.pixQrCodeUrl, copiaECola: data.pixCopiaECola });
            } else {
                setSuccessMode(true);
            }
        } catch (asaasError: any) {  
            setErrorMsg(asaasError.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center text-center">
                <div>
                    <h1 className="text-3xl font-heading uppercase mb-4">Curso Não Encontrado</h1>
                    <p className="text-[#888]">Este curso não existe ou foi removido.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-[#ededed] font-sans selection:bg-primary/30">
            <nav className="h-16 border-b border-[#1a1a1a] flex items-center justify-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <Lock size={16} className="text-[#666] mr-2" />
                <span className="text-xs font-mono uppercase tracking-widest text-[#888]">Checkout Seguro XTAGE</span>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20 flex flex-col lg:flex-row gap-12 lg:gap-24 relative">
                <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none"></div>

                {/* Left: Billing */}
                <div className="flex-1 max-w-xl relative z-10">
                    <h1 className="text-4xl font-heading uppercase text-white mb-2">Finalizar<br />Inscrição</h1>
                    <p className="text-[#888] mb-10 text-sm">
                        {isSubscription ? 'Assinatura recorrente com acesso total.' : 'Acesso imediato após confirmação do pagamento.'}
                    </p>

                    {errorMsg && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded text-sm">
                            {errorMsg}
                        </div>
                    )}

                    <div className="space-y-10">
                        {/* Section 1: Identity */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-6 h-6 border border-primary text-primary flex items-center justify-center font-display text-sm">1</span>
                                <h2 className="font-heading text-xl uppercase text-white">Sua Identidade</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-1 md:col-span-2 space-y-1">
                                    <label className="text-[10px] font-mono text-[#666] uppercase tracking-widest pl-1">E-mail de Acesso</label>
                                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="nome@email.com" className="w-full bg-[#0a0a0a] border border-[#222] focus:border-primary px-4 py-3 outline-none text-white transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-[#666] uppercase tracking-widest pl-1">Senha (Criar Conta)</label>
                                    <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Mín. 6 caracteres" className="w-full bg-[#0a0a0a] border border-[#222] focus:border-primary px-4 py-3 outline-none text-white transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-[#666] uppercase tracking-widest pl-1">CPF</label>
                                    <input value={cpf} onChange={e => setCpf(e.target.value)} type="text" placeholder="000.000.000-00" className="w-full bg-[#0a0a0a] border border-[#222] focus:border-primary px-4 py-3 outline-none text-white transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-[#666] uppercase tracking-widest pl-1">Nome Completo</label>
                                    <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Como quer ser chamado?" className="w-full bg-[#0a0a0a] border border-[#222] focus:border-primary px-4 py-3 outline-none text-white transition-colors" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-[#666] uppercase tracking-widest pl-1">WhatsApp</label>
                                    <input value={phone} onChange={e => setPhone(e.target.value)} type="text" placeholder="(11) 90000-0000" className="w-full bg-[#0a0a0a] border border-[#222] focus:border-primary px-4 py-3 outline-none text-white transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Payment */}
                        {!isSubscription && (
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-6 h-6 border border-primary text-primary flex items-center justify-center font-display text-sm">2</span>
                                    <h2 className="font-heading text-xl uppercase text-white">Pagamento</h2>
                                </div>

                                <div className="flex gap-2 mb-6">
                                    <button onClick={() => setPaymentMethod("credit")}
                                        className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 border transition-all ${paymentMethod === 'credit' ? 'border-primary bg-primary/5 text-white' : 'border-[#222] bg-[#0a0a0a] text-[#666] hover:border-[#444]'} `}>
                                        <CreditCard size={24} />
                                        <span className="text-xs font-mono uppercase tracking-widest text-center">Cartão de Crédito</span>
                                    </button>
                                    <button onClick={() => setPaymentMethod("pix")}
                                        className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 border transition-all ${paymentMethod === 'pix' ? 'border-secondary bg-secondary/5 text-white' : 'border-[#222] bg-[#0a0a0a] text-[#666] hover:border-[#444]'} `}>
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M7.16 3.48c-1.37-.92-3.15-.31-3.69 1.14l-1.4 3.73c-.23.61-.13 1.28.28 1.83l3.64 4.88c.68.91 2.05.91 2.73 0l3.64-4.88c.41-.55.51-1.22.28-1.83l-1.4-3.73c-.54-1.45-2.32-2.06-3.69-1.14zm11.23 0c-1.37-.92-3.15-.31-3.69 1.14l-1.4 3.73c-.23.61-.13 1.28.28 1.83l3.64 4.88c.68.91 2.05.91 2.73 0l3.64-4.88c.41-.55.51-1.22.28-1.83l-1.4-3.73c-.54-1.45-2.32-2.06-3.69-1.14zM12 11.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                                        <span className="text-xs font-mono uppercase tracking-widest mt-1 text-center">PIX Instantâneo</span>
                                    </button>
                                </div>

                                {paymentMethod === 'credit' && (
                                    <div className="space-y-4 p-6 bg-[#0a0a0a] border border-[#222]">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono text-[#666] uppercase tracking-widest pl-1">Número do Cartão</label>
                                            <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} type="text" placeholder="0000 0000 0000 0000" className="w-full bg-[#111] border border-[#333] focus:border-primary px-4 py-3 outline-none text-white transition-colors font-mono" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-mono text-[#666] uppercase tracking-widest pl-1">Vencimento</label>
                                                <input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} type="text" placeholder="MM/AA" className="w-full bg-[#111] border border-[#333] focus:border-primary px-4 py-3 outline-none text-white transition-colors" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-mono text-[#666] uppercase tracking-widest pl-1">CVC</label>
                                                <input value={cardCvc} onChange={e => setCardCvc(e.target.value)} type="text" placeholder="123" className="w-full bg-[#111] border border-[#333] focus:border-primary px-4 py-3 outline-none text-white transition-colors" />
                                            </div>
                                        </div>
                                        <div className="space-y-1 mt-4 border-t border-[#222] pt-4">
                                            <label className="text-[10px] font-mono text-[#666] uppercase tracking-widest pl-1">Parcelamento</label>
                                            <select
                                                className="w-full bg-[#111] border border-[#333] focus:border-primary px-4 py-3 outline-none text-white transition-colors appearance-none cursor-pointer"
                                                value={installments}
                                                onChange={e => setInstallments(Number(e.target.value))}
                                            >
                                                {installmentOptions.map(num => (
                                                    <option key={num} value={num}>
                                                        {num}x de R$ {calculateInstallment(coursePrice, num).toFixed(2).replace('.', ',')} {num === 1 ? '(Sem Juros)' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'pix' && !pixData && (
                                    <div className="p-8 bg-[#0a0a0a] border border-[#222] text-center flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                                            <CheckCircle2 size={24} className="text-secondary" />
                                        </div>
                                        <h3 className="text-white font-sans font-bold mb-2">Geração de QR Code Ativa</h3>
                                        <p className="text-[#888] text-sm max-w-sm">Ao confirmar, você receberá o PIX Copia & Cola. Acesso liberado em até 10 segundos.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* PIX Success */}
                        {pixData && (
                            <div className="p-8 bg-secondary/5 border border-secondary/30 text-center flex flex-col items-center">
                                <h3 className="text-white font-sans font-bold mb-4">Escaneie para Pagar</h3>
                                <div className="bg-white p-2 rounded relative mb-4">
                                    <img src={pixData.url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${pixData.copiaECola}`} alt="PIX QR Code" className="w-48 h-48" />
                                </div >
                                <p className="text-secondary font-mono tracking-widest uppercase text-xs mt-6 animate-pulse">Aguardando Pagamento...</p>
                            </div >
                        )}

                        {/* Card Success */}
                        {
                            successMode && (
                                <div className="p-8 bg-primary/5 border border-primary/30 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="text-white font-sans font-bold text-xl mb-2">Acesso Liberado!</h3>
                                    <p className="text-[#888] text-sm max-w-sm mb-6">Pagamento processado. Bem-vindo ao XTAGE.</p>
                                    <Link href="/dashboard" className="bg-primary text-white font-bold py-3 px-8 text-sm uppercase tracking-widest hover:bg-primary/80 transition-colors inline-block w-full max-w-xs">
                                        Acessar Dashboard
                                    </Link>
                                </div>
                            )
                        }

                        {/* Submit */}
                        {
                            !pixData && !successMode && (
                                <button
                                    onClick={handleCheckout}
                                    disabled={isProcessing}
                                    className={`w-full font-bold py-5 mt-4 transition-colors flex items-center justify-center gap-2 group ${isProcessing ? 'bg-[#222] text-[#666] cursor-not-allowed' : 'bg-white text-black hover:bg-primary hover:text-white'}`}
                                >
                                    <span className="uppercase tracking-widest text-sm">
                                        {isProcessing ? "Processando..." : isSubscription ? "Assinar Agora" : "Completar Inscrição"}
                                    </span>
                                </button>
                            )
                        }

                        <p className="text-center text-[#555] text-xs font-sans mt-4 flex items-center justify-center gap-1.5"><Lock size={12} /> Pagamento 100% processado pelo Asaas.</p>
                    </div >
                </div >

                {/* Right: Order Summary */}
                < div className="w-full lg:w-[400px] shrink-0 relative z-10" >
                    <div className="sticky top-24 bg-[#0a0a0a] border border-[#222] p-6">
                        <div className="flex gap-4 mb-6">
                            <div className="w-24 h-24 bg-[#111] relative overflow-hidden border border-[#333] shrink-0">
                                {course?.thumbnail_url ? (
                                    <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url(${course.thumbnail_url})` }}></div>
                                ) : (
                                    <div className="absolute inset-0 bg-[url('/images/bg-degrade.png')] bg-cover opacity-50 sepia contrast-150"></div>
                                )}
                            </div>
                            <div className="flex flex-col justify-center">
                                <h3 className="font-heading uppercase text-xl text-white leading-tight mb-1">{course?.title}</h3>
                                <span className="text-[#888] font-sans text-xs">Por {course?.tenantName}</span>
                                <div className="flex items-center gap-2 mt-2">
                                    {isSubscription ? (
                                        <span className="bg-secondary/10 text-secondary text-[10px] font-mono px-2 py-0.5 flex items-center gap-1"><Repeat size={8} /> Mensal</span>
                                    ) : (
                                        <span className="bg-primary/10 text-primary text-[10px] font-mono px-2 py-0.5">Vitalício</span>
                                    )}
                                    {(course?.materialsCount ?? 0) > 0 && (
                                        <span className="bg-white/5 text-[#888] text-[10px] font-mono px-2 py-0.5 flex items-center gap-1"><FileText size={8} /> {course?.materialsCount}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-[#1a1a1a] py-6 space-y-4">
                            <div className="flex justify-between items-center text-sm font-sans text-[#888]">
                                <span>{isSubscription ? 'Mensalidade' : 'Valor do Treinamento'}</span>
                                <span>R$ {coursePrice.toFixed(2).replace('.', ',')}</span>
                            </div>
                            {!isSubscription && (
                                <div className="flex justify-between items-center text-sm font-sans text-[#888]">
                                    <span>Juros</span>
                                    {paymentMethod === 'pix' || installments === 1 ? (
                                        <span className="text-secondary font-mono tracking-widest uppercase text-[10px] px-2 py-0.5 border border-secondary/30 bg-secondary/10">Isento</span>
                                    ) : (
                                        <span>R$ {(totalChargeAmount - coursePrice).toFixed(2).replace('.', ',')}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-[#222] pt-6 flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[#666] font-mono text-[10px] uppercase tracking-widest mb-1">
                                    {isSubscription ? 'Recorrência mensal' : paymentMethod === 'credit' && installments > 1 ? `Total em ${installments}x` : 'Total a vista'}
                                </span>
                                <span className="text-white font-display text-4xl">
                                    R$ {totalChargeAmount.toFixed(2).replace('.', ',')}
                                </span>
                                {isSubscription && <span className="text-secondary text-xs font-mono">/mês</span>}
                            </div>
                        </div>
                    </div>
                </div >
            </div >
        </div >
    );
}
