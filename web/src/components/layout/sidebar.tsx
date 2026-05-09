'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, PlaySquare, Award, User, Settings, LogOut, BarChart3, Rocket, Compass, Handshake, Smartphone, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
    const pathname = usePathname();
    useEffect(() => {
        // Tenants validation logic moved to creator studio module
    }, []);

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                    onClick={onClose}
                ></div>
            )}
            <aside className={`
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                w-[240px] md:w-[80px] md:hover:w-[240px] transition-all duration-300 group h-screen bg-[#020202] border-r border-[#151515] flex flex-col fixed left-0 top-0 z-50
            `}>

                {/* Brand Icon / Logo */}
                <div className="h-16 flex items-center justify-center border-b border-[#151515] overflow-hidden">
                    <div className="w-8 shrink-0 flex items-center justify-center opacity-100 md:group-hover:opacity-0 transition-opacity absolute">
                        <Image src="/images/xpace-logo-branca.png" alt="X" width={24} height={24} className="object-contain" />
                    </div>
                    <div className="w-[180px] shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex justify-center ml-2 relative">
                        <Image src="/images/xpace-logo-branca.png" alt="XPACE" width={120} height={32} className="object-contain" />
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto no-scrollbar">

                    <SidebarItem href="/dashboard" icon={<Home size={20} />} label="Home" active={pathname === '/dashboard'} onClick={onClose} />
                    <SidebarItem href="/dashboard/explore" icon={<Compass size={20} />} label="Navegar Cursos" active={pathname?.startsWith('/dashboard/explore')} onClick={onClose} />
                    <SidebarItem href="/dashboard/cursos" icon={<PlaySquare size={20} />} label="Meus Acessos" active={pathname?.startsWith('/dashboard/cursos')} onClick={onClose} />
                    <SidebarItem href="/dashboard/comunidade" icon={<User size={20} />} label="Comunidade" active={pathname?.startsWith('/dashboard/comunidade')} onClick={onClose} />
                    <SidebarItem href="/dashboard/afiliados" icon={<Handshake size={20} />} label="Parcerias" active={pathname?.startsWith('/dashboard/afiliados')} onClick={onClose} />
                    <SidebarItem href="/dashboard/xtore" icon={<ShoppingBag size={20} />} label="XTORE" active={pathname?.startsWith('/dashboard/xtore')} onClick={onClose} />
                    <SidebarItem href="/dashboard/conquistas" icon={<Award size={20} />} label="Conquistas" active={pathname?.startsWith('/dashboard/conquistas')} onClick={onClose} />
                    <SidebarItem href="/dashboard/ranking" icon={<BarChart3 size={20} />} label="Ranking" active={pathname?.startsWith('/dashboard/ranking')} onClick={onClose} />

                    <div className="my-4 border-t border-[#1a1a1a] mx-2"></div>
                    <div className="px-4 text-[10px] uppercase tracking-widest text-[#444] font-display opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity mb-2">Sistema</div>

                    <SidebarItem href="/dashboard/perfil" icon={<User size={20} />} label="Identidade" active={pathname?.startsWith('/dashboard/perfil')} onClick={onClose} />
                    <SidebarItem href="/dashboard/config" icon={<Settings size={20} />} label="Configuração" active={pathname?.startsWith('/dashboard/config')} onClick={onClose} />

                    <div className="my-4 border-t border-[#1a1a1a] mx-2"></div>
                    <div className="px-4 text-[10px] uppercase tracking-widest text-[#444] font-display opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity mb-2">Criador</div>

                    <SidebarItem href="/dashboard/partner" icon={<Rocket size={20} />} label="Seja um Professor" active={pathname?.startsWith('/dashboard/partner')} onClick={onClose} />
                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-[#151515] flex flex-col gap-2">
                    <button
                        onClick={() => { localStorage.removeItem('xpace-pwa-dismissed'); window.location.reload(); }}
                        className="w-full flex items-center p-3 rounded bg-transparent hover:bg-primary/10 text-primary transition-colors relative overflow-hidden group/btn border border-transparent hover:border-primary/30"
                    >
                        <span className="w-5 shrink-0 flex justify-center z-10">
                            <Smartphone size={20} />
                        </span>
                        <span className="ml-4 font-sans text-sm font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 tracking-wide">
                            Instalar App
                        </span>
                    </button>

                    <button
                        onClick={async () => {
                            const { createClient } = await import('@/utils/supabase/client');
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                        }}
                        className="w-full flex items-center p-3 rounded bg-transparent hover:bg-[#1a0505] text-[#555] hover:text-[#ff3300] transition-colors relative overflow-hidden group/btn border border-transparent hover:border-[#330a0a]">
                        <span className="w-5 shrink-0 flex justify-center z-10">
                            <LogOut size={20} />
                        </span>
                        <span className="ml-4 font-sans text-sm font-medium opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 tracking-wide">
                            Encerrar Sessão
                        </span>

                        {/* Subtle glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff3300]/[0.05] to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    </button>
                </div>
            </aside>
        </>
    );
}

function SidebarItem({ href, icon, label, active = false, onClick }: { href: string; icon: React.ReactNode; label: string; active?: boolean, onClick?: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`
        flex items-center p-3 rounded group/link relative overflow-hidden transition-all duration-300
        ${active ? 'bg-[#0a0a0a] border border-[#222]' : 'bg-transparent border border-transparent hover:bg-[#0a0a0a] hover:border-[#1a1a1a]'}
      `}
        >
            {/* Active Indicator Bar */}
            {active && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary glow-primary"></div>
            )}

            {/* Icon */}
            <span className={`w-5 shrink-0 flex justify-center z-10 transition-colors ${active ? 'text-primary' : 'text-[#666] group-hover/link:text-white'}`}>
                {icon}
            </span>

            {/* Label */}
            <span className={`
        ml-4 font-sans text-sm font-medium opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-10 tracking-wide
        ${active ? 'text-white' : 'text-[#888] group-hover/link:text-[#ddd]'}
      `}>
                {label}
            </span>

            {/* Subtle hover effect from accent color */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#6324b2]/0 to-[#6324b2]/[0.02] opacity-0 group-hover/link:opacity-100 transition-opacity"></div>
        </Link>
    );
}
