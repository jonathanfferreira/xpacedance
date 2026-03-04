import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateCsrf } from '@/utils/csrf'

async function getAuthenticatedUser() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    return { supabase, user }
}

// GET /api/studio/courses — list courses owned by current user's tenant
export async function GET() {
    const { supabase, user } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find tenant owned by this user
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!tenant) return NextResponse.json({ courses: [] })

    // Fetch courses with lesson counts
    const { data: courses, error } = await supabase
        .from('courses')
        .select(`
            id, title, description, price, thumbnail_url, is_published, pricing_type, created_at,
            lessons(id, module_name)
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Count modules and lessons per course
    const enriched = (courses || []).map((c: any) => {
        const lessons = c.lessons || []
        const modules = new Set(lessons.map((l: any) => l.module_name)).size
        return {
            id: c.id,
            title: c.title,
            description: c.description,
            price: c.price,
            thumbnail_url: c.thumbnail_url,
            is_published: c.is_published,
            pricing_type: c.pricing_type,
            created_at: c.created_at,
            lesson_count: lessons.length,
            module_count: modules,
        }
    })

    return NextResponse.json({ courses: enriched })
}

// POST /api/studio/courses — create a new course
export async function POST(request: Request) {
    const csrfError = validateCsrf(request)
    if (csrfError) return NextResponse.json({ error: 'Requisição inválida.' }, { status: 403 })

    const { supabase, user } = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify role
    const { data: dbUser } = await supabase.from('users').select('role, full_name').eq('id', user.id).single() as { data: { role: string; full_name: string | null } | null }
    const role = dbUser?.role || 'aluno'
    if (!['professor', 'escola', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, price, pricing_type, category } = body

    if (!title || !price) {
        return NextResponse.json({ error: 'title e price são obrigatórios' }, { status: 400 })
    }
    if (Number(price) < 39.90) {
        return NextResponse.json({ error: 'Preço mínimo é R$ 39,90' }, { status: 400 })
    }

    // Find or create tenant for this user
    let { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!tenant) {
        // Auto-gera slug único a partir do nome do usuário
        const rawName = dbUser?.full_name || 'criador'
        const baseSlug = rawName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .substring(0, 24)
        const slug = `${baseSlug}-${Date.now().toString(36)}`

        const { data: newTenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
                owner_id: user.id,
                name: dbUser?.role === 'admin' ? 'XTAGE Admin' : 'Minha Escola',
                slug,
            })
            .select('id, slug')
            .single()
        if (tenantError) return NextResponse.json({ error: tenantError.message }, { status: 500 })
        tenant = newTenant
    }

    const { data: course, error } = await supabase
        .from('courses')
        .insert({
            tenant_id: tenant!.id,
            title: title.trim(),
            description: description?.trim() || null,
            price: Number(price),
            pricing_type: pricing_type || 'one_time',
            category: category || null,
            is_published: false,
        })
        .select('id, title')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ course }, { status: 201 })
}
