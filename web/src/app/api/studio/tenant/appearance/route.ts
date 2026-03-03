import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const appearanceSchema = z.object({
    name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hifens.').min(3),
    brand_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Cor inválida (deve ser Hex)'),
    logo_url: z.string().url('URL da logo inválida').optional().or(z.literal('')),
});

export async function PATCH(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    try {
        const body = await request.json();
        const parsed = appearanceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }
        const data = parsed.data;

        // Atualiza o tenant pertencente ao usuário
        const { data: updatedTenant, error } = await supabase
            .from('tenants')
            .update({
                name: data.name,
                slug: data.slug,
                brand_color: data.brand_color,
                logo_url: data.logo_url || null,
            })
            .eq('owner_id', user.id)
            .select('id')
            .single();

        if (error) {
            if (error.code === '23505') { // unique violation (slug)
                return NextResponse.json({ error: 'Este slug (URL) já está em uso.' }, { status: 400 });
            }
            throw error;
        }

        if (!updatedTenant) {
            return NextResponse.json({ error: 'Tenant não encontrado ou sem permissão.' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Erro interno ao atualizar aparência' }, { status: 500 });
    }
}
