'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Film, LogOut, UploadCloud, ChevronRight, BarChart3, CreditCard, GraduationCap, Palette, Globe, Handshake } from 'lucide-react';

export function StudioSidebar() {
    const pathname = usePathname();

    const links = [
        { href: '/studio', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/studio/cursos', label: 'Cursos & Aulas', icon: Film },
        { href: '/studio/assinaturas', label: 'Assinaturas', icon: CreditCard },
        { href: '/studio/alunos', label: 'Alunos', icon: GraduationCap },
        { href: '/studio/afiliados', label: 'Afiliados', icon: Handshake },
        { href: '/studio/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/studio/configuracoes/aparencia', label: 'Aparência', icon: Palette },
        { href: '/studio/configuracoes/dominio', label: 'Domínios', icon: Globe },
    ];

    return (
        <aside className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] h-screen flex flex-col shrink-0">
            {/* Header School Logo */}
            <div className="p-6 border-b border-[#1a1a1a] flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/20 border border-primary flex items-center justify-center">
                    <span className="text-primary font-bold font-heading text-lg">XP</span>
                </div>
                <div>
                    <h2 className="text-white font-heading font-bold uppercase tracking-wide leading-none">Studio</h2>
                    <p className="text-[#666] text-xs font-mono uppercase tracking-widest mt-1">Sua Escola</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 flex flex-col gap-2">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 group relative overflow-hidden
                                ${isActive ? 'bg-[#1a1a1a] text-white' : 'text-[#888] hover:bg-[#111] hover:text-[#bbb]'}
                            `}
                        >
                            {isActive && <div className="absolute left-0 top-0 h-full w-[2px] bg-primary glow-primary"></div>}
                            <Icon size={18} className={isActive ? 'text-primary' : 'group-hover:text-[#aaa]'} />
                            <span className="font-sans text-sm font-medium">{link.label}</span>
                            {isActive && <ChevronRight size={14} className="ml-auto text-[#444]" />}
                        </Link>
                    );
                })}

                <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
                    <Link
                        href="/studio/upload"
                        className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded transition-colors"
                    >
                        <UploadCloud size={18} />
                        <span className="font-mono text-xs font-bold uppercase tracking-wider">Novo Vídeo</span>
                    </Link>
                </div>
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-[#1a1a1a]">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2 text-[#666] hover:text-white transition-colors"
                >
                    <LogOut size={16} />
                    <span className="font-sans text-xs">Voltar para Dashboard</span>
                </Link>
            </div>
        </aside>
    );
}
