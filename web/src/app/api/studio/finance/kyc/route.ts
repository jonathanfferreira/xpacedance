import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name, email, loginEmail,
            cpfCnpj, birthDate, companyType,
            mobilePhone, phone, site,
            postalCode, address, addressNumber, complement, province, city,
        } = body;

        if (!name || !cpfCnpj || !loginEmail || !postalCode || !addressNumber || !address || !birthDate || !mobilePhone) {
            return NextResponse.json({ error: 'Faltam dados obrigatórios para criação da conta Asaas.' }, { status: 400 });
        }

        // Recuperar o tenant do owner logado
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id, asaas_wallet_id')
            .eq('owner_id', user.id)
            .single();

        if (!tenant) {
            return NextResponse.json({ error: 'Escola não encontrada.' }, { status: 404 });
        }

        // Se já tem walletId real (Diferente do mock inicial)
        if (tenant.asaas_wallet_id && !tenant.asaas_wallet_id.includes('mocked_')) {
            return NextResponse.json({ error: 'Sua escola já possui uma subconta vinculada oficial.' }, { status: 400 });
        }

        const ASAAS_URL = process.env.NEXT_PUBLIC_ENVIRONMENT === 'sandbox'
            ? 'https://sandbox.asaas.com/api/v3'
            : 'https://api.asaas.com/v3';

        const payloadAsaas = {
            name,
            email: loginEmail,
            loginEmail: loginEmail,
            cpfCnpj: cpfCnpj.replace(/\D/g, ''),
            birthDate,
            companyType,
            mobilePhone: mobilePhone.replace(/\D/g, ''),
            phone: phone ? phone.replace(/\D/g, '') : undefined,
            site: site || undefined,
            postalCode: postalCode.replace(/\D/g, ''),
            address,
            addressNumber,
            complement: complement || undefined,
            province,
            city
        };

        // Envia requisição para a Master API do Asaas (Criar Conta Branca)
        const asaasRes = await fetch(`${ASAAS_URL}/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': process.env.ASAAS_API_KEY || ''
            },
            body: JSON.stringify(payloadAsaas)
        });

        const data = await asaasRes.json();

        if (!asaasRes.ok) {
            console.error('[FINANCE KYC ERROR]', data);
            const err = data.errors?.[0]?.description || 'Erro desconhecido na Master API do ASAAS.';
            return NextResponse.json({ error: err }, { status: asaasRes.status });
        }

        const asaasWalletId = data.walletId;
        const asaasApiKey = data.apiKey;
        const asaasAccountId = data.id;

        // 1. Grava no supabase (Tabela Tenants para acesso geral)
        const { error: errUpdate } = await supabase
            .from('tenants')
            .update({ asaas_wallet_id: asaasWalletId })
            .eq('id', tenant.id);

        if (errUpdate) console.error('[DB] Erro ao atualizar asaas_wallet_id:', errUpdate);

        // 2. Grava log completo na tabela "asaas_wallets" (Se a gente criou na migration)
        const { error: errLog } = await supabase
            .from('asaas_wallets')
            .insert({
                tenant_id: tenant.id,
                asaas_customer_id: asaasAccountId,
                asaas_wallet_id: asaasWalletId,
                company_type: companyType || 'FISICA'
            });

        if (errLog) console.error('[DB] Erro ao cadastrar log na tabela asaas_wallets:', errLog);

        return NextResponse.json({
            success: true,
            message: 'Subconta (Wallet) criada com sucesso no ASAAS!',
            walletId: asaasWalletId
        });

    } catch (err: any) {
        console.error('[FINANCE KYC CRITICAL]', err.message);
        return NextResponse.json({ error: 'Erro interno ao criar subconta Asaas.' }, { status: 500 });
    }
}
