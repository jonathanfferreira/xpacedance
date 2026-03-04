import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function getSupabaseAndTenant() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase, user: null, tenant: null }

    const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    return { supabase, user, tenant }
}

// GET /api/xtore/products/[id]
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { supabase, user, tenant } = await getSupabaseAndTenant()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const { id } = await params

    const { data: product, error } = await supabase
        .from('xtore_products')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .single()

    if (error || !product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    return NextResponse.json({ product })
}

// PATCH /api/xtore/products/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { supabase, user, tenant } = await getSupabaseAndTenant()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const { id } = await params
    const body = await request.json()

    const allowed = ['name', 'description', 'price', 'stock', 'image_url', 'category', 'is_active']
    const updateData: Record<string, unknown> = {}
    for (const key of allowed) {
        if (key in body) updateData[key] = body[key]
    }

    const { data: product, error } = await supabase
        .from('xtore_products')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .select('*')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ product })
}

// DELETE /api/xtore/products/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { supabase, user, tenant } = await getSupabaseAndTenant()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const { id } = await params

    const { error } = await supabase
        .from('xtore_products')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenant.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
