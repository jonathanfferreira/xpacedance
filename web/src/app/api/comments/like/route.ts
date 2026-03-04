import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Usa Service Role para alterar o Like Count de forma segura (Bypass RLS no update)
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { comment_id, action } = body; // action: 'like' | 'unlike'

        if (!comment_id || !action) {
            return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
        }

        if (action === 'like') {
            // Tenta dar like
            const { error: likeError } = await supabase
                .from('comment_likes')
                .insert({ comment_id, user_id: user.id });

            // Se der erro de duplicate key (já curtiu), ignorar
            if (likeError && likeError.code !== '23505') throw likeError;

            // Incrementa
            if (!likeError) {
                await supabaseAdmin.rpc('increment_likes', { target_comment_id: comment_id });
            }

            return NextResponse.json({ success: true, liked: true });
        } else {
            // Remove Like
            const { error: unlikeError, count } = await supabase
                .from('comment_likes')
                .delete({ count: 'exact' })
                .eq('comment_id', comment_id)
                .eq('user_id', user.id);

            if (unlikeError) throw unlikeError;

            // Decrementa só se de fato deletou algo
            if (count && count > 0) {
                await supabaseAdmin.rpc('decrement_likes', { target_comment_id: comment_id });
            }

            return NextResponse.json({ success: true, liked: false });
        }

    } catch (error: any) {
        console.error("Erro ao dar like:", error.message);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
