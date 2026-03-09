import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// POST /api/courses/enroll — enroll user in a course
export async function POST(request: Request) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { course_id } = body

    if (!course_id) {
        return NextResponse.json({ error: 'course_id é obrigatório' }, { status: 400 })
    }

    // Get course info
    const { data: course, error: courseErr } = await supabase
        .from('courses')
        .select('id, price, pricing_type, is_published, tenant_id')
        .eq('id', course_id)
        .single()

    if (courseErr || !course) {
        return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
    }

    if (!course.is_published) {
        return NextResponse.json({ error: 'Este curso não está publicado' }, { status: 400 })
    }

    // Check if already enrolled
    const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_id', course_id)
        .eq('user_id', user.id)
        .maybeSingle()

    if (existing) {
        return NextResponse.json({ error: 'Você já está matriculado neste curso', enrollment: existing }, { status: 200 })
    }

    // For paid courses, we would redirect to payment first
    // For now, handle free courses and one_time (direct enrollment for testing)
    const isPaid = course.pricing_type !== 'free' && Number(course.price) > 0

    if (isPaid) {
        // Cursos pagos devem passar pelo checkout Asaas.
        // O frontend deve redirecionar o usuário para a página de checkout.
        return NextResponse.json({
            requires_payment: true,
            course_id: course.id,
            price: course.price,
            checkout_url: `/checkout/${course.id}`,
        }, { status: 402 })
    }

    // Free enrollment
    const { data: enrollment, error: enrollErr } = await supabase
        .from('enrollments')
        .insert({
            user_id: user.id,
            course_id: course_id,
            status: 'active',
        })
        .select('id')
        .single()

    if (enrollErr) {
        return NextResponse.json({ error: 'Erro ao realizar matrícula. Tente novamente.' }, { status: 500 })
    }

    // Award XP for enrollment (non-critical — log failure but don't block response)
    const { error: xpError } = await supabase.from('user_xp_history').insert({
        user_id: user.id,
        xp_amount: 50,
        source: 'enrollment',
        description: `Matrícula no curso`,
    });
    if (xpError) {
        console.error('[ENROLL] Falha ao registrar XP (não-crítico):', xpError.message);
    }

    // Notify the course creator about the new enrollment
    try {
        const { data: courseInfo } = await supabase
            .from('courses')
            .select('title, tenant_id, tenants!inner(owner_id)')
            .eq('id', course_id)
            .single()

        if (courseInfo && (courseInfo.tenants as any)?.owner_id) {
            const { data: studentInfo } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', user.id)
                .single()

            // Notify the course creator about the new enrollment
            await supabase.rpc('create_notification', {
                p_user_id: (courseInfo.tenants as any).owner_id,
                p_title: 'Nova Matrícula! 🎉',
                p_message: `${studentInfo?.full_name || 'Um aluno'} se matriculou no curso "${courseInfo.title}".`,
                p_type: 'enrollment',
                p_link_url: '/studio',
                p_tenant_id: courseInfo.tenant_id,
            });

            // Notify the student (Welcome message)
            await supabase.rpc('create_notification', {
                p_user_id: user.id,
                p_title: `Bem-vindo ao ${courseInfo.title}! 🎬`,
                p_message: 'Sua jornada começa agora. Clique aqui para assistir sua primeira aula!',
                p_type: 'success',
                p_link_url: `/course/${course_id}`,
                p_tenant_id: courseInfo.tenant_id,
            });
        }
    } catch (notifErr) {
        console.error('[ENROLL] Notification error (non-critical):', notifErr)
    }

    return NextResponse.json({ enrollment, message: 'Matrícula realizada com sucesso!' }, { status: 201 })
}
