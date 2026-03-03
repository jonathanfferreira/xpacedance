import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Retorna os dados de afiliado do usuário logado
export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenant_id');

    if (!tenantId) {
        // Se não passar tenant_id, retorna as parcerias de todas as escolas
        const { data, error } = await supabase
            .from('affiliates')
            .select('*, tenants(name, slug)')
            .eq('user_id', user.id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ affiliates: data || [] });
    }

    // Retorna a afiliação específica de uma escola
    const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .single();

    if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ affiliate: data || null });
}

// Cria uma nova afiliação para o usuário em uma escola
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
        const { tenant_id, code } = await request.json();

        if (!tenant_id || !code) {
            return NextResponse.json({ error: 'Faltam dados: tenant_id e code.' }, { status: 400 });
        }

        const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (normalizedCode.length < 5) {
            return NextResponse.json({ error: 'Código muito curto. Use ao menos 5 letras/números.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('affiliates')
            .insert({
                user_id: user.id,
                tenant_id,
                affiliate_code: normalizedCode,
                commission_pct: 15.00 // Default de 15% - a escola pode alterar via Studio
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Este código já está em uso ou você já é afiliado desta escola.' }, { status: 400 });
            }
            throw error;
        }

        return NextResponse.json({ affiliate: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Erro interno.' }, { status: 500 });
    }
}
