import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lesson_id');

    if (!lessonId) {
        return NextResponse.json({ error: 'lesson_id é obrigatório.' }, { status: 400 });
    }

    try {
        // Fetch top-level comments first
        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
                id, 
                content, 
                created_at, 
                likes_count:likes, 
                parent_id,
                user_id,
                users:user_id(full_name, avatar_url)
            `)
            .eq('lesson_id', lessonId)
            .is('parent_id', null)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch replies manually or deeply nest? Deep nesting in supabase works up to 1 level easily.
        // Let's just fetch all comments for the lesson and build the tree in JS.
        const { data: allComments, error: allError } = await supabase
            .from('comments')
            .select(`
                id, 
                content, 
                created_at, 
                likes_count:likes, 
                parent_id,
                user_id,
                users:user_id(full_name, avatar_url)
            `)
            .eq('lesson_id', lessonId)
            .order('created_at', { ascending: true }); // older replies first

        if (allError) throw allError;

        // Get user session to see what they liked
        const { data: { user } } = await supabase.auth.getUser();
        let userLikes = new Set<string>();

        if (user) {
            const { data: likes } = await supabase
                .from('comment_likes')
                .select('comment_id')
                .eq('user_id', user.id);

            if (likes) {
                userLikes = new Set(likes.map(l => l.comment_id));
            }
        }

        // Build tree
        const commentMap = new Map<string, any>();
        const roots: any[] = [];

        // Format and map
        allComments.forEach(c => {
            const formatted = {
                ...c,
                currentUserLiked: userLikes.has(c.id),
                replies: []
            };
            commentMap.set(c.id, formatted);
        });

        // Assemble
        allComments.forEach(c => {
            const formatted = commentMap.get(c.id);
            if (c.parent_id) {
                const parent = commentMap.get(c.parent_id);
                if (parent) {
                    parent.replies.push(formatted);
                }
            } else {
                roots.push(formatted);
            }
        });

        // Sort roots by descending (newest first for main threads)
        roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({ comments: roots });
    } catch (error: any) {
        console.error("Erro ao buscar comentários:", error.message);
        return NextResponse.json({ error: 'Falha ao buscar comentários' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { } // Ignorado no Server Component
                },
            }
        }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Você precisa estar logado para comentar.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { lesson_id, content, parent_id } = body;

        if (!lesson_id || !content) {
            return NextResponse.json({ error: 'Aulas e conteúdo são obrigatórios.' }, { status: 400 });
        }

        if (content.trim().length === 0) {
            return NextResponse.json({ error: 'O comentário não pode ser vazio.' }, { status: 400 });
        }

        // Verifica se o usuário tem acesso ao curso desta aula
        const { data: lesson } = await supabase
            .from('lessons')
            .select('course_id, courses(pricing_type, price)')
            .eq('id', lesson_id)
            .single();

        if (lesson) {
            // Professores, escolas e admins podem sempre comentar
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            const isCreatorOrAdmin = ['professor', 'escola', 'admin'].includes(userData?.role);

            if (!isCreatorOrAdmin) {
                const isPaidCourse = (lesson.courses as any)?.pricing_type !== 'free' && Number((lesson.courses as any)?.price) > 0;
                if (isPaidCourse) {
                    const { data: enrollment } = await supabase
                        .from('enrollments')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('course_id', lesson.course_id)
                        .eq('status', 'active')
                        .maybeSingle();

                    if (!enrollment) {
                        return NextResponse.json({ error: 'Você precisa estar matriculado no curso para comentar.' }, { status: 403 });
                    }
                }
            }
        }

        // Enviar comentário
        const { data: newComment, error } = await supabase
            .from('comments')
            .insert({
                lesson_id,
                user_id: user.id,
                content: content.trim(),
                parent_id: parent_id || null
            })
            .select(`
                id, 
                content, 
                created_at, 
                likes_count:likes, 
                parent_id,
                user_id,
                users:user_id(full_name, avatar_url)
            `)
            .single();

        if (error) throw error;

        // If it's a reply, notify the original comment author
        if (parent_id) {
            try {
                const { data: parentComment } = await supabase
                    .from('comments')
                    .select('user_id, lesson_id, tenants(id)')
                    .eq('id', parent_id)
                    .single();

                if (parentComment && parentComment.user_id !== user.id) {
                    await supabase.rpc('create_notification', {
                        p_user_id: parentComment.user_id,
                        p_title: 'Novo comentário! 💬',
                        p_message: `${user.user_metadata?.full_name || 'Alguém'} respondeu ao seu comentário.`,
                        p_type: 'info',
                        p_link_url: `/course/lesson/${lesson_id}`, // Adjust link logic as needed
                        p_tenant_id: (parentComment as any).tenants?.id
                    });
                }
            } catch (replyNotifErr) {
                console.error('[COMMENT] Reply notification error:', replyNotifErr);
            }
        }

        return NextResponse.json({ comment: { ...newComment, replies: [], currentUserLiked: false } });
    } catch (error: any) {
        console.error("Erro ao enviar comentário:", error.message);
        return NextResponse.json({ error: 'Falha ao comentar' }, { status: 500 });
    }
}
