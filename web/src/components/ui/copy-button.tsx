'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="text-[#888] hover:text-white p-2 transition-colors rounded hover:bg-[#111]"
            title="Copiar Link"
        >
            {copied
                ? <Check size={16} className="text-green-500" />
                : <Copy size={16} />
            }
        </button>
    );
}
