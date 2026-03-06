import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'



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

        if (authHeader !== BUNNY_WEBHOOK_SECRET) {
            console.warn('[BUNNY WEBHOOK] Token de autenticacao invalido ou ausente.')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { VideoGuid, Status, Length } = body

        // Bunny.net Webhook statuses: 3 = Finished, 4 = Error, 5 = Error, 6  = Error
        console.log(`[BUNNY WEBHOOK] Event trigger Video: ${VideoGuid} | Status Code: ${Status}`);

        if (Status === 3) {
            if (VideoGuid) {
                await supabaseAdmin.from('lessons').update({
                    status: 'published', // Altera de 'processing' / 'draft' para 'published'
                    duration: Length || 0 // Captura os Segundos
                }).eq('video_id', VideoGuid)

                console.log(`[BUNNY WEBHOOK] Sucesso. Banco de dados sincronizado para o VideoID: ${VideoGuid}.`)
            }
        } else if (Status === 4 || Status === 5 || Status === 6) {
            if (VideoGuid) {
                await supabaseAdmin.from('lessons').update({ status: 'failed' }).eq('video_id', VideoGuid)
                console.error(`[BUNNY WEBHOOK] Falha de Encode/Transcodificação recebida pela Nuvem pro VideoID: ${VideoGuid}.`)
            }
        }

        return NextResponse.json({ received: true })
    } catch (e) {
        console.error("Bunny webhook processing logic error:", e)
        return NextResponse.json({ error: 'Falha processando webhook da BunnyCDN' }, { status: 500 })
    }
}
