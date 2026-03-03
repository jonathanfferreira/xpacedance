import Link from "next/link";
import { Search, Home, LayoutDashboard } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#050505] font-sans text-white flex items-center justify-center p-6">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, #fff 60px, #fff 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, #fff 60px, #fff 61px)`,
                    }}
                />
            </div>

            <div className="relative max-w-lg w-full text-center">
                {/* 404 Display */}
                <div
                    className="text-[160px] md:text-[220px] font-display leading-none select-none mb-0"
                    style={{
                        WebkitTextStroke: "2px rgba(99,36,178,0.3)",
                        color: "transparent",
                        textShadow: "0 0 80px rgba(99,36,178,0.15)",
                    }}
                >
                    404
                </div>

                <div className="inline-block font-mono text-xs text-primary border border-primary/30 bg-primary/10 px-3 py-1 mb-6 uppercase tracking-widest -mt-6 relative z-10">
                    Página não encontrada
                </div>

                <h1 className="text-3xl md:text-4xl font-heading uppercase tracking-tight text-white mb-4">
                    Você foi longe demais
                </h1>

                <p className="text-[#888] text-sm leading-relaxed mb-10 max-w-xs mx-auto">
                    A página que você procura não existe ou foi removida.
                    Volte para o início e continue de onde parou.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 text-sm font-bold uppercase tracking-wide hover:bg-primary/80 transition-colors"
                    >
                        <LayoutDashboard size={15} />
                        Ir para o Dashboard
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 border border-[#333] text-[#888] px-6 py-3 text-sm hover:border-[#555] hover:text-white transition-colors"
                    >
                        <Home size={15} />
                        Página Inicial
                    </Link>
                </div>

                {/* Explore hint */}
                <div className="mt-10 flex items-center justify-center gap-2 text-[#444] text-xs font-mono">
                    <Search size={12} />
                    <span>Quer explorar cursos?</span>
                    <Link href="/explore" className="text-primary hover:text-white transition-colors">
                        Ver Catálogo →
                    </Link>
                </div>
            </div>
        </div>
    );
}
