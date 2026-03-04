import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenant_id');

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );

        let query = supabase.from('xtore_products').select('*');
        if (tenantId) query = query.eq('tenant_id', tenantId);

        // Default only active unless specifically fetched by admin
        query = query.eq('is_active', true).order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        console.error("XTORE Products GET Error:", e);
        return NextResponse.json({ error: e.message || 'Error fetching products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // 1. Validar se usuário administra essa Tenant (Escola/Professor)
        // Isso é coberto parcialmente pelo RLS no Insert, mas idealmente validamos antes.
        const { data: tenantProfile } = await supabase
            .from('tenants')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (!tenantProfile) {
            return NextResponse.json({ error: 'User does not own a Tenant.' }, { status: 403 });
        }

        const newProduct = {
            tenant_id: tenantProfile.id,
            name: body.name,
            description: body.description,
            price: body.price,
            stock: body.stock || 0,
            image_url: body.image_url || null,
            category: body.category || null,
            is_active: body.is_active !== undefined ? body.is_active : true
        };

        const { data, error } = await supabase
            .from('xtore_products')
            .insert(newProduct)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        console.error("XTORE Products POST Error:", e);
        return NextResponse.json({ error: e.message || 'Error creating product' }, { status: 500 });
    }
}
