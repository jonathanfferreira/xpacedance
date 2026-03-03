import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const domainSchema = z.object({
    domain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, 'Domínio inválido (ex: alunos.minhaescola.com)'),
});

export async function GET() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // Busca o tenant do usuário logado
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

    if (!tenant) return NextResponse.json({ domains: [] });

    const { data: domains, error } = await supabase
        .from('tenant_domains')
        .select('id, domain, verified, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ domains: domains || [] });
}

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    try {
        const body = await request.json();
        const parsed = domainSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }
        const { domain } = parsed.data;

        const { data: tenant } = await supabase
            .from('tenants')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (!tenant) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });

        const { error } = await supabase
            .from('tenant_domains')
            .insert({
                tenant_id: tenant.id,
                domain: domain.toLowerCase(),
                verified: false, // Na vida real exigiria webhook/crontab para checar DNS
            });

        if (error) {
            if (error.code === '23505') return NextResponse.json({ error: 'Domínio já cadastrado no sistema.' }, { status: 400 });
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

}

export async function DELETE(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('id');
    if (!domainId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single();
    if (!tenant) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

    const { error } = await supabase
        .from('tenant_domains')
        .delete()
        .eq('id', domainId)
        .eq('tenant_id', tenant.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
