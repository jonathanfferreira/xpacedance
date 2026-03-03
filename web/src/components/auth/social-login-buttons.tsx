'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

type Provider = 'google'

export default function SocialLoginButtons() {
    const [loading, setLoading] = useState<Provider | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleOAuth = async (provider: Provider) => {
        setLoading(provider)
        setError(null)
        const supabase = createClient()

        // Fallback para window.location.origin em dev caso a variável não esteja configurada
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${siteUrl}/auth/callback`,
            },
        })

        if (error) {
            console.error(`OAuth ${provider} error:`, error.message)
            setError('Falha ao conectar com Google. Tente novamente.')
            setLoading(null)
        }
    }

    return (
        <div className="space-y-3">
            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
                <div className="h-px flex-1 bg-surface" />
                <span className="font-sans text-xs text-[#555555] uppercase tracking-widest">ou continue com</span>
                <div className="h-px flex-1 bg-surface" />
            </div>

            {error && (
                <div className="text-red-500 text-xs text-center font-sans bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                    {error}
                </div>
            )}

            {/* Google Button - Official Style */}
            <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-[#333333] bg-white hover:bg-gray-50 text-[#1f1f1f] font-sans font-medium py-3 px-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading === 'google' ? (
                    <LoadingSpinner />
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                )}
                <span className="text-sm">Continuar com Google</span>
            </button>

        </div>
    )
}

function LoadingSpinner() {
    return (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}
