import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/utils/rate-limit";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export async function POST(request: Request) {
    if (process.env.PRE_LAUNCH === 'true') {
        return NextResponse.json(
            { error: 'Cadastros abertos em 29 de Abril. Junte-se à lista de espera em xtage.app!' },
            { status: 503 }
        );
    }

    const ip = getClientIp(request);
    const { limited } = await rateLimit(`auth:register:${ip}`, 3);
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
        const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email,
            password,
            options: { redirectTo: `${SITE_URL}/auth/callback?next=/dashboard` },
        });

        if (linkError) {
            console.error("[REGISTER] Falha ao enviar email de verificação:", linkError.message);
            // Usuário foi criado mas email não foi enviado — retorna aviso ao frontend
            return NextResponse.json({
                success: true,
                userId: data.user.id,
                warning: "Conta criada, mas não foi possível enviar o e-mail de verificação. Use 'Esqueci minha senha' para acessar.",
            });
        }

        return NextResponse.json({ success: true, userId: data.user.id });
    } catch (error: any) {
        console.error("Register API error:", error?.message);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
