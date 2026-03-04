import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabaseAndUser() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    return { supabase, user }
}

// GET /api/studio/courses/[id] — fetch course + lessons
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { supabase, user } = await getSupabaseAndUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single()
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const { data: course, error } = await supabase
        .from('courses')
        .select('id, title, description, price, pricing_type, thumbnail_url, is_published, category, created_at')
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single()

    if (error || !course) return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })

    const { data: lessons } = await supabase
        .from('lessons')
        .select('id, module_name, title, description, video_id, order_index')
        .eq('course_id', id)
        .order('module_name', { ascending: true })
        .order('order_index', { ascending: true })

    return NextResponse.json({ course, lessons: lessons || [] })
}

// PATCH /api/studio/courses/[id] — update course fields
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { supabase, user } = await getSupabaseAndUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single()
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const allowed = ['is_published', 'title', 'description', 'price', 'pricing_type', 'thumbnail_url', 'category']
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
        if (key in body) updateData[key] = body[key]
    }

    const { data: course, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .select('id, title, is_published, price, pricing_type, description, category')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ course })
}

// DELETE /api/studio/courses/[id] — delete a course
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { supabase, user } = await getSupabaseAndUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).single()
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
