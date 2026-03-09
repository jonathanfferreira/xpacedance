import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createBunnyVideo } from '@/utils/bunny'

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single()
        const isAuthorized = dbUser?.role === 'professor' || dbUser?.role === 'escola' || dbUser?.role === 'admin'
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Você precisa ser um Criador (Professor/Escola) para fazer upload.' }, { status: 403 })
        }

        // Get the tenant's Bunny collection for organized video storage
        const { data: tenant } = await supabase
            .from('tenants')
            .select('bunny_collection_id')
            .eq('owner_id', user.id)
            .single()

        const body = await request.json()
        const { title } = body;

        // Create video in the tenant's collection (or root if no collection)
        const data = await createBunnyVideo(
            title || 'Nova Aula XTAGE',
            tenant?.bunny_collection_id || null
        );

        const videoId = data.guid;
        const libraryId = process.env.BUNNY_VIDEO_LIBRARY_ID || process.env.BUNNY_LIBRARY_ID;
        const accessKey = process.env.BUNNY_API_KEY || process.env.BUNNY_ACCESS_KEY;

        // Generate TUS Authentication Signature for browser-to-CDN direct upload
        // Formula: SHA256(library_id + api_key + expiration_time + video_id)
        const expirationTime = Math.floor(Date.now() / 1000) + (60 * 60 * 24); // 24h validity
        const signatureString = `${libraryId}${accessKey}${expirationTime}${videoId}`;
        const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

        return NextResponse.json({
            videoId,
            libraryId,
            signature,
            expirationTime
        })
    } catch (e: any) {
        console.error("Error creating bunny video:", e)
        return NextResponse.json({ error: e.message || 'Server Exception' }, { status: 500 })
    }
}
