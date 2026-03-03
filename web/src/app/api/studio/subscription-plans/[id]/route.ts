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

async function verifyPlanOwnership(planId: string, userId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
        .from("subscription_plans")
        .select("id, tenants!inner(owner_id)")
        .eq("id", planId)
        .single();

    if (!data) return false;
    const tenant = (data as unknown as { tenants: { owner_id: string } }).tenants;
    return tenant?.owner_id === userId;
}

// PATCH /api/studio/subscription-plans/[id]
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const isOwner = await verifyPlanOwnership(id, user.id);
    if (!isOwner) {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    let rawBody: unknown;
    try {
        rawBody = await request.json();
    } catch {
        return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const result = subscriptionPlanSchema.partial().safeParse(rawBody);
    if (!result.success) {
        return NextResponse.json(
            { error: "Dados inválidos.", details: result.error.flatten().fieldErrors },
            { status: 422 }
        );
    }

    const { data, error } = await supabaseAdmin
        .from("subscription_plans")
        .update(result.data)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plan: data });
}

// DELETE /api/studio/subscription-plans/[id]
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const isOwner = await verifyPlanOwnership(id, user.id);
    if (!isOwner) {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const { error } = await supabaseAdmin
        .from("subscription_plans")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
