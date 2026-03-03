import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { Trophy } from 'lucide-react';

interface LeaderboardRow {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    weekly_xp: number;
    rank: number;
}

async function getLeaderboard(): Promise<LeaderboardRow[]> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
        .from('leaderboard_weekly')
        .select('user_id, full_name, avatar_url, weekly_xp')
        .order('weekly_xp', { ascending: false })
        .limit(10);

    return (data || []).map((row: any, i: number) => ({ ...row, rank: i + 1 }));
}

async function getCurrentUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

export async function LeaderboardWeekly() {
    const [leaderboard, currentUserId] = await Promise.all([getLeaderboard(), getCurrentUserId()]);

    if (leaderboard.length === 0) {
        return (
            <div className="bg-[#0A0A0A] border border-[#222] rounded-sm p-6 w-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <Trophy size={20} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="font-heading text-xl uppercase tracking-widest text-white">Top 10 da Semana</h2>
                        <p className="text-[10px] font-sans text-[#666]">Ranking reinicia todo domingo meia-noite</p>
                    </div>
                </div>
                <p className="text-[#555] text-sm text-center py-8">Nenhum dado de XP ainda. Complete aulas para aparecer aqui!</p>
            </div>
        );
    }

    return (
        <div className="bg-[#0A0A0A] border border-[#222] rounded-sm p-6 w-full">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <Trophy size={20} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="font-heading text-xl uppercase tracking-widest text-white">Top 10 da Semana</h2>
                        <p className="text-[10px] font-sans text-[#666]">Ranking reinicia todo domingo meia-noite</p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                {leaderboard.map((user) => {
                    const isCurrentUser = user.user_id === currentUserId;
                    const rankColor = user.rank === 1 ? 'text-yellow-400' : user.rank === 2 ? 'text-gray-300' : user.rank === 3 ? 'text-amber-600' : 'text-[#555]';
                    const initials = (user.full_name || 'AN').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                    return (
                        <div
                            key={user.user_id}
                            className={`flex items-center gap-4 p-3 rounded-sm transition-colors ${isCurrentUser ? 'bg-primary/10 border border-primary/30' : 'bg-[#111] border border-transparent hover:border-[#333]'}`}
                        >
                            <div className={`w-8 font-display text-2xl text-center ${rankColor}`}>
                                {user.rank}
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center font-heading text-white border border-[#333] shrink-0 relative overflow-hidden">
                                {user.rank === 1 && <div className="absolute inset-0 bg-yellow-400/20" />}
                                {user.avatar_url ? (
                                    <Image src={user.avatar_url} alt={initials} fill className="object-cover" unoptimized />
                                ) : (
                                    <span className="relative z-10 text-sm">{initials}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-heading text-sm uppercase ${isCurrentUser ? 'text-primary drop-shadow-[0_0_8px_#6324b2]' : 'text-white'}`}>
                                    {user.full_name || 'Anônimo'} {isCurrentUser && '(Você)'}
                                </h4>
                            </div>
                            <div className="text-right">
                                <span className={`font-display text-xl ${isCurrentUser ? 'text-secondary drop-shadow-[0_0_10px_#eb00bc]' : 'text-white'}`}>
                                    {user.weekly_xp.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-mono text-[#666] uppercase tracking-widest block -mt-1">XP</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
