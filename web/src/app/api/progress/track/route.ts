import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// XP por nível de dificuldade da aula
const XP_BY_DIFFICULTY: Record<string, number> = {
    beginner: 30,
    intermediate: 50,
    advanced: 80,
    master: 120,
};

export async function POST(req: Request) {
    try {
        const { lessonId, progressPercent } = await req.json();

        if (!lessonId) {
            return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
        }

        // Threshold de 90% para marcar como concluída
        if (progressPercent < 90) {
            return NextResponse.json({ status: 'ignored_ping', message: 'Progresso insuficiente para XP' }, { status: 200 });
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verifica se já foi concluída (evita XP duplo)
        const { data: existingProgress } = await supabase
            .from('progress')
            .select('id, completed, xp_awarded')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .single();

        if (existingProgress?.completed) {
            return NextResponse.json({ status: 'already_completed', xp_awarded: existingProgress.xp_awarded }, { status: 200 });
        }

        // Busca a dificuldade da aula para calcular XP dinâmico
        const { data: lesson } = await supabase
            .from('lessons')
            .select('difficulty')
            .eq('id', lessonId)
            .single();

        const difficulty = lesson?.difficulty ?? 'beginner';
        const xpAmount = XP_BY_DIFFICULTY[difficulty] ?? 50;

        // Registra o progresso com XP dinâmico
        const { data: newProgress, error } = await supabase
            .from('progress')
            .upsert({
                user_id: user.id,
                lesson_id: lessonId,
                completed: true,
                completed_at: new Date().toISOString(),
                xp_awarded: xpAmount,
                difficulty,
            }, { onConflict: 'user_id, lesson_id' })
            .select()
            .single();

        if (error) throw error;

        // Atualiza o XP total do usuário
        await supabase.rpc('increment_user_xp', { p_user_id: user.id, p_xp: xpAmount });

        // Atualiza o streak (chama função DB)
        const { data: streakData } = await supabase.rpc('update_streak', { p_user_id: user.id });
        const streak = streakData?.[0];

        return NextResponse.json({
            status: 'success',
            xp_earned: xpAmount,
            difficulty,
            lessonId: newProgress.lesson_id,
            streak: {
                current: streak?.current_streak ?? 1,
                longest: streak?.longest_streak ?? 1,
                is_new_record: streak?.is_new_record ?? false,
            },
        }, { status: 200 });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('API /progress/track Error:', error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
