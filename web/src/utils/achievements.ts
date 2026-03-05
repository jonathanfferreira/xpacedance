import { createClient } from '@supabase/supabase-js';


export interface UserMetadata {
    achievements_claimed?: string[];
    [key: string]: unknown;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    claimed: boolean;
    xp: number;
}

export async function getUserAchievements(userId: string, userMetadata: UserMetadata) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [
        { count: completedLessons },
        { data: xpHistory },
        { data: progressData },
        { data: leaderboard },
    ] = await Promise.all([
        supabase.from('progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),
        supabase.from('user_xp_history').select('amount').eq('user_id', userId),
        supabase.from('progress').select('lesson_id, completed, completed_at, lessons!inner(course_id, module_name)').eq('user_id', userId).eq('completed', true),
        supabase.from('leaderboard_weekly').select('user_id').order('weekly_xp', { ascending: false }).limit(10),
    ]);

    const totalXP = (xpHistory || []).reduce((sum: number, h: { amount: number }) => sum + h.amount, 0);
    const completedCount = completedLessons || 0;
    const inTop10 = (leaderboard || []).some((r: { user_id: string }) => r.user_id === userId);

    // Check streak
    const completionDates = (progressData || [])
        .filter((p: { completed_at: string | null }) => p.completed_at)
        .map((p: { completed_at: string }) => new Date(p.completed_at).toDateString());
    const uniqueDays = [...new Set(completionDates)].sort();
    let maxStreak = 0;
    let currentStreak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
        const prev = new Date(uniqueDays[i - 1]);
        const curr = new Date(uniqueDays[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
        else currentStreak = 1;
    }
    if (uniqueDays.length === 1) maxStreak = 1;

    const claimedIds: string[] = userMetadata?.achievements_claimed || [];

    const achievements: Achievement[] = [
        {
            id: 'primeira-aula',
            name: 'Primeira Aula',
            description: 'Completou sua primeira aula',
            unlocked: completedCount >= 1,
            claimed: claimedIds.includes('primeira-aula'),
            xp: 25,
        },
        {
            id: 'sequencia-fogo',
            name: 'Sequência de Fogo',
            description: '7 dias seguidos treinando',
            unlocked: maxStreak >= 7,
            claimed: claimedIds.includes('sequencia-fogo'),
            xp: 75,
        },
        {
            id: 'em-ritmo',
            name: 'Em Ritmo',
            description: 'Completou 5 aulas',
            unlocked: completedCount >= 5,
            claimed: claimedIds.includes('em-ritmo'),
            xp: 50,
        },
        {
            id: 'dedicado',
            name: 'Dedicado',
            description: 'Completou 20 aulas',
            unlocked: completedCount >= 20,
            claimed: claimedIds.includes('dedicado'),
            xp: 150,
        },
        {
            id: 'top-10',
            name: 'Top 10 Semanal',
            description: 'Entrou no ranking Top 10 da semana',
            unlocked: inTop10,
            claimed: claimedIds.includes('top-10'),
            xp: 250,
        },
        {
            id: 'mestre-xp',
            name: 'Mestre do XP',
            description: 'Acumulou 1.000 XP ou mais',
            unlocked: totalXP >= 1000,
            claimed: claimedIds.includes('mestre-xp'),
            xp: 100,
        },
        {
            id: 'maratonista',
            name: 'Maratonista',
            description: 'Completou 30 aulas de treino',
            unlocked: completedCount >= 30,
            claimed: claimedIds.includes('maratonista'),
            xp: 200,
        },
        {
            id: 'lenda-xp',
            name: 'Lenda do XP',
            description: 'Acumulou 5.000 XP Globais',
            unlocked: totalXP >= 5000,
            claimed: claimedIds.includes('lenda-xp'),
            xp: 500,
        },
        {
            id: 'foco-diamante',
            name: 'Foco de Diamante',
            description: '14 dias seguidos de treinamento',
            unlocked: maxStreak >= 14,
            claimed: claimedIds.includes('foco-diamante'),
            xp: 300,
        },
    ];

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return { achievements, totalXP, unlockedCount };
}
