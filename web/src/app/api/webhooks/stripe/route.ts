import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { NotificationTriggers } from "@/utils/notifications";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get("stripe-signature") as string;

    let event;

    try {
        if (!endpointSecret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as any;
                const { userId, courseId, planId, affiliateCode } = session.metadata;

                if (courseId && userId) {
                    // 1. Confirm transaction
                    const { error: txError } = await supabaseAdmin
                        .from("transactions")
                        .update({ 
                            status: "confirmed",
                            confirmed_at: new Date().toISOString(),
                            stripe_payment_intent_id: session.payment_intent
                        })
                        .eq("stripe_checkout_session_id", session.id);

                    if (txError) {
                        console.error('❌ Error updating transaction:', txError);
                        throw new Error(`Failed to update transaction: ${txError.message}`);
                    }

                    // 2. Create Enrollment
                    const { error: enrollError } = await supabaseAdmin
                        .from("enrollments")
                        .upsert({
                            user_id: userId,
                            course_id: courseId,
                            status: "active"
                        }, { onConflict: 'user_id,course_id' });

                    if (enrollError) {
                        console.error('❌ Error creating enrollment:', enrollError);
                        throw new Error(`Failed to create enrollment: ${enrollError.message}`);
                    }

                    console.log(`✅ Enrollment created for user ${userId} in course ${courseId}`);
                }

                if (planId && userId) {
                    // Handle Subscription completion
                    const { error: subError } = await supabaseAdmin
                        .from("subscriptions")
                        .upsert({
                            user_id: userId,
                            plan_id: planId,
                            tenant_id: session.metadata.tenantId,
                            stripe_subscription_id: session.subscription,
                            status: "active",
                            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Placeholder, updated by invoice.succeeded
                        }, { onConflict: 'user_id,plan_id' });
                    
                    if (subError) {
                        console.error('❌ Error activating subscription:', subError);
                        throw new Error(`Failed to activate subscription: ${subError.message}`);
                    }

                    console.log(`✅ Subscription activated for user ${userId} on plan ${planId}`);
                }
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as any;
                const subscriptionId = invoice.subscription;
                
                if (subscriptionId) {
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
                    await supabaseAdmin
                        .from("subscriptions")
                        .update({
                            status: "ACTIVE",
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
                        })
                        .eq("stripe_subscription_id", subscriptionId);
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as any;
                await supabaseAdmin
                    .from("subscriptions")
                    .update({ status: "CANCELLED" })
                    .eq("stripe_subscription_id", subscription.id);
                break;
            }

            case "charge.refunded": {
                const charge = event.data.object as any;
                const paymentIntentId = charge.payment_intent;

                if (!paymentIntentId) {
                    console.warn('⚠️ charge.refunded sem payment_intent, ignorando.');
                    break;
                }

                // 1. Buscar a transação correspondente
                const { data: tx, error: txFetchError } = await supabaseAdmin
                    .from('transactions')
                    .select('id, user_id, course_id')
                    .eq('stripe_payment_intent_id', paymentIntentId)
                    .maybeSingle();

                if (txFetchError || !tx) {
                    console.error('❌ Transação não encontrada para reembolso:', paymentIntentId);
                    break;
                }

                // 2. Atualizar transação como reembolsada
                await supabaseAdmin
                    .from('transactions')
                    .update({
                        status: 'refunded',
                        refunded_at: new Date().toISOString(),
                        stripe_refund_id: charge.refunds?.data?.[0]?.id || null,
                    })
                    .eq('id', tx.id);

                // 3. Revogar acesso ao curso imediatamente
                if (tx.course_id) {
                    await supabaseAdmin
                        .from('enrollments')
                        .update({ status: 'cancelled' })
                        .eq('user_id', tx.user_id)
                        .eq('course_id', tx.course_id);

                    console.log(`✅ Acesso revogado: user=${tx.user_id} curso=${tx.course_id}`);
                }

                // 4. Notificar o aluno sobre o reembolso
                try {
                    await NotificationTriggers.refundProcessed(tx.user_id, tx.course_id);
                } catch (notifErr) {
                    console.error('[NOTIFICATIONS] Falha ao notificar reembolso:', notifErr);
                }

                console.log(`✅ Reembolso processado: PI=${paymentIntentId}`);
                break;
            }

            case "charge.dispute.created": {
                // Registro de chargeback para análise manual
                const dispute = event.data.object as any;
                console.warn(`⚠️ CHARGEBACK recebido: disputeId=${dispute.id}, chargeId=${dispute.charge}, motivo=${dispute.reason}`);
                // TODO: Notificar admin via email/Crisp
                break;
            }

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("🔴 WEBHOOK PROCESSING ERROR:", error.message);
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
