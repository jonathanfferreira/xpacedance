import * as React from 'react';

interface InvoiceEmailProps {
    /** Nome do aluno */
    studentName: string;
    /** Email do aluno */
    studentEmail: string;
    /** Nome do curso */
    courseName: string;
    /** Valor pago */
    amount: number;
    /** ID da transação Asaas */
    transactionId: string;
    /** Cor primária da escola (hex) */
    brandColor?: string;
    /** URL do logo da escola */
    brandLogo?: string;
    /** Nome da escola */
    schoolName?: string;
    /** Data da transação */
    paidAt?: string;
}

export const InvoiceEmail: React.FC<InvoiceEmailProps> = ({
    studentName,
    studentEmail,
    courseName,
    amount,
    transactionId,
    brandColor = '#6324b2',
    brandLogo,
    schoolName = 'Xpace On',
    paidAt,
}) => {
    const formattedDate = paidAt
        ? new Date(paidAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const formattedAmount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(amount);

    return (
        <html lang="pt-BR">
            { }
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Recibo de Pagamento — {schoolName}</title>
            </head>
            <body style={{ margin: 0, padding: 0, backgroundColor: '#0a0a0a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <table role="presentation" width="100%" cellSpacing={0} cellPadding={0} style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#111' }}>
                    {/* Header */}
                    <tr>
                        <td style={{ padding: '32px 40px', borderBottom: `3px solid ${brandColor}` }}>
                            <table role="presentation" width="100%" cellSpacing={0} cellPadding={0}>
                                <tr>
                                    <td>
                                        {brandLogo ? (
                                            <img src={brandLogo} alt={schoolName} style={{ height: '40px', objectFit: 'contain' }} />
                                        ) : (
                                            <span style={{ color: brandColor, fontWeight: 700, fontSize: '20px', textTransform: 'uppercase', letterSpacing: '4px' }}>
                                                {schoolName}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span style={{ color: '#555', fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                            Recibo de Pagamento
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {/* Body */}
                    <tr>
                        <td style={{ padding: '40px' }}>
                            {/* Greeting */}
                            <p style={{ color: '#fff', fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>
                                Olá, {studentName}!
                            </p>
                            <p style={{ color: '#888', fontSize: '14px', margin: '0 0 32px', lineHeight: '1.6' }}>
                                Seu pagamento foi confirmado com sucesso. Obrigado por fazer parte da {schoolName}!
                            </p>

                            {/* Course box */}
                            <table role="presentation" width="100%" cellSpacing={0} cellPadding={0} style={{ backgroundColor: '#0a0a0a', borderRadius: '4px', border: `1px solid #222`, marginBottom: '24px' }}>
                                <tr>
                                    <td style={{ padding: '20px' }}>
                                        <p style={{ color: '#555', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px' }}>
                                            Curso
                                        </p>
                                        <p style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>
                                            {courseName}
                                        </p>
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        <p style={{ color: '#555', fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px' }}>
                                            Valor Pago
                                        </p>
                                        <p style={{ color: brandColor, fontSize: '20px', fontWeight: 700, margin: 0, fontFamily: 'monospace' }}>
                                            {formattedAmount}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            {/* Details */}
                            <table role="presentation" width="100%" cellSpacing={0} cellPadding={0} style={{ marginBottom: '32px' }}>
                                {[
                                    { label: 'Email', value: studentEmail },
                                    { label: 'Data do Pagamento', value: formattedDate },
                                    { label: 'ID da Transação', value: transactionId },
                                ].map(({ label, value }) => (
                                    <tr key={label}>
                                        <td style={{ padding: '8px 0', color: '#555', fontSize: '12px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #1a1a1a' }}>
                                            {label}
                                        </td>
                                        <td style={{ padding: '8px 0', color: '#aaa', fontSize: '13px', textAlign: 'right', borderBottom: '1px solid #1a1a1a' }}>
                                            {value}
                                        </td>
                                    </tr>
                                ))}
                            </table>

                            {/* CTA */}
                            <table role="presentation" cellSpacing={0} cellPadding={0}>
                                <tr>
                                    <td>
                                        <a
                                            href={process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xpace.on'}
                                            style={{
                                                display: 'inline-block',
                                                backgroundColor: brandColor,
                                                color: '#fff',
                                                padding: '12px 28px',
                                                borderRadius: '4px',
                                                textDecoration: 'none',
                                                fontWeight: 700,
                                                fontSize: '13px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '2px',
                                            }}
                                        >
                                            Acessar meu Curso →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                        <td style={{ padding: '24px 40px', backgroundColor: '#0a0a0a', borderTop: '1px solid #1a1a1a' }}>
                            <p style={{ color: '#444', fontSize: '11px', textAlign: 'center', margin: 0, lineHeight: '1.6' }}>
                                {schoolName} · Plataforma de Educação Online<br />
                                Este é um email automático. Não responda a esta mensagem.
                            </p>
                        </td>
                    </tr>
                </table>
            </body>
        </html>
    );
};

export default InvoiceEmail;
