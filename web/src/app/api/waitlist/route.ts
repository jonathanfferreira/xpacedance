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

        // Resend: adiciona às audiences e envia e-mail de confirmação
        if (process.env.RESEND_API_KEY) {
            try {
                const { Resend } = await import('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);

                const isCreator = type === 'criador';
                const cleanEmail = email.toLowerCase().trim();
                const firstName = name.trim().split(' ')[0];
                const lastName = name.trim().split(' ').slice(1).join(' ') || undefined;

                const contactPayload = {
                    email: cleanEmail,
                    firstName,
                    lastName,
                    unsubscribed: false,
                };

                // 1. Audience principal "Público" — todos os leads
                const mainAudienceId = process.env.RESEND_AUDIENCE_ID || '8cfa20f6-1adb-4921-9e48-5ee36453543c';
                await resend.contacts.create({ audienceId: mainAudienceId, ...contactPayload });

                // 2. Audience segmentada por tipo (Alunos ou Professores)
                //    Crie as audiences no Resend e adicione os IDs no Vercel:
                //    RESEND_AUDIENCE_ALUNOS_ID e RESEND_AUDIENCE_PROFESSORES_ID
                const typeAudienceId = isCreator
                    ? process.env.RESEND_AUDIENCE_PROFESSORES_ID
                    : process.env.RESEND_AUDIENCE_ALUNOS_ID;

                if (typeAudienceId) {
                    await resend.contacts.create({ audienceId: typeAudienceId, ...contactPayload });
                }

                // 3. E-mail de confirmação personalizado por tipo
                const subject = isCreator
                    ? '🎓 Sua escola no XTAGE está reservada!'
                    : '🎵 Você está na lista VIP do XTAGE!';

                await resend.emails.send({
                    from: 'XTAGE <contato@xtage.app>',
                    to: [cleanEmail],
                    subject,
                    tags: [
                        { name: 'type', value: isCreator ? 'professor' : 'aluno' },
                        { name: 'source', value: 'waitlist' },
                    ],
                    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;overflow:hidden;max-width:600px;width:100%">
        <tr>
          <td style="background:linear-gradient(135deg,${isCreator ? '#eb00bc,#6324b2' : '#6324b2,#eb00bc'});padding:32px 40px;text-align:center">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:4px;text-transform:uppercase;font-family:monospace">XTAGE — PRÉ-LANÇAMENTO</p>
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:2px">Você está dentro! 🔥</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="color:#ccc;font-size:16px;line-height:1.6;margin:0 0 24px">Oi, <strong style="color:#fff">${name.trim()}</strong>!</p>

            <!-- Badge do tipo -->
            <p style="margin:0 0 16px">
              <span style="display:inline-block;background:${isCreator ? 'rgba(235,0,188,0.15)' : 'rgba(99,36,178,0.15)'};border:1px solid ${isCreator ? 'rgba(235,0,188,0.3)' : 'rgba(99,36,178,0.3)'};border-radius:999px;padding:4px 14px;font-size:11px;font-family:monospace;letter-spacing:3px;text-transform:uppercase;color:${isCreator ? '#eb00bc' : '#9c6fe8'}">
                ${isCreator ? '🎓 Professor' : '🎵 Aluno'}
              </span>
            </p>

            <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 24px">
              ${isCreator
                ? 'Quando abrirmos as portas, você vai ser um dos primeiros a poder <strong style="color:#eb00bc">cadastrar sua escola</strong>, criar seus cursos e começar a monetizar no XTAGE.'
                : 'Quando abrirmos as portas, você vai ter acesso antecipado para <strong style="color:#9c6fe8">explorar os melhores cursos de dança</strong> do Brasil.'}
            </p>

            <!-- Data de lançamento -->
            <table cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:8px;padding:20px 24px;margin:0 0 24px;width:100%">
              <tr>
                <td>
                  <p style="margin:0 0 4px;color:#666;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:monospace">DATA DE LANÇAMENTO</p>
                  <p style="margin:0;color:#fff;font-size:24px;font-weight:900;font-family:monospace">29 DE ABRIL DE 2026</p>
                  <p style="margin:4px 0 0;color:#666;font-size:11px;font-family:monospace;letter-spacing:2px;text-transform:uppercase">Dia Internacional da Dança</p>
                </td>
              </tr>
            </table>

            <!-- O que esperar -->
            <table cellpadding="0" cellspacing="0" style="background:#0d0d0d;border:1px solid #1a1a1a;border-radius:8px;padding:20px 24px;margin:0 0 32px;width:100%">
              <tr><td>
                <p style="margin:0 0 12px;color:#666;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-family:monospace">O que vem por aí</p>
                ${isCreator ? `
                <p style="margin:0 0 8px;color:#aaa;font-size:13px;line-height:1.5">🏫 &nbsp;Sua própria escola de dança online</p>
                <p style="margin:0 0 8px;color:#aaa;font-size:13px;line-height:1.5">📹 &nbsp;Upload e venda de cursos em vídeo</p>
                <p style="margin:0 0 8px;color:#aaa;font-size:13px;line-height:1.5">💳 &nbsp;Pagamentos automáticos no Brasil</p>
                <p style="margin:0;color:#aaa;font-size:13px;line-height:1.5">📊 &nbsp;Dashboard com métricas dos seus alunos</p>
                ` : `
                <p style="margin:0 0 8px;color:#aaa;font-size:13px;line-height:1.5">🎓 &nbsp;Cursos com os melhores professores</p>
                <p style="margin:0 0 8px;color:#aaa;font-size:13px;line-height:1.5">📱 &nbsp;App para assistir onde quiser</p>
                <p style="margin:0 0 8px;color:#aaa;font-size:13px;line-height:1.5">🏅 &nbsp;Certificados de conclusão</p>
                <p style="margin:0;color:#aaa;font-size:13px;line-height:1.5">👥 &nbsp;Comunidade exclusiva de dançarinos</p>
                `}
              </td></tr>
            </table>

            <p style="color:#666;font-size:13px;line-height:1.6;margin:0 0 32px">
              Guarda esse e-mail. No dia 29 de Abril você será notificado em primeira mão — antes de todo mundo.
              ${whatsapp ? '<br><br>Como você deixou seu WhatsApp, também vamos te adicionar ao grupo VIP. 🤙' : ''}
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
                console.error('[WAITLIST] Falha no Resend:', JSON.stringify(emailErr));
            }
        }

        // Contagens para feedback ao usuário
        const [{ count: total }, { count: alunos }, { count: professores }] = await Promise.all([
            supabaseAdmin.from('waitlist').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('waitlist').select('id', { count: 'exact', head: true }).eq('type', 'aluno'),
            supabaseAdmin.from('waitlist').select('id', { count: 'exact', head: true }).eq('type', 'criador'),
        ]);

        return NextResponse.json({ ok: true, count: total || 1, alunos: alunos || 0, professores: professores || 0 });
    } catch {
        return NextResponse.json({ error: 'Erro inesperado.' }, { status: 500 });
    }
}

export async function GET() {
    const [{ count: total }, { count: alunos }, { count: professores }] = await Promise.all([
        supabaseAdmin.from('waitlist').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('waitlist').select('id', { count: 'exact', head: true }).eq('type', 'aluno'),
        supabaseAdmin.from('waitlist').select('id', { count: 'exact', head: true }).eq('type', 'criador'),
    ]);

    return NextResponse.json({ count: total || 0, alunos: alunos || 0, professores: professores || 0 });
}
