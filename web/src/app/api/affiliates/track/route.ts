import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Tracking anônimo de clique de afiliado
// URL Exemplo: /api/affiliates/track?code=JOAO2024&course_id=uuid123
export async function GET(request: NextRequest) {
    // Usamos service_role para gravar cliques sem depender de RLS
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS para gravar track de visitante não autenticado
    );

    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const courseId = searchParams.get('course_id');

        if (!code) {
            return NextResponse.json({ error: 'Código de afiliado não informado.' }, { status: 400 });
        }

        // Busca o ID do afiliado
        const { data: affiliate } = await supabaseAdmin
            .from('affiliates')
            .select('id, is_active')
            .eq('affiliate_code', code.toUpperCase())
            .single();

        if (!affiliate || !affiliate.is_active) {
            return NextResponse.json({ error: 'Afiliado inativo ou não encontrado.' }, { status: 404 });
        }

        // Tenta capturar um IP real ou fingerprint simples se existir header (isso pode variar de acordo com proxy/Vercel)
        const forwardedFor = request.headers.get('x-forwarded-for');
        const visitorIp = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

        // Evita flood: checa se esse IP já clicou nesse link nos últimos 10 minutos
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
            .from('referral_tracking')
            .select('id', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id)
            .eq('visitor_id', visitorIp)
            .gte('created_at', tenMinsAgo);

        if (count && count > 0) {
            // Já trackeou view recente, só retorna OK sem inflar a base de dados
            return NextResponse.json({ success: true, tracking: 'cached' });
        }

        // Registra o view
        await supabaseAdmin
            .from('referral_tracking')
            .insert({
                affiliate_id: affiliate.id,
                course_id: courseId || null,
                visitor_id: visitorIp,
                converted: false
            });

        return NextResponse.json({ success: true, tracking: 'recorded' });
    } catch (err: any) {
        return NextResponse.json({ error: 'Falha no tracking: ' + err.message }, { status: 500 });
    }
}
