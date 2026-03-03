'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    link_url?: string;
    read: boolean;
    created_at: string;
}

export function NotificationBell() {
    const supabase = createClient();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications?limit=20');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error('Falha ao carregar notificações:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Inscreve no canal realtime da tabela 'notifications' para o usuário logado
        const subscription = supabase
            .channel('notifications-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        // Click outside handler
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            supabase.removeChannel(subscription);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [supabase]);

    const markAsRead = async (id: string) => {
        try {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ id }),
            });
        } catch (err) { }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ all: true }),
            });
        } catch (err) { }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return `Agora`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
        return `${Math.floor(diff / 86400)}d atrás`;
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-green-400 border-green-500/20 bg-green-500/10';
            case 'warning': return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
            case 'revenue': return 'text-[#ffbd2e] border-[#ffbd2e]/20 bg-[#ffbd2e]/10';
            case 'achievement': return 'text-secondary border-secondary/20 bg-secondary/10';
            default: return 'text-primary border-primary/20 bg-primary/10';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative text-[#666] transition-colors p-2 rounded-full hover:bg-white/5 ${isOpen ? 'text-white bg-white/5' : 'hover:text-white'}`}
            >
                <Bell size={20} className={unreadCount > 0 ? 'animate-pulse text-white' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-secondary text-[8px] font-bold text-black border border-black">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0a0a0a] border border-[#222] rounded shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-[#222] flex items-center justify-between bg-[#111]">
                        <h3 className="text-white font-bold text-xs tracking-widest uppercase font-heading">Notificações</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[#888] hover:text-white text-[10px] font-mono uppercase transition-colors flex items-center gap-1"
                            >
                                <Check size={12} />
                                Marcar lidas
                            </button>
                        )}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto divide-y divide-[#1a1a1a]">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell size={24} className="text-[#333] mx-auto mb-2" />
                                <p className="text-[#666] text-xs font-mono uppercase tracking-widest">Nenhuma notificação</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`p-4 transition-colors relative group ${n.read ? 'opacity-60 bg-transparent hover:bg-white/[0.02]' : 'bg-[#111] hover:bg-[#1a1a1a]'}`}
                                    onMouseEnter={() => !n.read && markAsRead(n.id)}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-[#333]' : 'bg-secondary animate-pulse'}`} />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className="text-white text-sm font-medium leading-tight">{n.title}</h4>
                                                <span className="text-[#666] text-[10px] font-mono whitespace-nowrap">{timeAgo(n.created_at)}</span>
                                            </div>
                                            <p className="text-[#888] text-xs mb-2 leading-snug">{n.message}</p>

                                            {n.link_url && (
                                                <Link
                                                    href={n.link_url}
                                                    onClick={() => setIsOpen(false)}
                                                    className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-[#555] hover:text-white border border-[#333] px-2 py-1 rounded transition-colors"
                                                >
                                                    <ExternalLink size={10} />
                                                    Acessar
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
