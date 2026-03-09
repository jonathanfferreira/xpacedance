'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell, CheckCheck, Trophy, DollarSign,
    Info, AlertTriangle, BookOpen, Sparkles
} from 'lucide-react';

type Notification = {
    id: string;
    title: string;
    message: string;
    type: string;
    link_url: string | null;
    read: boolean;
    created_at: string;
};

type Filter = 'all' | 'enrollment' | 'achievement' | 'revenue' | 'system';

const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'enrollment', label: 'Matrículas' },
    { key: 'achievement', label: 'Conquistas' },
    { key: 'revenue', label: 'Financeiro' },
    { key: 'system', label: 'Sistema' },
];

function iconForType(type: string) {
    switch (type) {
        case 'enrollment': return <BookOpen size={16} className="text-blue-400 shrink-0" />;
        case 'achievement': return <Trophy size={16} className="text-amber-400 shrink-0" />;
        case 'revenue': return <DollarSign size={16} className="text-[#ffbd2e] shrink-0" />;
        case 'success': return <Sparkles size={16} className="text-green-400 shrink-0" />;
        case 'warning': return <AlertTriangle size={16} className="text-orange-400 shrink-0" />;
        default: return <Info size={16} className="text-[#888] shrink-0" />;
    }
}

function typeToFilter(type: string): Filter {
    if (type === 'enrollment') return 'enrollment';
    if (type === 'achievement') return 'achievement';
    if (type === 'revenue') return 'revenue';
    return 'system';
}

function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d atrás`;
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function NotificacoesPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');
    const [marking, setMarking] = useState(false);

    const fetchNotifications = useCallback(async () => {
        const res = await fetch('/api/notifications?limit=100');
        if (res.ok) {
            const data = await res.json();
            setNotifications(data.notifications || []);
        }
    }, []);

    useEffect(() => {
        fetchNotifications().finally(() => setLoading(false));
    }, [fetchNotifications]);

    const markOne = async (id: string) => {
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAll = async () => {
        setMarking(true);
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ all: true }),
        });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setMarking(false);
    };

    const handleClick = async (n: Notification) => {
        if (!n.read) await markOne(n.id);
        if (n.link_url) router.push(n.link_url);
    };

    const filtered = filter === 'all'
        ? notifications
        : notifications.filter(n => typeToFilter(n.type) === filter);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Bell size={20} className="text-primary" />
                    <h1 className="text-lg font-heading uppercase tracking-widest text-white">
                        Notificações
                    </h1>
                    {unreadCount > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAll}
                        disabled={marking}
                        className="flex items-center gap-1.5 text-xs font-mono text-[#666] hover:text-white transition-colors disabled:opacity-50"
                    >
                        <CheckCheck size={14} />
                        Marcar todas como lidas
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap mb-6">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1 text-[10px] font-mono uppercase tracking-widest border transition-colors ${
                            filter === f.key
                                ? 'border-primary text-primary bg-primary/10'
                                : 'border-[#222] text-[#555] hover:border-[#444] hover:text-[#888]'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Lista */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-[#0a0a0a] border border-[#111] rounded animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-[#111] rounded-lg">
                    <Bell size={32} className="text-[#222] mb-4" />
                    <p className="text-[#444] text-sm font-mono uppercase tracking-widest">
                        Nenhuma notificação
                    </p>
                </div>
            ) : (
                <div className="space-y-1">
                    {filtered.map(n => (
                        <div
                            key={n.id}
                            onClick={() => handleClick(n)}
                            className={`flex items-start gap-4 p-4 border rounded-lg transition-colors cursor-pointer ${
                                n.read
                                    ? 'border-[#111] bg-transparent hover:border-[#222]'
                                    : 'border-[#1a0a2e] bg-primary/5 hover:bg-primary/10'
                            } ${n.link_url ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <div className="mt-0.5">{iconForType(n.type)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm font-semibold leading-snug ${n.read ? 'text-[#888]' : 'text-white'}`}>
                                        {n.title}
                                    </p>
                                    <span className="text-[10px] font-mono text-[#444] shrink-0 mt-0.5">
                                        {relativeTime(n.created_at)}
                                    </span>
                                </div>
                                <p className="text-[#666] text-xs mt-1 leading-relaxed">
                                    {n.message}
                                </p>
                            </div>
                            {!n.read && (
                                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
