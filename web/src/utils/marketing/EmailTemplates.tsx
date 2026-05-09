import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    render,
} from '@react-email/components';

interface WelcomeEmailProps {
    studentName: string;
    courseName: string;
    magicLinkUrl?: string; // Para login magico
    loginEmail?: string;
    loginPassword?: string;
}

export const WelcomeEmail = ({
    studentName,
    courseName,
    magicLinkUrl,
    loginEmail,
    loginPassword,
    brandColor = '#6324b2', // Fallback da Plataforma
    brandLogo = 'https://xtage.app/images/logo-light.png',
}: WelcomeEmailProps & { brandColor?: string; brandLogo?: string }) => {
    const previewText = `Seu acesso ao XPACE DANCE: ${courseName} foi liberado!`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header com Logo XPACE DANCE ou Parceiro */}
                    <Section style={header}>
                        <Img
                            src={brandLogo}
                            width="150"
                            alt="Logo"
                            style={logo}
                        />
                    </Section>

                    {/* Banner Hero */}
                    <Section style={heroBanner}>
                        <Heading style={h1}>Bem-vindo ao XPACE DANCE, {studentName}!</Heading>
                        <Text style={heroText}>Seu pagamento foi confirmado e seu acesso ao <strong>{courseName}</strong> está pronto para começar.</Text>
                    </Section>

                    {/* Dados de Acesso */}
                    <Section style={accessCard}>
                        <Heading style={h2}>Seus Dados de Acesso</Heading>

                        <Text style={text}>
                            <strong>E-mail:</strong> {loginEmail}
                        </Text>
                        {loginPassword && (
                            <Text style={text}>
                                <strong>Senha:</strong> <span style={passwordBadge}>{loginPassword}</span>
                            </Text>
                        )}

                        {magicLinkUrl ? (
                            <Section style={btnContainer}>
                                <Link href={magicLinkUrl} style={{ ...button, backgroundColor: brandColor }}>
                                    Acessar com Magic Link
                                </Link>
                            </Section>
                        ) : (
                            <Section style={btnContainer}>
                                <Link href="https://xtage.app/login" style={{ ...button, backgroundColor: brandColor }}>
                                    Acessar Plataforma
                                </Link>
                            </Section>
                        )}
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Em caso de dúvidas, responda a este e-mail ou contate nosso suporte. <br />
                            <Link href="https://xtage.app" style={footerLink}>xtage.app</Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Funcao auxiliar para renderizar HTML (usado no resend)
export const renderWelcomeEmail = async (props: WelcomeEmailProps & { brandColor?: string; brandLogo?: string }) => {
    return await render(<WelcomeEmail {...props} />);
}

// Styles
const main = {
    backgroundColor: '#050505',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    width: '100%',
    maxWidth: '600px',
};

const header = {
    padding: '24px',
    backgroundColor: '#0a0a0a',
    borderBottom: '1px solid #1a1a1a',
    textAlign: 'center' as const,
};

const logo = {
    margin: '0 auto',
};

const heroBanner = {
    padding: '32px 24px',
    backgroundColor: '#0a0a0a',
    backgroundImage: 'linear-gradient(to bottom, #111111, #0a0a0a)',
    textAlign: 'center' as const,
};

const h1 = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 'bold',
    marginTop: '0',
    marginBottom: '16px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
};

const heroText = {
    color: '#a3a3a3',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0',
};

const accessCard = {
    padding: '32px 24px',
    backgroundColor: '#0f0f0f',
    border: '1px solid #222222',
    borderRadius: '8px',
    margin: '24px',
};

const h2 = {
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: '600',
    marginTop: '0',
    marginBottom: '20px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderBottom: '1px solid #222',
    paddingBottom: '12px'
};

const text = {
    color: '#d4d4d4',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 12px 0',
};

const passwordBadge = {
    backgroundColor: '#222',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    letterSpacing: '1px'
};

const btnContainer = {
    textAlign: 'center' as const,
    marginTop: '32px',
};

const button = {
    backgroundColor: '#6324b2', // Roxo Primary XPACE DANCE
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    width: '100%',
    padding: '16px 0',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
};

const footer = {
    padding: '0 24px',
    textAlign: 'center' as const,
};

const footerText = {
    color: '#666666',
    fontSize: '12px',
    lineHeight: '20px',
};

const footerLink = {
    color: '#6324b2',
    textDecoration: 'underline',
};
