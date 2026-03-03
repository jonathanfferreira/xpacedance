import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateCsrf } from '@/utils/csrf';
import { logAuditEvent } from '@/utils/audit';

export async function POST(req: Request) {
    try {
        // CSRF validation
        const csrfError = validateCsrf(req);
        if (csrfError) {
            return NextResponse.json({ error: 'Requisição inválida.' }, { status: 403 });
        }

        // Auth guard: verify caller is admin
        const cookieStore = await cookies();
        const authSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() }, setAll() { } } }
        );
        const { data: { user } } = await authSupabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
        }
        const role = user.app_metadata?.role || user.user_metadata?.role || 'aluno';
        if (role !== 'admin') {
            return NextResponse.json({ error: "Acesso negado. Apenas admin pode enviar push." }, { status: 403 });
        }

        const body = await req.json();
        const { title, text, url } = body;

        webpush.setVapidDetails(
            'mailto:suporte@xtage.app',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!
        );

        // Service role client for reading all push subscriptions
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll() { return cookieStore.getAll() }, setAll() { } } }
        );

        const { data: subs, error } = await supabase.from('push_subscriptions').select('*');
        if (error || !subs) throw new Error("Erro ao buscar subscriptions: " + error?.message);

        const payload = JSON.stringify({
            title: title || 'XTAGE',
            body: text || 'Temos uma novidade para você!',
            url: url || '/'
        });

        const promises = subs.map(sub => {
            const pushConfig = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };
            return webpush.sendNotification(pushConfig, payload).catch(e => {
                if (e.statusCode === 410 || e.statusCode === 404) {
                    supabase.from('push_subscriptions').delete().eq('id', sub.id).then();
                }
            });
        });

        await Promise.allSettled(promises);

        // Audit log
        await logAuditEvent(user.id, 'push_broadcast_sent', 'push_subscriptions', undefined, {
            title: title || 'XTAGE',
            recipientCount: subs.length,
        });

        return NextResponse.json({ success: true, sentCount: subs.length });
    } catch (e: any) {
        console.error('Push Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
