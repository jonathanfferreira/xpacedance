import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client - bypasses RLS for server-to-server webhook
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET;

export async function POST(request: Request) {
    try {
        // Validate Asaas webhook token
        const token = request.headers.get("asaas-access-token");
        if (WEBHOOK_SECRET && token !== WEBHOOK_SECRET) {
            console.error("[ASAAS WEBHOOK] ⛔ Token inválido ou ausente.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await request.json();
        const evento = payload.event as string;
        const paymentId = payload.payment?.id as string | undefined;
        const netValue: number = payload.payment?.netValue || payload.payment?.value || 0;
        const customerEmail = payload.payment?.customerEmail as string | undefined;
        const subscriptionId = payload.payment?.subscription as string | undefined;

        console.log(
            `[ASAAS WEBHOOK] Evento: ${evento} | Payment: ${paymentId} | Sub: ${subscriptionId || "N/A"} | R$${netValue}`
        );

        if (!paymentId) {
            return NextResponse.json({ error: "No Payment ID provided" }, { status: 400 });
        }

        // =================== PURCHASE EVENTS ===================
        if (evento === "PAYMENT_RECEIVED" || evento === "PAYMENT_CONFIRMED") {
            console.log(`[ASAAS] 🤑 Pagamento Confirmado: ${paymentId}`);

            // [MARKETING] Meta Conversions API (CAPI)
            if (process.env.META_ACCESS_TOKEN && process.env.META_PIXEL_ID) {
                try {
                    await sendMetaPurchaseCAPI(customerEmail, netValue);
                } catch (e) {
                    console.log(`[CAPI] ⚠️ Falha não-crítica ao enviar CAPI`, e);
                }
            }

            // --- FLUXO DE ASSINATURA ---
            if (subscriptionId) {
                return await handleSubscriptionPaymentReceived(subscriptionId, customerEmail);
            }

            // --- FLUXO DE COMPRA AVULSA ---
            return await handleOneTimePaymentReceived(paymentId, customerEmail, netValue);
        }

        // =================== OVERDUE EVENTS ===================
        if (evento === "PAYMENT_OVERDUE" || evento === "PAYMENT_DUNNING_RECEIVED") {
            console.log(`[ASAAS] 🟡 Fatura Vencida: ${paymentId}`);

            if (subscriptionId) {
                await supabaseAdmin
                    .from("subscriptions")
                    .update({ status: "PAST_DUE", updated_at: new Date().toISOString() })
                    .eq("asaas_subscription_id", subscriptionId);
                return NextResponse.json({ message: "Subscription marcada como PAST_DUE" });
            }

            await supabaseAdmin
                .from("transactions")
                .update({ status: "overdue" })
                .eq("asaas_payment_id", paymentId);

            // Cart recovery email
            if (customerEmail) {
                try {
                    const { sendCartRecoveryEmail } = await import("@/utils/marketing/CartRecovery");
                    const backUrl = payload.payment?.invoiceUrl || "https://xtage.app/checkout";
                    await sendCartRecoveryEmail(customerEmail, "Dancer", backUrl);
                } catch (e) {
                    console.log("[ASAAS WEBHOOK] ⚠️ Cart recovery email fail (non-critical)", e);
                }
            }

            return NextResponse.json({ message: "Lead processado para Recuperação de Carrinho" });
        }

        // =================== REFUND / DELETED ===================
        if (evento === "PAYMENT_DELETED" || evento === "PAYMENT_REFUNDED") {
            console.log(`[ASAAS] 🔴 Pagamento Cancelado/Reembolsado: ${paymentId}`);

            if (subscriptionId) {
                await cancelSubscription(subscriptionId, "CANCELED");
            }

            await supabaseAdmin
                .from("transactions")
                .update({ status: "refunded" })
                .eq("asaas_payment_id", paymentId);

            await revokeEnrollmentByPayment(paymentId);

            return NextResponse.json({ message: "Pagamento cancelado e acesso revogado" });
        }

        // =================== CHARGEBACK ===================
        if (evento === "PAYMENT_CHARGEBACK") {
            console.log(`[ASAAS] ⛔ Chargeback: ${paymentId}`);

            await supabaseAdmin
                .from("transactions")
                .update({ status: "chargeback" })
                .eq("asaas_payment_id", paymentId);

            if (subscriptionId) {
                await cancelSubscription(subscriptionId, "CANCELED");
            }

            await revokeEnrollmentByPayment(paymentId);

            return NextResponse.json({ message: "Chargeback processado e acesso revogado" });
        }

        return NextResponse.json({ message: "Evento Ignorado", event: evento });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("🔴 ERRO NO WEBHOOK:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// ============================================================
// HELPERS
// ============================================================

async function handleSubscriptionPaymentReceived(subscriptionId: string, customerEmail: string | undefined) {
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({
            status: "ACTIVE",
            current_period_end: periodEnd.toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq("asaas_subscription_id", subscriptionId);

    if (error) {
        console.error("[ASAAS WEBHOOK] Erro ao ativar subscription:", error);
    } else {
        console.log(`[ASAAS WEBHOOK] ✅ Subscription ATIVA: ${subscriptionId} | expira: ${periodEnd.toISOString()}`);
    }

    return NextResponse.json({ message: "Assinatura ativada", subscriptionId });
}

async function handleOneTimePaymentReceived(paymentId: string, customerEmail: string | undefined, netValue: number) {
    const { data: transaction, error: txError } = await supabaseAdmin
        .from("transactions")
        .select("id, user_id, course_id, status")
        .eq("asaas_payment_id", paymentId)
        .single();

    if (txError || !transaction) {
        console.error("[ASAAS WEBHOOK] Transaction não encontrada:", paymentId);
        return NextResponse.json({ message: "Transaction not found, acknowledged" });
    }

    if (transaction.status === "confirmed") {
        return NextResponse.json({ received: true, duplicate: true });
    }

    // Update transaction
    await supabaseAdmin
        .from("transactions")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", transaction.id);

    // Create enrollment
    const { error: enrollError } = await supabaseAdmin
        .from("enrollments")
        .upsert(
            {
                user_id: transaction.user_id,
                course_id: transaction.course_id,
                status: "active",
                enrolled_at: new Date().toISOString(),
            },
            { onConflict: "user_id,course_id" }
        );

    if (enrollError) {
        console.error("[ASAAS WEBHOOK] Erro ao criar enrollment:", enrollError);
    } else {
        console.log(`[ASAAS WEBHOOK] ✅ Enrollment: user=${transaction.user_id} course=${transaction.course_id}`);

        // Notify the Tenant Owner about the new sale!
        try {
            const { data: cData } = await supabaseAdmin.from("courses").select("id, title, tenant_id, tenants(owner_id)").eq("id", transaction.course_id).single();
            if (cData && (cData.tenants as any)?.owner_id) {
                const notificationResult = await supabaseAdmin.rpc("create_notification", {
                    p_user_id: (cData.tenants as any).owner_id,
                    p_title: "Nova Venda Realizada! 🎉",
                    p_message: `Um aluno acaba de se matricular no curso ${cData.title}. Liquidez de R$ ${(netValue || 0).toFixed(2).replace('.', ',')}.`,
                    p_type: "revenue",
                    p_link_url: "/studio/analytics",
                    p_tenant_id: cData.tenant_id
                });

                if (notificationResult.error) {
                    console.error("[ASAAS WEBHOOK] Erro ao criar notificação de venda (não-crítico):", notificationResult.error);
                }
            }
        } catch (notificationErr) {
            console.error("[ASAAS WEBHOOK] Exceção ao tentar notificar o dono (não-crítico):", notificationErr);
        }

        // Welcome email via Resend
        if (process.env.RESEND_API_KEY && customerEmail) {
            try {
                const { Resend } = await import("resend");
                const resend = new Resend(process.env.RESEND_API_KEY);
                const { renderWelcomeEmail } = await import("@/utils/marketing/EmailTemplates");

                const { data: courseData } = await supabaseAdmin
                    .from("courses")
                    .select("title, tenants(name, brand_color, logo_url)")
                    .eq("id", transaction.course_id)
                    .single();

                const { data: userData } = await supabaseAdmin
                    .from("users")
                    .select("full_name")
                    .eq("id", transaction.user_id)
                    .single();

                const tenant = courseData?.tenants as { name?: string; brand_color?: string; logo_url?: string } | null;
                const brandColor = tenant?.brand_color || "#6324b2";
                const brandLogo = tenant?.logo_url || "https://xtage.app/images/logo-light.png";

                const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                    type: "magiclink",
                    email: customerEmail,
                    options: { redirectTo: "https://xtage.app/dashboard" },
                });

                const htmlBody = await renderWelcomeEmail({
                    studentName: userData?.full_name?.split(" ")[0] || "Aluno",
                    courseName: courseData?.title || "Seu novo curso",
                    loginEmail: customerEmail,
                    magicLinkUrl: linkData?.properties?.action_link,
                    brandColor,
                    brandLogo,
                });

                await resend.emails.send({
                    from: `${tenant?.name || "XTAGE"} <contato@xtage.app>`,
                    to: [customerEmail],
                    subject: `✅ Acesso Liberado: ${courseData?.title || "XTAGE"}`,
                    html: htmlBody,
                });

                console.log(`[RESEND] ✅ E-mail de acesso enviado para ${customerEmail}`);
            } catch (emailErr) {
                console.error("[RESEND] Falha não crítica ao enviar email de acesso", emailErr);
            }
        }
    }

    return NextResponse.json({ message: "Venda Processada - Acesso Liberado", enrolled: !enrollError });
}

async function cancelSubscription(subscriptionId: string, status: string) {
    const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("asaas_subscription_id", subscriptionId);

    if (error) {
        console.error(`[ASAAS WEBHOOK] Erro ao cancelar subscription ${subscriptionId}:`, error);
    }
}

async function revokeEnrollmentByPayment(paymentId: string) {
    const { data: transaction } = await supabaseAdmin
        .from("transactions")
        .select("user_id, course_id")
        .eq("asaas_payment_id", paymentId)
        .single();

    if (!transaction) return;

    await supabaseAdmin
        .from("enrollments")
        .update({ status: "revoked" })
        .eq("user_id", transaction.user_id)
        .eq("course_id", transaction.course_id);

    console.log(`[ASAAS WEBHOOK] 🔒 Enrollment revogado: user=${transaction.user_id} course=${transaction.course_id}`);
}

async function sendMetaPurchaseCAPI(email: string | undefined, value: number) {
    if (!email) return;

    const crypto = await import("crypto");
    const hashedEmail = crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");

    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            data: [{
                event_name: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                action_source: "website",
                user_data: { em: [hashedEmail] },
                custom_data: { currency: "BRL", value },
            }],
            access_token: accessToken,
        }),
    });
}
