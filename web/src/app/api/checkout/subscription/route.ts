import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { subscriptionCheckoutSchema } from "@/lib/validators";
import { rateLimit, getClientIp } from "@/utils/rate-limit";
import { validateCsrf } from "@/utils/csrf";
import { cookies } from "next/headers";

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const DEFAULT_SPLIT_PERCENT = Number(process.env.PLATFORM_SPLIT_PERCENT || 10);

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    // Rate limiting: 3 tentativas/min por IP
    const ip = getClientIp(request);
    const { limited } = rateLimit(ip, 3);
    if (limited) {
        return NextResponse.json(
            { error: "Muitas tentativas. Tente novamente em 1 minuto." },
            { status: 429, headers: { "Retry-After": "60" } }
        );
    }

    // CSRF validation
    const csrfError = validateCsrf(request);
    if (csrfError) {
        return NextResponse.json({ error: "Requisição inválida." }, { status: 403 });
    }

    try {
        let rawBody: unknown;
        try {
            rawBody = await request.json();
        } catch {
            return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
        }

        // Zod validation
        const result = subscriptionCheckoutSchema.safeParse(rawBody);
        if (!result.success) {
            return NextResponse.json(
                { error: "Dados inválidos.", details: result.error.flatten().fieldErrors },
                { status: 422 }
            );
        }

        const { name, email, phone, cpf, planId, paymentMethod, creditCard } = result.data;

        // 1. Busca o plano
        const { data: plan, error: planError } = await supabaseAdmin
            .from("subscription_plans")
            .select("id, name, price, cycle, tenant_id, is_active, tenants:tenants!tenant_id(asaas_wallet_id, split_percent)")
            .eq("id", planId)
            .single();

        if (planError || !plan || !plan.is_active) {
            return NextResponse.json({ error: "Plano não encontrado ou inativo." }, { status: 404 });
        }

        const tenant = (plan as any).tenants;
        const splitPercent = tenant?.split_percent || DEFAULT_SPLIT_PERCENT;
        const professorWalletId = tenant?.asaas_wallet_id;
        const coursePrice = plan.price || 0;

        // Tracker de Afiliado
        const cookieStore = await cookies();
        const affiliateCode = cookieStore.get("asaas_affiliate_tracker")?.value;

        // MOCK MODE
        if (!ASAAS_API_KEY) {
            const mockSubscription = await supabaseAdmin
                .from("subscriptions")
                .insert({
                    user_id: "00000000-0000-0000-0000-000000000000",
                    tenant_id: plan.tenant_id,
                    plan_id: planId,
                    asaas_subscription_id: `mock_sub_${Date.now()}`,
                    status: "PENDING",
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .select("id")
                .single();

            return NextResponse.json({
                success: true,
                subscriptionId: mockSubscription.data?.id,
                status: "PENDING",
                pixQrCodeUrl: paymentMethod === "pix" ? "https://sandbox.asaas.com/pix/qrcode" : null,
                pixCopiaECola: paymentMethod === "pix" ? "00020126580014BR.GOV.BCB.PIX0136..." : null,
            });
        }

        // 2. Busca ou cria Customer no Asaas
        let customerId = "";
        const customerRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(email)}`, {
            headers: { access_token: ASAAS_API_KEY },
        });
        const customerData = await customerRes.json();

        if (customerData.data?.length > 0) {
            customerId = customerData.data[0].id;
        } else {
            const newCustomerRes = await fetch(`${ASAAS_API_URL}/customers`, {
                method: "POST",
                headers: { access_token: ASAAS_API_KEY, "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, mobilePhone: phone, cpfCnpj: cpf || undefined }),
            });
            const newCustomer = await newCustomerRes.json();
            if (!newCustomer.id) {
                return NextResponse.json(
                    { error: newCustomer.errors?.[0]?.description || "Erro ao criar cliente Asaas" },
                    { status: 400 }
                );
            }
            customerId = newCustomer.id;
        }

        // 3. Cria Subscription no Asaas
        const nextDueDate = new Date();
        nextDueDate.setDate(nextDueDate.getDate() + 1);
        const nextDueDateStr = nextDueDate.toISOString().split("T")[0];

        const subscriptionPayload: Record<string, unknown> = {
            customer: customerId,
            billingType: paymentMethod === "pix" ? "PIX" : "CREDIT_CARD",
            value: plan.price,
            nextDueDate: nextDueDateStr,
            cycle: plan.cycle,
            description: `XTAGE - ${plan.name}`,
        };

        if (paymentMethod === "credit" && creditCard) {
            subscriptionPayload.creditCard = {
                holderName: creditCard.holderName,
                number: creditCard.number,
                expiryMonth: creditCard.expiryMonth,
                expiryYear: creditCard.expiryYear,
                ccv: creditCard.ccv,
            };
            subscriptionPayload.creditCardHolderInfo = {
                name,
                email,
                cpfCnpj: cpf || "00000000000",
            };
        }

        // 5. Build Split
        const professorFixedSplit = Number((coursePrice * (1 - splitPercent / 100)).toFixed(2));

        let affiliateUserId: string | null = null;
        let affiliateCommissionValue = 0;

        if (professorWalletId) {
            subscriptionPayload.split = [
                { walletId: professorWalletId, fixedValue: professorFixedSplit }
            ];

            if (affiliateCode) {
                const { data: affiliate } = await supabaseAdmin
                    .from('affiliates')
                    .select('user_id, commission_pct')
                    .eq('affiliate_code', affiliateCode)
                    .single();

                if (affiliate) {
                    affiliateUserId = affiliate.user_id;
                    affiliateCommissionValue = Number((professorFixedSplit * (affiliate.commission_pct / 100)).toFixed(2));
                }
            }
        }

        const subRes = await fetch(`${ASAAS_API_URL}/subscriptions`, {
            method: "POST",
            headers: { access_token: ASAAS_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify(subscriptionPayload),
        });

        const subData = await subRes.json();

        if (!subRes.ok) {
            console.error("Asaas subscription error:", subData);
            throw new Error(subData.errors?.[0]?.description || "Erro ao criar assinatura no Asaas");
        }

        // 4. Salva no banco
        const periodEnd = new Date();
        periodEnd.setDate(periodEnd.getDate() + 30);

        const { data: savedSub, error: subSaveError } = await supabaseAdmin
            .from("subscriptions")
            .insert({
                user_id: subData.customer || customerId,
                tenant_id: plan.tenant_id,
                plan_id: planId,
                asaas_subscription_id: subData.id,
                status: "PENDING",
                current_period_end: periodEnd.toISOString(),
            })
            .select("id")
            .single();

        if (subSaveError) {
            console.error("[SUBSCRIPTION] Erro ao salvar subscription:", subSaveError);
        }

        if (savedSub?.id && professorWalletId) {
            const platformAmount = Number((coursePrice - professorFixedSplit).toFixed(2));
            await supabaseAdmin.from('split_audit').insert({
                transaction_id: savedSub.id,
                professor_wallet_id: professorWalletId,
                professor_amount: professorFixedSplit,
                platform_amount: platformAmount,
                total_amount: coursePrice,
                split_percent: splitPercent,
                affiliate_user_id: affiliateUserId,
                affiliate_amount: affiliateCommissionValue
            });
        }

        // 5. Retorna dados de pagamento
        if (paymentMethod === "pix") {
            // Busca o primeiro pagamento da assinatura para obter o PIX
            const paymentsRes = await fetch(
                `${ASAAS_API_URL}/payments?subscription=${subData.id}`,
                { headers: { access_token: ASAAS_API_KEY } }
            );
            const paymentsData = await paymentsRes.json();
            const firstPaymentId = paymentsData.data?.[0]?.id;

            let pixQrCodeUrl: string | null = null;
            let pixCopiaECola: string | null = null;

            if (firstPaymentId) {
                const pixRes = await fetch(`${ASAAS_API_URL}/payments/${firstPaymentId}/pixQrCode`, {
                    headers: { access_token: ASAAS_API_KEY },
                });
                const pixData = await pixRes.json();
                pixQrCodeUrl = pixData.encodedImage
                    ? String(pixData.encodedImage).startsWith("data:image")
                        ? pixData.encodedImage
                        : `data:image/png;base64,${pixData.encodedImage}`
                    : null;
                pixCopiaECola = pixData.payload || null;
            }

            return NextResponse.json({
                success: true,
                subscriptionId: savedSub?.id,
                asaasSubscriptionId: subData.id,
                status: "PENDING",
                pixQrCodeUrl,
                pixCopiaECola,
            });
        }

        return NextResponse.json({
            success: true,
            subscriptionId: savedSub?.id,
            asaasSubscriptionId: subData.id,
            status: subData.status,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("🔴 SUBSCRIPTION CHECKOUT ERROR:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
