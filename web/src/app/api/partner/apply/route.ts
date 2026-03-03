import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/utils/rate-limit'
import { validateCsrf } from '@/utils/csrf'

export async function POST(request: Request) {
    // CSRF validation
    const csrfError = validateCsrf(request);
    if (csrfError) {
        return NextResponse.json({ error: 'Requisição inválida.' }, { status: 403 });
    }

    // Rate limit: max 3 partner applications per minute per IP
    const ip = getClientIp(request);
    const { limited } = rateLimit(`partner:${ip}`, 3);
    if (limited) {
        return NextResponse.json(
            { error: 'Muitas tentativas. Tente novamente em 1 minuto.' },
            { status: 429, headers: { 'Retry-After': '60' } }
        );
    }

    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { get: (name) => cookieStore.get(name)?.value } }
        )

        // 1. Validar a Sessão
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 2. Coletar os dados do Formulário
        const body = await request.json()
        const { schoolName, instagram, videoUrl } = body

        if (!schoolName || !instagram) {
            return NextResponse.json({ error: 'Nome da Escola e Instagram são obrigatórios.' }, { status: 400 })
        }

        // 3. Checar se ele já tem uma aplicação
        const { data: existingApp } = await supabase
            .from('tenants')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (existingApp) {
            return NextResponse.json({ error: 'Você já possui uma aplicação enviada ou uma Escola Ativa.' }, { status: 400 })
        }

        // 4. Inserir Inquilino no Banco (Ainda Pendente)
        const { error: insertError } = await supabase.from('tenants').insert({
            owner_id: user.id,
            name: schoolName,
            instagram: instagram,
            video_url: videoUrl,
            status: 'pending' // Ainda precisa ser aprovado via /master
        })

        if (insertError) {
            console.error("Partner Application DB Error:", insertError)
            return NextResponse.json({ error: 'Falha gravando solicitação no Banco de Dados.' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'Application submitted successfully.' })
    } catch (e: any) {
        console.error("Error creating partner application:", e)
        return NextResponse.json({ error: e.message || 'Server Exception' }, { status: 500 })
    }
}
