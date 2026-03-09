'use client';

import Link from "next/link";
import Image from "next/image";
import SocialLoginButtons from "@/components/auth/social-login-buttons";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password.length < 8) {
            setError('A senha precisa ter no mínimo 8 caracteres.');
            setLoading(false);
            return;
        }

        const supabase = createClient();
        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name },
                emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
            }
        });

        if (signUpError) {
            setError(signUpError.message === 'User already registered'
                ? 'Este e-mail já possui uma conta. Faça login.'
                : signUpError.message);
            setLoading(false);
            return;
        }

        // Supabase envia email de confirmação por padrão. Mostramos feedback.
        setSuccess(true);
        setLoading(false);
    };

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
                <div className="pointer-events-none absolute inset-0 z-0">
                    <Image src="/images/bg-degrade.png" alt="XTAGE Background" fill className="object-cover opacity-50 mix-blend-screen" priority />
                </div>
                <div className="z-10 w-full max-w-md text-center">
                    <div className="bg-[#0d0d0d]/80 border border-surface rounded-2xl p-10 backdrop-blur-2xl">
                        <div className="text-5xl mb-4">📧</div>
                        <h2 className="text-white font-heading text-xl uppercase tracking-wider mb-4">Verifique Seu E-mail</h2>
                        <p className="text-[#888] text-sm mb-6">
                            Enviamos um link de confirmação para <span className="text-white font-medium">{email}</span>. Abra seu e-mail e clique no link para ativar sua conta.
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
                <Image src="/images/bg-degrade.png" alt="XTAGE Background" fill className="object-cover opacity-50 mix-blend-screen" priority />
            </div>

            <div className="z-10 w-full max-w-md relative group mt-8">
                <div className="absolute -inset-[1px] bg-gradient-neon rounded-2xl opacity-40 blur-[2px] transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"></div>

                <div className="relative bg-[#0d0d0d]/80 border border-surface rounded-2xl p-8 backdrop-blur-2xl">
                    <div className="mb-8 text-center flex flex-col items-center">
                        <div className="w-48 mb-2">
                            <Image
                                src="/images/xpace-logo-branca.png"
                                alt="XTAGE Logo"
                                width={240}
                                height={80}
                                className="w-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                priority
                            />
                        </div>
                        <h1 className="font-heading text-xl uppercase tracking-widest text-[#888888] mb-2">Criação de <span className="text-white">ID</span></h1>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2.5 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <label className="font-sans text-sm font-medium text-white/70" htmlFor="name">Nome Completo</label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ex: John Doe"
                                className="w-full bg-[#050505] border border-surface focus:border-primary rounded-lg px-4 py-3 font-sans text-white outline-none transition-colors focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="font-sans text-sm font-medium text-white/70" htmlFor="email">E-mail</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full bg-[#050505] border border-surface focus:border-secondary rounded-lg px-4 py-3 font-sans text-white outline-none transition-colors focus:ring-1 focus:ring-secondary"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="font-sans text-sm font-medium text-white/70" htmlFor="password">Senha</label>
                            <input
                                id="password"
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[#050505] border border-surface focus:border-accent rounded-lg px-4 py-3 font-sans text-white outline-none transition-colors focus:ring-1 focus:ring-accent"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative overflow-hidden rounded-lg bg-white text-black font-sans font-bold py-3 transition-transform duration-200 active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {loading ? 'PROCESSANDO...' : 'INICIAR SEQUÊNCIA'}
                                    {!loading && <Image src="/images/xpace-seta.png" alt="Seta" width={16} height={16} className="invert mix-blend-difference" />}
                                </span>
                            </button>
                        </div>
                    </form>

                    <SocialLoginButtons />

                    <div className="mt-6 text-center border-t border-surface pt-6">
                        <p className="font-sans text-sm text-[#777777]">
                            Já possui identificação?{' '}
                            <Link href="/login" className="text-white hover:text-primary transition-colors font-medium">Faça Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
