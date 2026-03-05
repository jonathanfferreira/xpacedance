'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Search, Menu, Play } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NotificationBell } from './notification-bell';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

function SearchInput() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
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

    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setResults([]);
                return;
            }
            setIsSearching(true);
            const supabase = createClient();

            const [{ data: coursesData }, { data: lessonsData }] = await Promise.all([
                supabase
                    .from('courses')
                    .select('id, title, tenants(name, brand_color)')
                    .eq('is_published', true)
                    .ilike('title', `%${searchQuery}%`)
                    .limit(3),
                supabase
                    .from('lessons')
                    .select('id, title, courses(title)')
                    .ilike('title', `%${searchQuery}%`)
                    .limit(3)
            ]);

            const combinedResults = [
                ...(coursesData || []).map((c: any) => ({
                    id: c.id,
                    title: c.title,
                    subtitle: (Array.isArray(c.tenants) ? c.tenants[0]?.name : c.tenants?.name) || 'Escola Invisível',
                    route: `/dashboard/cursos/${c.id}`
                })),
                ...(lessonsData || []).map((l: any) => {
                    const courseTitle = Array.isArray(l.courses) ? l.courses[0]?.title : l.courses?.title;
                    return {
                        id: l.id,
                        title: l.title,
                        subtitle: courseTitle ? `Aula: ${courseTitle}` : 'Aula Avulsa',
                        route: `/dashboard/aula/${l.id}`
                    };
                })
            ];

            setResults(combinedResults);
            setIsSearching(false);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setShowResults(false);
            if (searchQuery.trim() === '') {
                router.push('/dashboard/explore');
            } else {
                router.push(`/dashboard/explore?q=${encodeURIComponent(searchQuery)}`);
            }
        }
    };

    return (
        <div className="relative group" onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setShowResults(false);
        }}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] group-focus-within:text-primary transition-colors z-10">
                <Search size={18} />
            </div>
            <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setShowResults(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Pesquisar cursos na rede (⌘K)..."
                className="w-full bg-[#080808] border border-[#222] focus:border-primary/50 text-white font-sans text-sm py-2 pl-10 pr-4 outline-none transition-all placeholder:text-[#444] rounded-sm focus:ring-1 focus:ring-primary/20"
            />
            {showResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-[#222] rounded-sm shadow-2xl z-50 overflow-hidden">
                    {isSearching ? (
                        <div className="p-4 text-center text-xs text-[#666] uppercase tracking-widest font-mono">Buscando...</div>
                    ) : results.length > 0 ? (
                        <ul>
                            {results.map((res) => (
                                <li key={`${res.route}-${res.id}`}>
                                    <Link
                                        href={res.route}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#111] transition-colors border-b border-[#1a1a1a] last:border-0"
                                        onClick={() => setShowResults(false)}
                                    >
                                        <div className="w-8 h-8 rounded bg-[#1A1A1A] flex items-center justify-center shrink-0 border border-[#222]">
                                            <Play size={12} className="text-secondary" />
                                        </div>
                                        <div>
                                            <p className="font-heading text-sm text-white uppercase tracking-wider truncate leading-none mb-1">{res.title}</p>
                                            <p className="text-[10px] text-primary uppercase font-mono tracking-widest">{res.subtitle}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-xs text-[#666] font-sans">Nenhum curso encontrado com &quot;{searchQuery}&quot;.</div>
                    )}
                </div>
            )}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 pointer-events-none">
                <kbd className="hidden md:inline-flex bg-[#111] border border-[#333] text-[#777] rounded-sm px-1.5 py-0.5 text-[10px] font-mono">⌘</kbd>
                <kbd className="hidden md:inline-flex bg-[#111] border border-[#333] text-[#777] rounded-sm px-1.5 py-0.5 text-[10px] font-mono">K</kbd>
            </div>
        </div>
    );
}

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const [userName, setUserName] = useState('');
    const [userAvatar, setUserAvatar] = useState('');
    const [totalXp, setTotalXp] = useState(0);
    const [streakDays, setStreakDays] = useState(0);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Configurar nome e avatar
                const authMetadata = user.user_metadata || {};

                const { data } = await supabase.from('users').select('full_name').eq('id', user.id).single();
                if (data?.full_name) {
                    setUserName(data.full_name);
                } else if (authMetadata.full_name) {
                    setUserName(authMetadata.full_name);
                }

                if (authMetadata.avatar_url) {
                    setUserAvatar(authMetadata.avatar_url);
                }

                // Buscar XP total
                const { data: xpData } = await supabase
                    .from('user_xp_history')
                    .select('amount')
                    .eq('user_id', user.id);
                const xp = (xpData || []).reduce((sum, row) => sum + (row.amount || 0), 0);
                setTotalXp(xp);

                // Buscar streak (dias consecutivos com XP)
                const { data: streakData } = await supabase
                    .from('user_xp_history')
                    .select('created_at')
                    .eq('user_id', user.id)
                    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                    .order('created_at', { ascending: false });

                if (streakData && streakData.length > 0) {
                    const uniqueDays = new Set(streakData.map(r => new Date(r.created_at).toDateString()));
                    setStreakDays(uniqueDays.size);
                }
            }
        };
        fetchUser();
    }, []);

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
                <Suspense fallback={<div className="h-9 w-full bg-[#080808] border border-[#222] rounded-sm"></div>}>
                    <SearchInput />
                </Suspense>
            </div>

            {/* Actions & Gamification */}
            <div className="flex items-center gap-6">

                {/* Gamification Stats */}
                <div className="hidden md:flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center px-4 py-1.5 bg-[#0A0A0A] border border-[#222] rounded-sm relative group cursor-pointer hover:border-secondary/30 transition-colors">
                        <span className="font-display text-lg text-secondary leading-none">{totalXp.toLocaleString('pt-BR')}</span>
                        <span className="text-[8px] font-mono uppercase tracking-widest text-[#555] group-hover:text-secondary/70 transition-colors">XP Acumulado</span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-4 py-1.5 bg-[#0A0A0A] border border-[#222] rounded-sm relative group cursor-pointer hover:border-accent/30 transition-colors">
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            <span className="font-display text-lg text-accent leading-none">{String(streakDays).padStart(2, '0')}</span>
                        </div>
                        <span className="text-[8px] font-mono uppercase tracking-widest text-[#555] group-hover:text-accent/70 transition-colors">Sequência (Dias)</span>
                    </div>
                </div>

                <div className="w-px h-8 bg-[#222]"></div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <Link href="/dashboard/xtore" title="Acessar XTORE" className="hidden sm:flex items-center group relative border border-accent/20 bg-accent/5 hover:bg-accent/10 hover:border-accent/40 transition-all rounded px-3 py-1.5 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        <span className="text-accent text-xs font-heading font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,51,0,0.5)] z-10">
                            XTORE
                        </span>
                    </Link>

                    <NotificationBell />
                </div>

                {/* Minimalist Profile HUD */}
                <Link href="/dashboard/perfil" className="md:pl-4 md:border-l border-[#222] flex items-center gap-3 cursor-pointer group">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-white font-heading text-sm font-semibold tracking-wide">{userName || 'Dancer'}</span>
                    </div>
                    <div className="w-9 h-9 border border-[#333] bg-[#0a0a0a] flex items-center justify-center p-0.5 group-hover:border-primary/50 transition-colors shrink-0 overflow-hidden rounded-full">
                        {userAvatar ? (
                            <img src={userAvatar} alt={userName} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="w-full h-full bg-[#111] flex items-center justify-center rounded-full">
                                <div className="w-1/2 h-[2px] bg-[#333] mb-1"></div>
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        </header>
    );
}
