"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
    useEffect(() => {
        console.error("[Error Boundary]", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#050505] font-sans text-white flex items-center justify-center p-6">
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-900/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative max-w-lg w-full text-center">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-red-500/30 bg-red-500/10 mb-8 mx-auto">
                    <AlertTriangle className="text-red-400" size={36} />
                </div>

                {/* Code badge */}
                <div className="inline-block font-mono text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-1 mb-4 uppercase tracking-widest">
                    Erro Inesperado
                </div>

                <h1 className="text-4xl md:text-5xl font-heading uppercase tracking-tight text-white mb-4">
                    Algo deu<br />
                    <span className="text-red-400">errado</span>
                </h1>

                <p className="text-[#888] text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                    Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
                    Tente novamente ou volte para o início.
                </p>

                {error.digest && (
                    <div className="font-mono text-[10px] text-[#444] mb-8">
                        ID: {error.digest}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 text-sm font-bold uppercase tracking-wide hover:bg-primary/80 transition-colors"
                    >
                        <RotateCcw size={15} />
                        Tentar Novamente
                    </button>
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 border border-[#333] text-[#888] px-6 py-3 text-sm hover:border-[#555] hover:text-white transition-colors"
                    >
                        <Home size={15} />
                        Ir para o Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
