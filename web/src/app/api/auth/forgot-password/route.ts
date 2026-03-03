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
    const { limited } = rateLimit(`auth:forgot:${ip}`, 3);
    if (limited) {
        return NextResponse.json(
            { error: "Muitas tentativas. Tente novamente em 1 minuto." },
            { status: 429, headers: { "Retry-After": "60" } }
        );
    }

    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
        }

        if (!SITE_URL) {
            return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 500 });
        }

        // Always return success to avoid email enumeration
        await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: { redirectTo: `${SITE_URL}/auth/callback?next=/dashboard/config` },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Forgot-password API error:", error?.message);
        // Return success even on error to prevent email enumeration
        return NextResponse.json({ success: true });
    }
}
