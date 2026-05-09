import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;
const RESERVED = ['admin', 'master', 'studio', 'dashboard', 'explore', 'login', 'register', 'api', 'xpace dance', 'suporte', 'help', 'about', 'terms', 'privacidade'];

// GET /api/users/username?username=tonmoraes → { available: boolean, message?: string }
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.toLowerCase().trim();

    if (!username) {
        return NextResponse.json({ available: false, message: 'Username obrigatório.' }, { status: 400 });
    }

    if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json({
            available: false,
            message: 'Use apenas letras minúsculas, números e _ (3–30 caracteres).'
        });
    }

    if (RESERVED.includes(username)) {
        return NextResponse.json({ available: false, message: 'Este nome está reservado.' });
    }

    const { data } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

    return NextResponse.json({ available: !data });
}

// PATCH /api/users/username → atualiza o username do usuário logado
export async function PATCH(request: Request) {
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

    const body = await request.json();
    const username = body.username?.toLowerCase().trim();

    if (!username || !USERNAME_REGEX.test(username)) {
        return NextResponse.json({ error: 'Username inválido.' }, { status: 400 });
    }

    if (RESERVED.includes(username)) {
        return NextResponse.json({ error: 'Este nome está reservado.' }, { status: 400 });
    }

    // Check availability (excluding the current user)
    const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .maybeSingle();

    if (existing) {
        return NextResponse.json({ error: 'Username já em uso.' }, { status: 409 });
    }

    const { error } = await supabaseAdmin
        .from('users')
        .update({ username })
        .eq('id', user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, username });
}
