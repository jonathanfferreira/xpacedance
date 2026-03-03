'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

type Provider = 'google' | 'apple'

export default function SocialLoginButtons() {
    const [loading, setLoading] = useState<Provider | null>(null)

    const handleOAuth = async (provider: Provider) => {
        setLoading(provider)
        const supabase = createClient()

        // Use env var only - never fallback to window.location.origin to prevent open redirect
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        if (!siteUrl) {
            console.error('NEXT_PUBLIC_SITE_URL is not configured.')
            setLoading(null)
            return
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${siteUrl}/auth/callback`,
            },
        })

        if (error) {
            console.error(`OAuth ${provider} error:`, error.message)
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

            {/* Apple Button - Official Style */}
            <button
                type="button"
                onClick={() => handleOAuth('apple')}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 rounded-lg border border-[#333333] bg-black hover:bg-[#111111] text-white font-sans font-medium py-3 px-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading === 'apple' ? (
                    <LoadingSpinner />
                ) : (
                    <svg width="18" height="20" viewBox="0 0 17 20" fill="currentColor">
                        <path d="M13.15 10.41c-.02-2.08 1.7-3.09 1.78-3.14-0.97-1.42-2.48-1.61-3.01-1.63-1.28-.13-2.5.75-3.15.75-.65 0-1.66-.73-2.73-.71-1.41.02-2.7.82-3.43 2.07-1.46 2.54-.37 6.3 1.05 8.36.7 1.01 1.53 2.14 2.62 2.1 1.05-.04 1.45-.68 2.72-.68 1.27 0 1.64.68 2.74.66 1.13-.02 1.85-1.03 2.54-2.05.8-1.17 1.13-2.3 1.15-2.36-.03-.01-2.2-.85-2.28-3.37zM11.07 3.93c.58-.7.97-1.68.86-2.65-.83.03-1.84.55-2.44 1.25-.53.62-1 1.61-.87 2.56.93.07 1.87-.47 2.45-1.16z" />
                    </svg>
                )}
                <span className="text-sm">Continuar com Apple</span>
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
