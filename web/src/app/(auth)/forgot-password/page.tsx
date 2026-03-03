'use client';

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const supabase = createClient();
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
        if (!siteUrl) {
            setError('Configuração do site incompleta. Contate o suporte.');
            setLoading(false);
            return;
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${siteUrl}/auth/callback?next=/dashboard/config`,
        });

        if (resetError) {
            setError(resetError.message);
            setLoading(false);
            return;
        }

        setSent(true);
        setLoading(false);
    };

    if (sent) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
                <div className="pointer-events-none absolute inset-0 z-0">
                    <Image src="/images/bg-degrade.png" alt="BG" fill className="object-cover opacity-50 mix-blend-screen" priority />
                </div>
                <div className="z-10 w-full max-w-md text-center">
                    <div className="bg-[#0d0d0d]/80 border border-surface rounded-2xl p-10 backdrop-blur-2xl">
                        <div className="text-5xl mb-4">🔑</div>
                        <h2 className="text-white font-heading text-xl uppercase tracking-wider mb-4">Link Enviado</h2>
                        <p className="text-[#888] text-sm mb-6">
                            Se o e-mail <span className="text-white font-medium">{email}</span> estiver cadastrado, um link de redefinição de senha foi enviado. Verifique sua caixa de entrada e spam.
                        </p>
                        <Link href="/login" className="text-primary hover:text-white transition-colors font-medium text-sm">← Voltar ao Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-0 z-0">
                <Image src="/images/bg-degrade.png" alt="BG" fill className="object-cover opacity-50 mix-blend-screen" priority />
            </div>

            <div className="z-10 w-full max-w-md relative group mt-8">
                <div className="absolute -inset-[1px] bg-gradient-neon rounded-2xl opacity-40 blur-[2px] transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"></div>

                <div className="relative bg-[#0d0d0d]/80 border border-surface rounded-2xl p-8 backdrop-blur-2xl">
                    <div className="mb-8 text-center flex flex-col items-center">
                        <div className="w-48 mb-2">
                            <Image src="/images/xpace-logo-branca.png" alt="XPACE Logo" width={240} height={80} className="w-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" priority />
                        </div>
                        <h1 className="font-heading text-xl uppercase tracking-widest text-[#888888] mb-2">Recuperar <span className="text-white">Acesso</span></h1>
                        <p className="text-[#555] text-xs font-sans">Insira seu e-mail cadastrado para receber o link de redefinição.</p>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2.5 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleReset} className="space-y-6">
                        <div className="space-y-2">
                            <label className="font-sans text-sm font-medium text-white/70" htmlFor="email">E-mail</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full bg-[#050505] border border-surface focus:border-primary rounded-lg px-4 py-3.5 font-sans text-white placeholder:text-[#555555] outline-none transition-colors duration-300 focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative overflow-hidden rounded-lg bg-white text-black font-sans font-bold py-3.5 transition-transform duration-200 active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'ENVIANDO...' : 'ENVIAR LINK DE RECUPERAÇÃO'}
                        </button>
                    </form>

                    <div className="mt-6 text-center border-t border-surface pt-6">
                        <Link href="/login" className="font-sans text-sm text-[#777] hover:text-white transition-colors">← Voltar ao Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
