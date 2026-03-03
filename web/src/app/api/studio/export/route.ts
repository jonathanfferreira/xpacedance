import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verifica que é owner de um tenant
    const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('owner_id', user.id)
        .single();

    if (!tenant) {
        return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 });
    }

    const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .eq('tenant_id', tenant.id);

    const courseIds = (courses || []).map(c => c.id);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type') || 'enrollments';

    let rows: any[] = [];
    let headers: string[] = [];

    if (type === 'enrollments' || !type) {
        // Exporta matrículas
        const { data } = await supabase
            .from('enrollments')
            .select('created_at, status, courses:course_id(title), users:user_id(full_name, email)')
            .in('course_id', courseIds.length > 0 ? courseIds : ['_none_'])
            .order('created_at', { ascending: false })
            .limit(2000);

        rows = (data || []).map((e: any) => ({
            data: new Date(e.created_at).toLocaleDateString('pt-BR'),
            aluno: e.users?.full_name || '',
            email: e.users?.email || '',
            curso: e.courses?.title || '',
            status: e.status,
        }));
        headers = ['data', 'aluno', 'email', 'curso', 'status'];
    } else if (type === 'transactions') {
        // Exporta transações financeiras
        const { data } = await supabase
            .from('transactions')
            .select('created_at, amount, status, payment_method, courses:course_id(title), users:user_id(full_name, email)')
            .in('course_id', courseIds.length > 0 ? courseIds : ['_none_'])
            .order('created_at', { ascending: false })
            .limit(2000);

        rows = (data || []).map((t: any) => ({
            data: new Date(t.created_at).toLocaleDateString('pt-BR'),
            aluno: t.users?.full_name || '',
            email: t.users?.email || '',
            curso: t.courses?.title || '',
            valor: Number(t.amount).toFixed(2),
            metodo: t.payment_method || '',
            status: t.status,
        }));
        headers = ['data', 'aluno', 'email', 'curso', 'valor', 'metodo', 'status'];
    }

    if (format === 'csv') {
        const csvLines = [
            headers.join(';'),
            ...rows.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(';')),
        ];
        const csv = csvLines.join('\r\n');
        const filename = `xpace-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store',
            },
        });
    }

    return NextResponse.json({ rows, count: rows.length });
}
