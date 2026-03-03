import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Award, Medal, Trophy, Star, Flame } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function RankingScreen() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [myXp, setMyXp] = useState(0);
    const [myStreak, setMyStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState(null);

    const loadLeaderboard = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            // Tenta buscar da view leaderboard_weekly (se existir)
            // Fallback para tabela users ordenada por XP
            const { data: rankData, error } = await supabase
                .from('users')
                .select('id, full_name, xp, avatar_url')
                .order('xp', { ascending: false })
                .limit(20);

            if (error) throw error;

            const withRank = (rankData || []).map((u, i) => ({
                ...u,
                rank: i + 1,
                isMe: u.id === user.id,
            }));

            setLeaderboard(withRank);

            // Dados pessoais
            const me = withRank.find(u => u.isMe);
            if (me) {
                setMyRank(me.rank);
                setMyXp(me.xp || 0);
            }

            // Busca streak
            const { data: streakData } = await supabase
                .from('user_streaks')
                .select('current_streak')
                .eq('user_id', user.id)
                .single();
            if (streakData) setMyStreak(streakData.current_streak || 0);

        } catch (err) {
            console.error('RankingScreen error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

    const onRefresh = () => {
        setRefreshing(true);
        loadLeaderboard();
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Trophy color="#ffbd2e" size={24} />;
        if (rank === 2) return <Medal color="#C0C0C0" size={24} />;
        if (rank === 3) return <Award color="#CD7F32" size={24} />;
        return <Text className="text-[#555] font-bold text-lg font-mono">#{rank}</Text>;
    };

    if (loading) {
        return (
            <View className="flex-1 bg-black items-center justify-center">
                <ActivityIndicator color="#6324b2" size="large" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            {/* Topbar */}
            <View className="px-6 pt-16 pb-4 bg-[#050505] border-b border-[#222]">
                <View className="flex-row items-center gap-3">
                    <Award color="#eb00bc" size={24} />
                    <Text className="text-white font-bold text-2xl uppercase tracking-widest">Global Rank</Text>
                </View>
                <Text className="text-[#888] text-xs uppercase tracking-widest mt-1">Top da Semana</Text>
            </View>

            {/* Destaque pessoal */}
            <View className="bg-gradient-to-r from-primary/20 to-black px-6 py-6 border-b border-primary/30">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-white text-[10px] uppercase font-bold tracking-widest bg-primary/20 px-2 py-0.5 rounded-sm border border-primary/50 self-start mb-2">
                            Sua Posição
                        </Text>
                        <View className="flex-row items-end gap-2">
                            <Text className="text-white font-bold text-5xl tracking-tighter">
                                #{myRank || '–'}
                            </Text>
                            <Text className="text-[#ffbd2e] font-bold mb-2 uppercase tracking-widest">
                                / {myXp.toLocaleString('pt-BR')} XP
                            </Text>
                        </View>
                    </View>
                    {myStreak > 0 && (
                        <View className="items-center bg-[#111] border border-[#333] px-4 py-3 rounded-md">
                            <Flame color="#eb00bc" size={24} />
                            <Text className="text-[#eb00bc] font-bold text-2xl mt-1">{myStreak}</Text>
                            <Text className="text-[#555] text-[10px] font-mono uppercase">streak</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Listagem */}
            <ScrollView
                className="flex-1 px-6 pt-6 pb-20"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6324b2" />}
            >
                {leaderboard.map((user) => (
                    <TouchableOpacity
                        key={user.id}
                        activeOpacity={0.8}
                        className={`flex-row items-center justify-between p-4 mb-3 rounded-md border ${user.isMe
                            ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(99,36,178,0.3)]'
                            : 'bg-[#0A0A0A] border-[#222]'
                            }`}
                    >
                        <View className="flex-row items-center gap-4">
                            <View className="w-10 h-10 items-center justify-center">
                                {getRankIcon(user.rank)}
                            </View>
                            <View>
                                <Text className={`font-bold text-base leading-tight uppercase ${user.isMe ? 'text-primary' : 'text-white'}`} numberOfLines={1}>
                                    {user.full_name || 'Anônimo'}
                                    {user.isMe ? ' (Você)' : ''}
                                </Text>
                                <View className="flex-row items-center gap-1 mt-1">
                                    <Star color="#ffbd2e" size={10} />
                                    <Text className="text-[#888] text-[10px] font-mono tracking-widest uppercase">
                                        Nível {Math.max(1, Math.floor((user.xp || 0) / 1000))}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <Text className="font-mono text-white text-sm tracking-widest">
                            {(user.xp || 0).toLocaleString('pt-BR')} XP
                        </Text>
                    </TouchableOpacity>
                ))}

                {leaderboard.length === 0 && (
                    <View className="items-center pt-16">
                        <Trophy color="#333" size={48} />
                        <Text className="text-[#555] text-center mt-4 uppercase tracking-widest text-sm">
                            Ranking ainda em formação...
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
