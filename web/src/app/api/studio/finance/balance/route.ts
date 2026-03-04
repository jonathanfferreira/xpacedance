import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Não autorizado. Faça login.' }, { status: 401 });
        }

        const { data: tenant } = await supabase
            .from('tenants')
            .select('asaas_wallet_id, pix_key, bank_code, bank_agency, bank_account')
            .eq('owner_id', user.id)
            .single();

        if (!tenant) {
            return NextResponse.json({ error: 'Escola não encontrada.' }, { status: 404 });
        }

        const walletId = tenant.asaas_wallet_id;

        // Verifica se é uma wallet de teste (mocked)
        if (!walletId || walletId.includes('mocked_')) {
            return NextResponse.json({
                balance: 0,
                income_expected: 0,
                wallet_id: walletId || 'N/A',
                is_mock: true,
                pix_key: tenant.pix_key || null
            });
        }

        const ASAAS_URL = process.env.NEXT_PUBLIC_ENVIRONMENT === 'sandbox'
            ? 'https://sandbox.asaas.com/api/v3'
            : 'https://api.asaas.com/v3';

        // Tenta buscar saldo
        // NOTA DA ARQUITETURA: Se o marketplace usar a Master API KEY para buscar dados da subconta, o gateway Asaas V3 permite usar o header `walletId`. Caso contrário, exigirá o access_token gerado para a subconta na sua criação. Abordaremos via header da walletId (Partner feature).
        const asaasRes = await fetch(`${ASAAS_URL}/finance/balance`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'access_token': process.env.ASAAS_API_KEY || '',
                'walletId': walletId
            }
        });

        if (!asaasRes.ok) {
            const errDetails = await asaasRes.json().catch(() => ({}));
            console.error('[FINANCE] Falha ao checar saldo:', errDetails);

            // Retorna um fallback vazio em vez de quebrar a página da escola, mas sem flag de erro agressivo.
            return NextResponse.json({
                balance: 0,
                income_expected: 0,
                wallet_id: walletId,
                is_mock: false,
                pix_key: tenant.pix_key || null,
                warning: 'Não foi possível consultar as informações financeiras reais agora.'
            });
        }

        const data = await asaasRes.json();
        return NextResponse.json({
            balance: data.balance || 0,
            income_expected: (data.estimatedUpdate || 0), // ou algo como incomingTransfer
            wallet_id: walletId,
            is_mock: false,
            pix_key: tenant.pix_key || null
        });

    } catch (err: any) {
        console.error('[FINANCE] Erro na API Balance:', err.message);
        return NextResponse.json({ error: 'Erro interno no servidor ao consultar o caixa.' }, { status: 500 });
    }
}
