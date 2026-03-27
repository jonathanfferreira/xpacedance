'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const COOKIE_KEY = 'xpace_cookie_consent';

/**
 * Banner de consentimento de cookies — LGPD/GDPR compliance.
 * Aparece apenas na primeira visita e pode ser aceito ou dispensado.
 */
export function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_KEY);
        if (!consent) setVisible(true);
    }, []);

    const accept = () => {
        localStorage.setItem(COOKIE_KEY, 'accepted');
        setVisible(false);
    };

    const dismiss = () => {
        localStorage.setItem(COOKIE_KEY, 'dismissed');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-label="Aviso de cookies"
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[999] bg-[#0d0d0d] border border-[#222] rounded-xl p-5 shadow-2xl shadow-black/60 backdrop-blur-md"
        >
            <button
                onClick={dismiss}
                className="absolute top-3 right-3 text-[#555] hover:text-white transition-colors"
                aria-label="Dispensar aviso"
            >
                <X size={16} />
            </button>

            <p className="text-xs text-[#888] leading-relaxed mb-4 pr-4">
                Usamos cookies essenciais para funcionamento da plataforma. Ao continuar, você concorda com nossa{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                    Política de Privacidade
                </Link>.
            </p>

            <div className="flex gap-3">
                <button
                    onClick={accept}
                    className="flex-1 py-2 bg-primary/90 hover:bg-primary text-white text-xs font-mono uppercase tracking-widest rounded-lg transition-colors"
                >
                    Aceitar
                </button>
                <button
                    onClick={dismiss}
                    className="flex-1 py-2 border border-[#333] text-[#555] hover:text-white hover:border-[#555] text-xs font-mono uppercase tracking-widest rounded-lg transition-colors"
                >
                    Apenas necessários
                </button>
            </div>
        </div>
    );
}
