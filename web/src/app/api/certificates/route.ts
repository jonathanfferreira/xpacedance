import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** GET /api/certificates — Lista certificados do usuário logado */
export async function GET() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { data, error } = await supabase
        .from('certificates')
        .select('id, issued_at, public_slug, completion_pct, courses!course_id(title, thumbnail_url), tenants!tenant_id(name, logo_url, brand_color)')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ certificates: data });
}

/** POST /api/certificates — Tenta emitir certificado para um curso */
export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { courseId } = body;
    if (!courseId) return NextResponse.json({ error: 'courseId obrigatório' }, { status: 400 });

    // Chama função do DB para emitir certificado se 100% completo
    const { data: certId, error } = await supabaseAdmin
        .rpc('emit_certificate_if_complete', {
            p_user_id: user.id,
            p_course_id: courseId,
        });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!certId) return NextResponse.json({ issued: false, message: 'Curso não 100% completo' });

    // Busca dados do certificado emitido
    const { data: cert } = await supabaseAdmin
        .from('certificates')
        .select('id, public_slug, issued_at, courses!course_id(title), tenants!tenant_id(name)')
        .eq('id', certId)
        .single();

    return NextResponse.json({ issued: true, certificate: cert });
}
