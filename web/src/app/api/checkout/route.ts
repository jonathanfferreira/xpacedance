import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/utils/rate-limit";
import { validateCsrf } from "@/utils/csrf";
import { checkoutSchema } from "@/lib/validators";
import { cookies } from "next/headers";

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

// Admin client to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configurable via env vars, fallback to Asaas defaults
const INTEREST_RATE = Number(process.env.CHECKOUT_INTEREST_RATE || 0.0299); // 2.99% a.m
const DEFAULT_SPLIT_PERCENT = Number(process.env.PLATFORM_SPLIT_PERCENT || 10);

export async function POST(request: Request) {
    // Rate limit: max 5 checkout attempts per minute per IP
    const ip = getClientIp(request);
    const { limited } = await rateLimit(ip, 5);
    if (limited) {
        return NextResponse.json(
            { error: "Muitas tentativas. Tente novamente em 1 minuto." },
            { status: 429, headers: { 'Retry-After': '60' } }
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
        const parseResult = checkoutSchema.safeParse(rawBody);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Dados inválidos.", details: parseResult.error.flatten().fieldErrors },
                { status: 422 }
            );
        }

        const { name, email, phone, cpf, password, courseId, paymentMethod, creditCard, installments = 1 } = parseResult.data;

        if (!email || !name || !courseId) {
            return NextResponse.json({ error: "Nome, email e courseId são obrigatórios." }, { status: 400 });
        }

        // Tracker de Afiliado
        const cookieStore = await cookies();
        const affiliateCode = cookieStore.get("asaas_affiliate_tracker")?.value;

        // 1. Fetch course real data from DB
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('id, title, price, pricing_type, tenant_id, tenants:tenants!tenant_id(asaas_wallet_id, split_percent)')
            .eq('id', courseId)
            .single();

        if (courseError || !course) {
            return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });
        }

        const coursePrice = course.price || 39.90;
        const tenant = (course as any).tenants;
        const splitPercent = tenant?.split_percent || DEFAULT_SPLIT_PERCENT;
        const rawWalletId = tenant?.asaas_wallet_id;

        // Only use wallet for splits if it's a REAL Asaas SubAccount (not a mock placeholder)
        const isRealWallet = rawWalletId
            && !rawWalletId.startsWith('mocked_')
            && !rawWalletId.startsWith('wal_');
        const professorWalletId = isRealWallet ? rawWalletId : null;

        // 2. Create or find user in Supabase Auth
        let userId: string | null = null;

        // Check if user already exists — query by email directly (listUsers without filter is O(n) and paginated, breaks at 50+ users)
        const { data: existingUserRow } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUserRow) {
            userId = existingUserRow.id;
        } else if (password) {
            // Create new user account
            const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: name },
            });
            if (signUpError) {
                console.error("Erro ao criar usuário:", signUpError);
                return NextResponse.json({ error: "Erro ao criar conta. Tente novamente ou use outro e-mail." }, { status: 400 });
            }
            userId = newUser.user.id;
        }

        // ENFORCE ASAAS API KEY FOR PRODUCTION
        if (!ASAAS_API_KEY) {
            console.error("ASAAS_API_KEY ausente. Transação não pode ser processada em ambiente real.");
            return NextResponse.json(
                { error: "Erro na configuração de pagamentos da plataforma. Contate o suporte." },
                { status: 500 }
            );
        }

        // 3. Find or create Asaas Customer
        let customerId = "";
        const customerRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(email)}`, {
            headers: { "access_token": ASAAS_API_KEY }
        });

        if (!customerRes.ok) {
            console.error("Asaas customer lookup failed:", customerRes.status);
            return NextResponse.json(
                { error: "Erro de autenticação com o gateway de pagamentos. Verifique a configuração da plataforma." },
                { status: 502 }
            );
        }

        const customerData = await customerRes.json();

        if (customerData.data?.length > 0) {
            const existingCustomer = customerData.data[0];
            customerId = existingCustomer.id;

            // Se o cliente já existe mas não tem CPF cadastrado e o usuário forneceu um, atualiza
            const needsCpfUpdate = cpf && !existingCustomer.cpfCnpj;
            if (needsCpfUpdate) {
                await fetch(`${ASAAS_API_URL}/customers/${customerId}`, {
                    method: "PUT",
                    headers: { "access_token": ASAAS_API_KEY, "Content-Type": "application/json" },
                    body: JSON.stringify({ cpfCnpj: cpf })
                });
            }
        } else {
            const newCustomerRes = await fetch(`${ASAAS_API_URL}/customers`, {
                method: "POST",
                headers: { "access_token": ASAAS_API_KEY, "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    mobilePhone: phone,
                    cpfCnpj: cpf || undefined,
                })
            });
            const newCustomer = await newCustomerRes.json();
            if (!newCustomer.id) {
                return NextResponse.json({ error: newCustomer.errors?.[0]?.description || "Erro ao criar cliente Asaas" }, { status: 400 });
            }
            customerId = newCustomer.id;
        }

        // 4. Calculate pricing with buyer-paid interest
        let finalValue = coursePrice;
        if (paymentMethod === 'credit' && installments > 1) {
            const installmentValue = coursePrice * Math.pow(1 + INTEREST_RATE, installments) / installments;
            finalValue = installmentValue * installments;
        }
        finalValue = Number(finalValue.toFixed(2));

        // 5. Build Split (professor gets 90% of base price, XTAGE keeps 10% + interest surplus)
        const professorFixedSplit = Number((coursePrice * (1 - splitPercent / 100)).toFixed(2));

        const chargePayload: any = {
            customer: customerId,
            billingType: paymentMethod === 'pix' ? 'PIX' : 'CREDIT_CARD',
            value: finalValue,
            dueDate: new Date().toISOString().split("T")[0],
            description: `XTAGE - ${course.title}`,
        };

        // Recupera Taxas do Afiliado Rastreio (Se Existir)
        let affiliateUserId: string | null = null;
        let affiliateCommissionValue = 0;

        if (affiliateCode) {
            const { data: affiliate } = await supabaseAdmin
                .from('affiliates')
                .select('user_id, commission_pct, users(asaas_wallet_id)')
                .eq('affiliate_code', affiliateCode)
                .single();

            if (affiliate && (affiliate.users as any)?.asaas_wallet_id) {
                affiliateUserId = affiliate.user_id;
                // A comissão do afiliado sai da fatia PRIMÁRIA base (Descontando taxa da plataforma)
                // O afiliado ganha o percentual dele em cima do lucro da escola
                affiliateCommissionValue = Number((professorFixedSplit * (affiliate.commission_pct / 100)).toFixed(2));

                // Reduz do professor a parte do afiliado
                const professorNetSplit = Number((professorFixedSplit - affiliateCommissionValue).toFixed(2));

                if (professorWalletId) {
                    chargePayload.split = [
                        { walletId: professorWalletId, fixedValue: professorNetSplit },
                        { walletId: (affiliate.users as any).asaas_wallet_id, fixedValue: affiliateCommissionValue }
                    ];
                }
            } else if (professorWalletId) {
                // Afiliado não tem wallet ou não existe, professor recebe tudo
                chargePayload.split = [
                    { walletId: professorWalletId, fixedValue: professorFixedSplit }
                ];
            }
        } else if (professorWalletId) {
            // Sem afiliado, professor recebe tudo
            chargePayload.split = [
                { walletId: professorWalletId, fixedValue: professorFixedSplit }
            ];
        }

        if (paymentMethod === 'credit' && creditCard) {
            chargePayload.creditCard = creditCard;
            chargePayload.creditCardHolderInfo = {
                name,
                email,
                cpfCnpj: cpf || "00000000000",
                postalCode: creditCard.postalCode || "00000000",
                addressNumber: creditCard.addressNumber || "0",
                phone
            };

            if (installments > 1) {
                chargePayload.installmentCount = installments;
                chargePayload.installmentValue = Number((finalValue / installments).toFixed(2));
            }
        }

        // 6. Create Asaas Payment
        let splitFailed = false;
        const chargeRes = await fetch(`${ASAAS_API_URL}/payments`, {
            method: "POST",
            headers: { "access_token": ASAAS_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify(chargePayload)
        });

        const chargeData = await chargeRes.json();

        if (!chargeRes.ok) {
            const errDesc = chargeData.errors?.[0]?.description || "Erro ao gerar cobrança no Asaas";
            console.error("Asaas charge error:", { status: chargeRes.status, errors: chargeData.errors });

            // If wallet error, retry without split (platform absorbs full amount)
            if (errDesc.toLowerCase().includes('wallet') && chargePayload.split) {
                // ALERTA CRÍTICO: split falhou, professor NÃO receberá automaticamente
                console.error("[CHECKOUT] ⚠️ SPLIT FALHOU — cobrança sem split. Professor precisa receber manualmente.", {
                    professorWalletId,
                    courseId,
                    finalValue,
                    errDesc,
                });
                splitFailed = true;
                delete chargePayload.split;
                const retryRes = await fetch(`${ASAAS_API_URL}/payments`, {
                    method: "POST",
                    headers: { "access_token": ASAAS_API_KEY, "Content-Type": "application/json" },
                    body: JSON.stringify(chargePayload)
                });
                const retryData = await retryRes.json();
                if (!retryRes.ok) {
                    throw new Error(retryData.errors?.[0]?.description || "Erro ao gerar cobrança no Asaas");
                }
                Object.assign(chargeData, retryData);
            } else {
                throw new Error(errDesc);
            }
        }

        // 7. Save transaction in DB + split audit
        if (userId) {
            const { data: savedTx } = await supabaseAdmin.from('transactions').insert({
                user_id: userId,
                course_id: courseId,
                amount: finalValue,
                status: 'pending',
                asaas_payment_id: chargeData.id,
                payment_method: paymentMethod,
            }).select('id').single();

            // Split audit trail: registra mesmo quando split falhou (split_failed=true indica repasse manual necessário)
            if (savedTx?.id && professorWalletId) {
                const platformAmount = splitFailed
                    ? finalValue  // plataforma ficou com tudo no fallback
                    : Number((finalValue - professorFixedSplit).toFixed(2));
                await supabaseAdmin.from('split_audit').insert({
                    transaction_id: savedTx.id,
                    professor_wallet_id: professorWalletId,
                    professor_amount: splitFailed ? 0 : professorFixedSplit,
                    platform_amount: platformAmount,
                    total_amount: finalValue,
                    split_percent: splitPercent,
                    affiliate_user_id: affiliateUserId,
                    affiliate_amount: affiliateCommissionValue,
                    split_failed: splitFailed,
                });
            }
        }

        // 8. Return response
        if (paymentMethod === 'pix') {
            const pixRes = await fetch(`${ASAAS_API_URL}/payments/${chargeData.id}/pixQrCode`, {
                headers: { "access_token": ASAAS_API_KEY }
            });
            const pixData = await pixRes.json();

            return NextResponse.json({
                success: true,
                paymentId: chargeData.id,
                status: chargeData.status,
                pixQrCodeUrl: pixData.encodedImage
                    ? (String(pixData.encodedImage).startsWith('data:image') ? pixData.encodedImage : `data:image/png;base64,${pixData.encodedImage}`)
                    : null,
                pixCopiaECola: pixData.payload,
            });
        }

        return NextResponse.json({
            success: true,
            paymentId: chargeData.id,
            status: chargeData.status,
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("🔴 CHECKOUT ERROR:", msg);
        return NextResponse.json({ error: "Erro ao processar pagamento. Tente novamente ou contate o suporte." }, { status: 500 });
    }
}
