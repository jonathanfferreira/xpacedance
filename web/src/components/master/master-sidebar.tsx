'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Building2,
    Users,
    DollarSign,
    Settings,
    LogOut,
    ShieldAlert,
    BookOpen,
    ChevronRight
} from 'lucide-react';

export function MasterSidebar({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) {
    const pathname = usePathname();

    const links = [
        { href: '/master', label: 'Panorama Geral', icon: LayoutDashboard },
        { href: '/master/escolas', label: 'Escolas & Professores', icon: Building2 },
        { href: '/master/cursos', label: 'Catálogo de Cursos', icon: BookOpen },
        { href: '/master/financeiro', label: 'Hub Financeiro (Asaas)', icon: DollarSign },
        { href: '/master/alunos', label: 'Alunos Globais', icon: Users },
        { href: '/master/seguranca', label: 'Auditoria & Logs', icon: ShieldAlert },
        { href: '/master/suporte', label: 'Suporte & Eventos', icon: Settings },
        { href: '/master/config', label: 'Engine da Plataforma', icon: Settings },
    ];

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
                w-64 bg-[#0a0a0a] border-r border-red-500/20 h-screen flex flex-col fixed md:relative z-50 shrink-0 transition-transform duration-300
            `}>
                <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-red-500/20 to-transparent"></div>

                {/* Header Master Logo */}
                <div className="p-6 border-b border-[#1a1a1a] flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded bg-red-500/20 border border-red-500 flex items-center justify-center">
                        <span className="text-red-500 font-bold font-heading text-lg">XP</span>
                    </div>
                    <div>
                        <h2 className="text-white font-heading font-bold uppercase tracking-wide leading-none">Admin</h2>
                        <p className="text-[#666] text-xs font-mono uppercase tracking-widest mt-1">Super Usuário</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 flex flex-col gap-2 relative z-10">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onClose}
                                className={`
                                flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 group relative overflow-hidden
                                ${isActive ? 'bg-[#1a1a1a] text-white' : 'text-[#888] hover:bg-[#111] hover:text-[#bbb]'}
                            `}
                            >
                                {isActive && <div className="absolute left-0 top-0 h-full w-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>}
                                <Icon size={18} className={isActive ? 'text-red-500' : 'group-hover:text-red-500/50'} />
                                <span className="font-sans text-sm font-medium">{link.label}</span>
                                {isActive && <ChevronRight size={14} className="ml-auto text-[#444]" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-[#1a1a1a] relative z-10">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 text-[#666] hover:text-white transition-colors"
                    >
                        <LogOut size={16} />
                        <span className="font-sans text-xs">Sair do Modo Master</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
