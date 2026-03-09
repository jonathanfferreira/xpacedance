import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'



// We need the raw Supabase Service Role key to bypass RLS since this is a Server-to-Server webhook
// This ensures that Bunny doesn't get blocked when trying to update the Lesson's status via NextJS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
    try {
        // Validate webhook secret token
        const authHeader = request.headers.get('authorization') || request.headers.get('x-webhook-secret')

        const BUNNY_WEBHOOK_SECRET = process.env.BUNNY_WEBHOOK_SECRET

        if (!BUNNY_WEBHOOK_SECRET) {
            console.error('[SECURITY CRITICAL] BUNNY_WEBHOOK_SECRET is not set in the environment variables. Rejecting request.')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Timing-safe comparison para prevenir timing attack
        const headerBuf = Buffer.from(authHeader ?? '');
        const secretBuf = Buffer.from(BUNNY_WEBHOOK_SECRET);
        const tokenValid = headerBuf.length === secretBuf.length && timingSafeEqual(headerBuf, secretBuf);
        if (!tokenValid) {
            console.warn('[BUNNY WEBHOOK] Token de autenticacao invalido ou ausente.')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { VideoGuid, Status, Length } = body

        // Bunny.net Webhook statuses: 3 = Finished, 4 = Error, 5 = Error, 6  = Error

        if (Status === 3) {
            if (VideoGuid) {
                const { error: updateErr } = await supabaseAdmin
                    .from('lessons')
                    .update({ status: 'published', duration: Length || 0 })
                    .eq('video_id', VideoGuid)

                if (updateErr) {
                    console.error(`[BUNNY WEBHOOK] ⚠️ Falha ao atualizar lesson no DB para VideoID: ${VideoGuid}`, updateErr.message)
                    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
                }
            }
        } else if (Status === 4 || Status === 5 || Status === 6) {
            if (VideoGuid) {
                const { error: failErr } = await supabaseAdmin
                    .from('lessons')
                    .update({ status: 'failed' })
                    .eq('video_id', VideoGuid)

                if (failErr) {
                    console.error(`[BUNNY WEBHOOK] ⚠️ Falha ao marcar lesson como 'failed': ${VideoGuid}`, failErr.message)
                }
                console.error(`[BUNNY WEBHOOK] ❌ Encode falhou para VideoID: ${VideoGuid} (Status: ${Status}).`)
            }
        }

        return NextResponse.json({ received: true })
    } catch (e) {
        console.error("Bunny webhook processing logic error:", e)
        return NextResponse.json({ error: 'Falha processando webhook da BunnyCDN' }, { status: 500 })
    }
}
