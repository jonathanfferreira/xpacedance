import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/studio/deactivate
 * Desativa a conta de criador do professor logado.
 * - Arquiva todos os seus cursos (course_status = 'archived')
 * - Marca o tenant como 'suspended'
 * - NÃO remove enrollments existentes (alunos mantêm acesso)
 * - Reverte user.role para 'aluno'
 */
export async function POST(req: Request) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Solicitado pelo usuário';

    // 1. Buscar o tenant ativo do professor
    const { data: tenant, error: tenantErr } = await supabaseAdmin
        .from('tenants')
        .select('id, name')
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

    if (tenantErr || !tenant) {
        return NextResponse.json({ error: 'Nenhuma conta ativa de criador encontrada.' }, { status: 404 });
    }

    // 2. Verificar alunos ativos (para info ao usuário pré-confirmação)
    const { data: tenantCourses } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('tenant_id', tenant.id);

    const courseIds = (tenantCourses || []).map((c: any) => c.id);
    const { count: activeEnrollments } = courseIds.length > 0
        ? await supabaseAdmin
            .from('enrollments')
            .select('id', { count: 'exact', head: true })
            .in('course_id', courseIds)
        : { count: 0 };

    // 3. Arquivar todos os cursos do professor (bloqueia novas vendas)
    const { error: coursesErr } = await supabaseAdmin
        .from('courses')
        .update({ course_status: 'archived', is_published: false })
        .eq('tenant_id', tenant.id);

    if (coursesErr) {
        console.error('❌ Erro ao arquivar cursos:', coursesErr);
        return NextResponse.json({ error: 'Falha ao arquivar cursos.' }, { status: 500 });
    }

    // 4. Suspender o tenant (preservar dados históricos)
    await supabaseAdmin
        .from('tenants')
        .update({
            status: 'suspended',
            deactivated_at: new Date().toISOString(),
            deactivation_reason: reason,
        })
        .eq('id', tenant.id);

    // 5. Reverter role do usuário para aluno
    await supabaseAdmin
        .from('users')
        .update({ role: 'aluno' })
        .eq('id', user.id);

    console.log(`✅ Professor desativado: userId=${user.id}, tenantId=${tenant.id}, alunosAtivos=${activeEnrollments}`);

    return NextResponse.json({
        success: true,
        activeEnrollmentsPreserved: activeEnrollments,
        message: 'Conta de criador encerrada. Alunos existentes mantêm acesso aos cursos.'
    });
}

/**
 * GET /api/studio/deactivate
 * Retorna um preview do impacto da desativação (quantidade de alunos e cursos afetados).
 */
export async function GET() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('id, name')
        .eq('owner_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

    if (!tenant) {
        return NextResponse.json({ active: false });
    }

    const { data: courses } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('course_status', 'active');

    const courseIds = (courses || []).map(c => c.id);

    const { count: enrollmentCount } = courseIds.length > 0
        ? await supabaseAdmin
            .from('enrollments')
            .select('id', { count: 'exact', head: true })
            .in('course_id', courseIds)
        : { count: 0 };

    return NextResponse.json({
        active: true,
        tenantName: tenant.name,
        activeCourses: courseIds.length,
        activeStudents: enrollmentCount || 0,
    });
}
