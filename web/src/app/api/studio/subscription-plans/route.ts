import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { subscriptionPlanSchema } from "@/lib/validators";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function getTenantForUser(userId: string) {
    const { data } = await supabaseAdmin
        .from("tenants")
        .select("id")
        .eq("owner_id", userId)
        .single();
    return data;
}

// GET /api/studio/subscription-plans
export async function GET() {
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const tenant = await getTenantForUser(user.id);
    if (!tenant) {
        return NextResponse.json({ error: "Tenant não encontrado." }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
        .from("subscription_plans")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plans: data });
}

// POST /api/studio/subscription-plans
export async function POST(request: Request) {
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const tenant = await getTenantForUser(user.id);
    if (!tenant) {
        return NextResponse.json({ error: "Tenant não encontrado." }, { status: 404 });
    }

    let rawBody: unknown;
    try {
        rawBody = await request.json();
    } catch {
        return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const result = subscriptionPlanSchema.safeParse(rawBody);
    if (!result.success) {
        return NextResponse.json(
            { error: "Dados inválidos.", details: result.error.flatten().fieldErrors },
            { status: 422 }
        );
    }

    const { data, error } = await supabaseAdmin
        .from("subscription_plans")
        .insert({ ...result.data, tenant_id: tenant.id })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plan: data }, { status: 201 });
}
