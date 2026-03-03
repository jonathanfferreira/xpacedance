import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/utils/rate-limit";
import { validateCsrf } from "@/utils/csrf";
import { checkoutSchema } from "@/lib/validators";

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
    const { limited } = rateLimit(ip, 5);
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

    console.log("🟢 POST /api/checkout", ASAAS_API_KEY ? "[ASAAS LIVE]" : "[MOCK MODE]", `IP: ${ip}`);

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
        const professorWalletId = tenant?.asaas_wallet_id;

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
                return NextResponse.json({ error: "Erro ao criar conta: " + signUpError.message }, { status: 400 });
            }
            userId = newUser.user.id;
        }

        // MOCK MODE
        if (!ASAAS_API_KEY) {
            console.warn("ASAAS_API_KEY ausente. Mock mode ativo.");

            // Save mock transaction
            if (userId) {
                await supabaseAdmin.from('transactions').insert({
                    user_id: userId,
                    course_id: courseId,
                    amount: coursePrice,
                    status: 'mock',
                    asaas_payment_id: `mock_${Date.now()}`,
                    payment_method: paymentMethod,
                });
            }

            return NextResponse.json({
                success: true,
                paymentId: `mock_${Date.now()}`,
                status: "PENDING",
                pixQrCodeUrl: paymentMethod === 'pix' ? "https://sandbox.asaas.com/pix/qrcode" : null,
                pixCopiaECola: paymentMethod === 'pix' ? "00020126580014BR.GOV.BCB.PIX0136..." : null,
            });
        }

        // 3. Find or create Asaas Customer
        let customerId = "";
        const customerRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(email)}`, {
            headers: { "access_token": ASAAS_API_KEY }
        });
        const customerData = await customerRes.json();

        if (customerData.data?.length > 0) {
            customerId = customerData.data[0].id;
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

        // 5. Build Split (professor gets 90% of base price, XPACE keeps 10% + interest surplus)
        const professorFixedSplit = Number((coursePrice * (1 - splitPercent / 100)).toFixed(2));

        const chargePayload: any = {
            customer: customerId,
            billingType: paymentMethod === 'pix' ? 'PIX' : 'CREDIT_CARD',
            value: finalValue,
            dueDate: new Date().toISOString().split("T")[0],
            description: `XTAGE - ${course.title}`,
        };

        // Attach split if professor has Asaas wallet
        if (professorWalletId) {
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
        const chargeRes = await fetch(`${ASAAS_API_URL}/payments`, {
            method: "POST",
            headers: { "access_token": ASAAS_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify(chargePayload)
        });

        const chargeData = await chargeRes.json();

        if (!chargeRes.ok) {
            console.error("Asaas charge error:", { status: chargeRes.status, errors: chargeData.errors });
            throw new Error(chargeData.errors?.[0]?.description || "Erro ao gerar cobrança no Asaas");
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

            // Split audit trail
            if (savedTx?.id && professorWalletId) {
                const platformAmount = Number((finalValue - professorFixedSplit).toFixed(2));
                await supabaseAdmin.from('split_audit').insert({
                    transaction_id: savedTx.id,
                    professor_wallet_id: professorWalletId,
                    professor_amount: professorFixedSplit,
                    platform_amount: platformAmount,
                    total_amount: finalValue,
                    split_percent: splitPercent,
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

    } catch (error: any) {
        console.error("🔴 CHECKOUT ERROR:", error?.message || "Unknown error");
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
