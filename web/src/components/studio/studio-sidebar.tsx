'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
    LayoutDashboard,
    PlaySquare,
    Users,
    Settings,
    UploadCloud,
    LogOut,
    Menu,
    X,
    TrendingUp, // Analytics
    Award, // Assinaturas/Planos
    Link as LinkIcon, // Afiliados
    ShoppingBag, // Loja
    ExternalLink,
    Wallet, // Financeiro
    Film,
    CreditCard, // Still needed for the old 'Assinaturas' line if not fully replaced
    GraduationCap, // Still needed for 'Alunos'
    Globe, // Still needed for 'Domínios'
    Landmark, // Para Configurações de Pagamentos
    ChevronRight // Still needed for the UI
} from 'lucide-react';

export function StudioSidebar({ isOpen, onClose, tenant }: { isOpen?: boolean, onClose?: () => void, tenant?: any }) {
    const pathname = usePathname();

    const links = [
        { href: '/studio', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/studio/cursos', label: 'Cursos & Aulas', icon: Film },
        { href: '/studio/loja', label: 'Minha Loja', icon: ShoppingBag },
        { href: '/studio/alunos', label: 'Alunos', icon: GraduationCap },
        { href: '/studio/analytics', label: 'Analytics', icon: TrendingUp },
        // Novidades
        { href: '/studio/assinaturas', label: 'Planos & Assinaturas', icon: Award },
        { href: '/studio/afiliados', label: 'Gestão de Afiliados', icon: LinkIcon },
        { href: '/studio/financeiro', label: 'Financeiro', icon: Wallet },

        // Configurações
        { href: '/studio/configuracoes/aparencia', label: 'Aparência', icon: Settings },
        { href: '/studio/configuracoes/pagamentos', label: 'Setup Recebíveis', icon: Landmark },
        { href: '/studio/configuracoes/dominio', label: 'Domínios', icon: Globe },
    ];

    const brandColor = tenant?.brand_color || '#6324b2';

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
                w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] h-screen flex flex-col fixed md:relative z-50 shrink-0 transition-transform duration-300
            `}>
                {/* Header School Logo */}
                <div className="p-6 border-b border-[#1a1a1a] flex items-center gap-3">
                    {tenant?.logo_url ? (
                        <div className="w-9 h-9 rounded overflow-hidden relative shrink-0 border border-[#333]">
                            <Image src={tenant.logo_url} alt={tenant.name || ''} fill className="object-cover" />
                        </div>
                    ) : (
                        <div
                            className="w-9 h-9 rounded flex items-center justify-center shrink-0 border"
                            style={{ backgroundColor: brandColor + '20', borderColor: brandColor + '50' }}
                        >
                            <span className="font-bold font-heading text-lg" style={{ color: brandColor }}>
                                {(tenant?.name || 'XP').substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <h2 className="text-white font-heading font-bold uppercase tracking-wide leading-none text-sm truncate">
                            {tenant?.name || 'Studio'}
                        </h2>
                        <p className="text-[#666] text-[10px] font-mono uppercase tracking-widest mt-1 truncate">
                            {tenant?.slug ? `xtage.app/${tenant.slug}` : 'Sua Escola'}
                        </p>
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
                                onClick={onClose}
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
                            onClick={onClose}
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
        </>
    );
}
