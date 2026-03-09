import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { name, email, whatsapp, type } = await request.json();

        if (!name?.trim() || !email?.trim() || !type) {
            return NextResponse.json({ error: 'Nome, e-mail e tipo são obrigatórios.' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
        }

        // Salva na tabela waitlist (upsert — não duplica o mesmo email)
        const { error: dbError } = await supabaseAdmin
            .from('waitlist')
            .upsert(
                { name: name.trim(), email: email.toLowerCase().trim(), whatsapp: whatsapp?.trim() || null, type },
                { onConflict: 'email', ignoreDuplicates: false }
            );

        if (dbError) {
            console.error('[WAITLIST] DB error:', dbError.message);
            return NextResponse.json({ error: 'Erro ao salvar. Tente novamente.' }, { status: 500 });
        }

        // Envia e-mail de confirmação via Resend
        if (process.env.RESEND_API_KEY) {
            try {
                const { Resend } = await import('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);

                const isCreator = type === 'criador';
                await resend.emails.send({
                    from: 'XTAGE <contato@xtage.app>',
                    to: [email],
                    subject: '🔥 Você está na lista VIP do XTAGE!',
                    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;overflow:hidden;max-width:600px;width:100%">
        <tr>
          <td style="background:linear-gradient(135deg,#6324b2,#eb00bc);padding:32px 40px;text-align:center">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:monospace">XTAGE — PRÉ-LANÇAMENTO</p>
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:2px">Você está dentro! 🔥</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="color:#ccc;font-size:16px;line-height:1.6;margin:0 0 24px">Oi, <strong style="color:#fff">${name.trim()}</strong>!</p>
            <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 24px">
              ${isCreator
                ? 'Você se cadastrou como <strong style="color:#eb00bc">Criador de Conteúdo</strong>. Quando abrirmos as portas, você vai ser um dos primeiros a poder cadastrar sua escola, criar seus cursos e começar a monetizar no XTAGE.'
                : 'Você se cadastrou como <strong style="color:#6324b2">Dançarino</strong>. Quando abrirmos as portas, você vai ter acesso antecipado para explorar os melhores cursos de dança do Brasil.'}
            </p>
            <table cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:8px;padding:20px 24px;margin:0 0 32px;width:100%">
              <tr>
                <td>
                  <p style="margin:0 0 4px;color:#666;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:monospace">DATA DE LANÇAMENTO</p>
                  <p style="margin:0;color:#fff;font-size:24px;font-weight:900;font-family:monospace">29 DE MARÇO DE 2026</p>
                </td>
              </tr>
            </table>
            <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 32px">
              Guarda esse e-mail. Quando o app abrir, você será notificado em primeira mão — antes de todo mundo.
            </p>
            <table cellpadding="0" cellspacing="0" style="width:100%">
              <tr>
                <td align="center">
                  <a href="https://xtage.app" style="display:inline-block;background:linear-gradient(135deg,#6324b2,#eb00bc);color:#fff;font-weight:700;font-size:13px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:6px">Visitar XTAGE.APP</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #1a1a1a;text-align:center">
            <p style="margin:0;color:#444;font-size:12px;font-family:monospace">© 2026 XTAGE • <a href="https://xtage.app/privacidade" style="color:#555">Privacidade</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
                });
            } catch (emailErr) {
                // Não-crítico: o lead já foi salvo no banco
                console.warn('[WAITLIST] Falha ao enviar e-mail de confirmação:', emailErr);
            }
        }

        // Busca contagem total para feedback ao usuário
        const { count } = await supabaseAdmin
            .from('waitlist')
            .select('id', { count: 'exact', head: true });

        return NextResponse.json({ ok: true, count: count || 1 });
    } catch {
        return NextResponse.json({ error: 'Erro inesperado.' }, { status: 500 });
    }
}

export async function GET() {
    // Contagem pública — sem expor dados dos leads
    const { count } = await supabaseAdmin
        .from('waitlist')
        .select('id', { count: 'exact', head: true });

    return NextResponse.json({ count: count || 0 });
}
