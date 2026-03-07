import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/master/config — load platform settings
export async function GET() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userRow?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data } = await supabase
        .from('platform_settings')
        .select('key, value')

    const settings: Record<string, string> = {}
    for (const row of data ?? []) {
        settings[row.key] = row.value
    }

    return NextResponse.json({ settings })
}

// POST /api/master/config — save platform settings
export async function POST(request: Request) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userRow?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { splitRate, xpPerLesson, pwaOffline, bunnyLibraryId } = body

    const entries = [
        { key: 'split_rate', value: String(splitRate ?? '') },
        { key: 'xp_per_lesson', value: String(xpPerLesson ?? '') },
        { key: 'pwa_offline', value: String(pwaOffline ?? '') },
        { key: 'bunny_library_id', value: String(bunnyLibraryId ?? '') },
    ].filter(e => e.value !== '')

    const { error } = await supabase
        .from('platform_settings')
        .upsert(entries, { onConflict: 'key' })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
