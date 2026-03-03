import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/utils/rate-limit";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export async function POST(request: Request) {
    const ip = getClientIp(request);
    const { limited } = rateLimit(`auth:register:${ip}`, 3);
    if (limited) {
        return NextResponse.json(
            { error: "Muitas tentativas de registro. Tente novamente em 1 minuto." },
            { status: 429, headers: { "Retry-After": "60" } }
        );
    }

    try {
        const body = await request.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Nome, e-mail e senha são obrigatórios." }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: "A senha precisa ter no mínimo 8 caracteres." }, { status: 400 });
        }

        if (!SITE_URL) {
            return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 500 });
        }

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: false,
            user_metadata: { full_name: name },
        });

        if (error) {
            const msg = error.message.includes("already been registered")
                ? "Este e-mail já possui uma conta. Faça login."
                : error.message;
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        // Send verification email via Supabase magic link
        await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email,
            password,
            options: { redirectTo: `${SITE_URL}/auth/callback?next=/dashboard` },
        });

        return NextResponse.json({ success: true, userId: data.user.id });
    } catch (error: any) {
        console.error("Register API error:", error?.message);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
