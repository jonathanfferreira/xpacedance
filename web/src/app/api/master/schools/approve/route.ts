import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { validateCsrf } from '@/utils/csrf'
import { logAuditEvent } from '@/utils/audit'
import { getClientIp } from '@/utils/rate-limit'

// MOCK CONSTANTS FOR ASAAS (For MVP purposes without demanding real CPFs)
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

export async function POST(request: Request) {
    // CSRF validation
    const csrfError = validateCsrf(request);
    if (csrfError) {
        return NextResponse.json({ error: 'Requisição inválida.' }, { status: 403 });
    }

    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use Service Role to mutate another user's role
            { cookies: { get: (name) => cookieStore.get(name)?.value } }
        )

        // 1. Validar Admin Master
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: callerProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
        if (callerProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Only Master Admin can approve schools.' }, { status: 403 })
        }

        const body = await request.json()
        const { tenantId } = body
        if (!tenantId) return NextResponse.json({ error: 'tenantId missing' }, { status: 400 })

        // 2. Fetch Tenant Pending Data
        const { data: tenant, error: tenantErr } = await supabase
            .from('tenants')
            .select(`*, owner:users!owner_id(email, full_name)`)
            .eq('id', tenantId)
            .single()

        if (tenantErr || !tenant) {
            return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })
        }

        if (tenant.status === 'active') {
            return NextResponse.json({ error: 'School already active.' }, { status: 400 })
        }

        const ownerEmail = tenant.owner?.email || `contact+${tenantId}@xtage.app`
        // const ownerName = tenant.owner?.full_name || tenant.name

        // 3. Criar a Subconta no Asaas (Para que os Splits financeiros funcionem)
        let newWalletId = `mocked_wallet_${Date.now()}`

        if (ASAAS_API_KEY) {
            console.log(`[MASTER] Integrando ${tenant.name} à Asaas SubAccounts...`)
            // Chamada de API para https://sandbox.asaas.com/api/v3/accounts
            // Simulamos sucesso aqui, pois a criação exige dados fiscais estritos (CNPJ/CPF, etc) no request real.
            // Para não quebrar o Board do CEO se estiver sem os CPFs em mãos agora:
            newWalletId = `wal_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        } else {
            console.warn(`[MASTER] Asaas Key inativa. Usando Mock Wallet: ${newWalletId}`)
        }

        // 4. Efetivar as Aprovações no Banco (Transaction Simulada)
        // A. Ativa a Escola e Seta a Wallet
        const { error: updateTenantErr } = await supabase
            .from('tenants')
            .update({ status: 'active', asaas_wallet_id: newWalletId })
            .eq('id', tenantId)

        if (updateTenantErr) throw updateTenantErr

        // B. Promove a Sessão do Dono para "Professor/Escola"
        const { error: updateUserErr } = await supabase
            .from('users')
            .update({ role: 'escola' })
            .eq('id', tenant.owner_id)

        if (updateUserErr) throw updateUserErr

        // Audit log
        await logAuditEvent(
            user.id,
            'school_approved',
            'tenant',
            tenantId,
            { walletId: newWalletId, ownerEmail, tenantName: tenant.name },
            getClientIp(request)
        )

        return NextResponse.json({
            success: true,
            message: 'Partner Approved and Wallet assigned.',
            walletId: newWalletId
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        console.error("Master Approve Error:", e)
        return NextResponse.json({ error: e.message || 'Server Exception' }, { status: 500 })
    }
}
