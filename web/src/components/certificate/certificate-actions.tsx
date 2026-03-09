'use client';

import { useState } from 'react';
import { Download, Share2, Check } from 'lucide-react';

interface CertificateActionsProps {
    publicSlug: string | null;
}

export function CertificateActions({ publicSlug }: CertificateActionsProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        if (!publicSlug) return;
        const url = `${window.location.origin}/c/${publicSlug}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex gap-4 print:hidden">
            <button
                onClick={handleShare}
                disabled={!publicSlug}
                className="flex items-center gap-2 px-5 py-2.5 bg-black border border-[#333] hover:border-white transition-colors text-white rounded font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {copied ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}
                {copied ? 'COPIADO!' : 'COMPARTILHAR'}
            </button>
            <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-gray-200 transition-colors rounded font-bold text-sm"
            >
                <Download size={16} /> SALVAR PDF
            </button>
        </div>
    );
}
