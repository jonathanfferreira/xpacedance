import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!, // Used Service Role for transactions/XP burn
            { cookies: { getAll: () => cookieStore.getAll() } }
        );

        // 1. Validar Aluno
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { tenant_id, items, total_amount, xp_to_burn, shipping_cost, shipping_address } = body;

        // Validations
        if (!tenant_id || !items || items.length === 0 || !shipping_address) {
            return NextResponse.json({ error: 'Faltam dados essenciais do pedido' }, { status: 400 });
        }

        // 2. Validate XP Burn Logic (Exchange rate: 100XP = R$ 1.00 as example)
        let discount_applied = 0;
        if (xp_to_burn && xp_to_burn > 0) {
            // Checar se o usuário tem XP suficiente
            const { data: xpData } = await supabase
                .from('user_xp_history')
                .select('amount')
                .eq('user_id', user.id);

            const totalXPHistory = (xpData || []).reduce((sum, row) => sum + row.amount, 0);

            if (totalXPHistory < xp_to_burn) {
                return NextResponse.json({ error: 'Você não possui XP suficiente para este resgate.' }, { status: 400 });
            }

            // Ex: 1000 XP queima R$ 10 de desconto
            discount_applied = (xp_to_burn / 100);

            // Prevent discount greater than product total
            if (discount_applied > total_amount) {
                discount_applied = total_amount;
            }

            // Burn the XP via RPC
            const { error: rpcError } = await supabase.rpc('increment_user_xp', {
                p_user_id: user.id,
                p_xp: -Math.abs(xp_to_burn) // Negative to subtract
            });

            if (rpcError) throw new Error("Falha ao debitar XP");
        }

        const final_total = (total_amount - discount_applied) + shipping_cost;

        // 3. Create the Order in Supabase
        const { data: newOrder, error: orderError } = await supabase
            .from('xtore_orders')
            .insert({
                buyer_id: user.id,
                tenant_id,
                total_amount: final_total,
                discount_applied,
                xp_used: xp_to_burn || 0,
                shipping_cost,
                shipping_address,
                status: 'pending'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 4. Create Order Items
        const orderItemsPayload = items.map((item: any) => ({
            order_id: newOrder.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.price
        }));

        const { error: itemsError } = await supabase
            .from('xtore_order_items')
            .insert(orderItemsPayload);

        if (itemsError) throw itemsError;

        // 5. Decrement Stock from Products
        // Uses RPC to ensure atomicity and prevent race conditions
        const { error: stockError } = await supabase.rpc('decrement_stock', {
            p_items: items.map((item: any) => ({
                product_id: item.product_id,
                quantity: item.quantity
            }))
        });

        if (stockError) {
            throw new Error(stockError.message || 'Falha ao atualizar o estoque.');
        }

        return NextResponse.json({
            status: 'success',
            order_id: newOrder.id,
            message: 'Pedido criado com sucesso.',
        });

    } catch (e: any) {
        console.error("XTORE Order Creation Error:", e);
        return NextResponse.json({ error: e.message || 'Error processing order' }, { status: 500 });
    }
}
