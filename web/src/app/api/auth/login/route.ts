import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/utils/rate-limit";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    const ip = getClientIp(request);
    const { limited } = rateLimit(`auth:login:${ip}`, 10);
    if (limited) {
        return NextResponse.json(
            { error: "Muitas tentativas de login. Tente novamente em 1 minuto." },
            { status: 429, headers: { "Retry-After": "60" } }
        );
    }

    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
        }

        // Use admin client to verify credentials server-side
        const { data, error } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json(
                { error: error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            session: data.session,
            user: { id: data.user.id, email: data.user.email },
        });
    } catch (error: any) {
        console.error("Login API error:", error?.message);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
