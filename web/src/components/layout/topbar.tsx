'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Menu } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NotificationBell } from './notification-bell';

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (searchQuery.trim() === '') {
                router.push('/dashboard/explore');
            } else {
                router.push(`/dashboard/explore?q=${encodeURIComponent(searchQuery)}`);
            }
        }
    };

    return (
        <header className="h-16 border-b border-[#151515] bg-[#020202]/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between gap-4">

            {/* Mobile Menu Toggle */}
            <button
                onClick={onMenuClick}
                className="md:hidden text-[#888] hover:text-white transition-colors"
            >
                <Menu size={24} />
            </button>

            {/* Command/Search Input Mock */}
            <div className="flex-1 max-w-md hidden sm:block">
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] group-focus-within:text-primary transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        placeholder="Pesquisar cursos na rede (⌘K)..."
                        className="w-full bg-[#080808] border border-[#222] focus:border-primary/50 text-white font-sans text-sm py-2 pl-10 pr-4 outline-none transition-all placeholder:text-[#444] rounded-sm focus:ring-1 focus:ring-primary/20"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <kbd className="hidden md:inline-flex bg-[#111] border border-[#333] text-[#777] rounded-sm px-1.5 py-0.5 text-[10px] font-mono">⌘</kbd>
                        <kbd className="hidden md:inline-flex bg-[#111] border border-[#333] text-[#777] rounded-sm px-1.5 py-0.5 text-[10px] font-mono">K</kbd>
                    </div>
                </div>
            </div>

            {/* Actions & Gamification */}
            <div className="flex items-center gap-6">

                {/* Gamification Stats */}
                <div className="hidden md:flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center px-4 py-1.5 bg-[#0A0A0A] border border-[#222] rounded-sm relative group cursor-pointer hover:border-secondary/30 transition-colors">
                        <span className="font-display text-lg text-secondary leading-none">1,240</span>
                        <span className="text-[8px] font-mono uppercase tracking-widest text-[#555] group-hover:text-secondary/70 transition-colors">XP Acumulado</span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-4 py-1.5 bg-[#0A0A0A] border border-[#222] rounded-sm relative group cursor-pointer hover:border-accent/30 transition-colors">
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            <span className="font-display text-lg text-accent leading-none">04</span>
                        </div>
                        <span className="text-[8px] font-mono uppercase tracking-widest text-[#555] group-hover:text-accent/70 transition-colors">Sequência (Dias)</span>
                    </div>
                </div>

                <div className="w-px h-8 bg-[#222]"></div>

                <NotificationBell />

                {/* Minimalist Profile HUD */}
                <div className="md:pl-4 md:border-l border-[#222] flex items-center gap-3 cursor-pointer group">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-white font-heading text-sm font-semibold tracking-wide">ID: 0042</span>
                        <span className="text-[#666] text-[10px] font-mono uppercase tracking-widest group-hover:text-primary transition-colors">Nível Inciante</span>
                    </div>
                    <div className="w-9 h-9 border border-[#333] bg-[#0a0a0a] flex items-center justify-center p-0.5 group-hover:border-primary/50 transition-colors shrink-0">
                        {/* Using a pseudo-avatar box for that cyberpunk mechanical feel */}
                        <div className="w-full h-full bg-[#111] flex items-center justify-center">
                            <div className="w-1/2 h-[2px] bg-[#333] mb-1"></div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
