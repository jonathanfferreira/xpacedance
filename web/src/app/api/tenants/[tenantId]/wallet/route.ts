import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logAuditEvent } from "@/utils/audit";
import { getClientIp } from "@/utils/rate-limit";
import { walletSchema } from "@/lib/validators";

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

// Admin client to bypass RLS for secure operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request, { params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = await params;

    // Auth guard: verify session and authorization
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() { } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // Only admin or tenant owner can create wallets
    const role = user.app_metadata?.role || user.user_metadata?.role || 'aluno';
    if (role !== 'admin') {
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('owner_id')
            .eq('id', tenantId)
            .single();
        if (!tenant || tenant.owner_id !== user.id) {
            return NextResponse.json({ error: "Acesso negado. Apenas o dono do tenant ou admin pode criar wallet." }, { status: 403 });
        }
    }

    if (!ASAAS_API_KEY) {
        return NextResponse.json({ error: "ASAAS_API_KEY não configurada." }, { status: 500 });
    }

    try {
        let rawBody: unknown;
        try {
            rawBody = await request.json();
        } catch {
            return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
        }

        // Zod validation - exige campos reais (sem hardcoded de sandbox)
        const result = walletSchema.safeParse(rawBody);
        if (!result.success) {
            return NextResponse.json(
                { error: "Dados incompletos.", details: result.error.flatten().fieldErrors },
                { status: 422 }
            );
        }

        const { pixKey, bankCode, bankAgency, bankAccount, companyType, documentCpfCnpj, name, email, phone, postalCode, address, addressNumber, province } = result.data;

        // Cria a conta base no Asaas (Subconta / White Label)
        const accountPayload = {
            name,
            email,
            loginEmail: email,
            cpfCnpj: documentCpfCnpj,
            companyType: companyType || (documentCpfCnpj.length > 11 ? "LIMITED" : undefined),
            mobilePhone: phone || undefined,
            postalCode,
            address,
            addressNumber,
            province,
        };

        const createAccountRes = await fetch(`${ASAAS_API_URL}/accounts`, {
            method: "POST",
            headers: {
                "access_token": ASAAS_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(accountPayload)
        });

        const accountData = await createAccountRes.json();

        if (!createAccountRes.ok) {
            console.error("Asaas Create Account Error:", accountData);
            return NextResponse.json({ error: accountData.errors?.[0]?.description || "Erro ao criar subconta no Asaas" }, { status: 400 });
        }

        const asaasWalletId = accountData.walletId || accountData.id;

        // 2. Registra o ID da subconta recém-criada no Supabase
        await supabaseAdmin
            .from('tenants')
            .update({
                asaas_wallet_id: asaasWalletId,
                pix_key: pixKey || null,
                bank_code: bankCode || null,
                bank_agency: bankAgency || null,
                bank_account: bankAccount || null
            })
            .eq('id', tenantId);

        // 3. Opcional: Registra log local em asaas_wallets
        await supabaseAdmin.from('asaas_wallets').insert({
            tenant_id: tenantId,
            asaas_customer_id: accountData.id,
            asaas_wallet_id: asaasWalletId,
            company_type: companyType
        });

        // Audit log
        await logAuditEvent(
            user.id,
            'wallet_created',
            'tenant',
            tenantId,
            { walletId: asaasWalletId, name, email },
            getClientIp(request)
        );

        return NextResponse.json({
            success: true,
            walletId: asaasWalletId,
            message: "Subconta criada com sucesso para Split automático."
        });

    } catch (error: any) {
        console.error("🔴 WALLET CREATION ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
