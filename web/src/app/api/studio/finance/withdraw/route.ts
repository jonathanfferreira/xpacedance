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
        const { amount, pixKey, pixKeyType } = body;

        if (!amount || amount < 5) {
            return NextResponse.json({ error: 'Valor mínimo para saque é de R$ 5,00.' }, { status: 400 });
        }
        if (!pixKey || !pixKeyType) {
            return NextResponse.json({ error: 'Informe a Chave PIX e o tipo (CPF, EMAIL, PHONE, EVP, CNPJ).' }, { status: 400 });
        }

        const { data: tenant } = await supabase
            .from('tenants')
            .select('asaas_wallet_id, name')
            .eq('owner_id', user.id)
            .single();

        if (!tenant || !tenant.asaas_wallet_id) {
            return NextResponse.json({ error: 'Carteira não encontrada para esta conta.' }, { status: 404 });
        }

        const walletId = tenant.asaas_wallet_id;

        // Se for uma Subconta falsa (Ambiente de Teste ou Deploy Inicial)
        if (walletId.includes('mocked_')) {
            // Simulamos o sucesso
            return NextResponse.json({
                success: true,
                message: 'Saque de teste solicitado com sucesso (Mock Wallet).',
                transaction_id: `mock_trans_${Date.now()}`
            });
        }

        const ASAAS_URL = process.env.NEXT_PUBLIC_ENVIRONMENT === 'sandbox'
            ? 'https://sandbox.asaas.com/api/v3'
            : 'https://api.asaas.com/v3';

        // Dispara ao ASAAS POST /v3/transfers
        const asaasReqBody = {
            value: Number(amount),
            pixAddressKey: pixKey,
            pixAddressKeyType: pixKeyType,
            description: `Saque XTAGE: ${tenant.name}`,
            scheduleDate: new Date().toISOString().split('T')[0]
        };

        const asaasRes = await fetch(`${ASAAS_URL}/transfers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': process.env.ASAAS_API_KEY || '',
                'walletId': walletId // Header customizado para Partners API
            },
            body: JSON.stringify(asaasReqBody)
        });

        if (!asaasRes.ok) {
            const errData = await asaasRes.json().catch(() => ({}));
            console.error('[FINANCE WITHDRAW ERROR]', errData);

            // Asaas manda os erros em um array { errors: [{ description: '...' }] }
            const errorMsg = errData.errors?.[0]?.description || 'API do parceiro bancário rejeitou a transferência. Verifique seu Saldo e Dados PIX.';
            return NextResponse.json({ error: errorMsg }, { status: 400 });
        }

        const transferData = await asaasRes.json();

        // Salva histórico de saque para auditoria
        const { data: tenantFull } = await supabase
            .from('tenants')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (tenantFull?.id) {
            const { error: withdrawLogError } = await supabase
                .from('withdrawal_history')
                .insert({
                    tenant_id: tenantFull.id,
                    user_id: user.id,
                    amount: Number(amount),
                    pix_key: pixKey,
                    pix_key_type: pixKeyType,
                    asaas_transfer_id: transferData.id,
                    status: transferData.status || 'PENDING',
                });
            if (withdrawLogError) {
                console.error('[FINANCE WITHDRAW] Falha ao salvar histórico de saque (não-crítico):', withdrawLogError.message);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Saque solicitado com sucesso.',
            transaction_id: transferData.id
        });

    } catch (err: any) {
        console.error('[FINANCE WITHDRAW CRITICAL]', err.message);
        return NextResponse.json({ error: 'Falha interna na comunicação com gateway de pagamento.' }, { status: 500 });
    }
}
