import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Política de Privacidade — XPACE',
    description: 'Como a XPACE coleta, usa e protege seus dados pessoais conforme a LGPD (Lei 13.709/2018).',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-[#ededed] font-sans">
            <div className="max-w-3xl mx-auto px-6 py-20">
                <Link href="/" className="text-xs text-[#555] hover:text-white font-mono uppercase tracking-widest transition-colors mb-10 inline-block">
                    ← Voltar
                </Link>

                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight mb-2">
                    Política de Privacidade
                </h1>
                <p className="text-[#555] text-sm font-mono mb-12">Última atualização: 26 de março de 2026</p>

                <div className="prose prose-invert prose-sm max-w-none space-y-8 text-[#aaa] leading-relaxed">

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">1. Quem somos</h2>
                        <p>
                            XPACE é uma plataforma de cursos online para escolas de dança, operada por <strong>XPACE Tecnologia Ltda.</strong>,
                            com sede no Brasil. Para dúvidas sobre privacidade, entre em contato: <a href="mailto:privacidade@xtage.app" className="text-primary hover:underline">privacidade@xtage.app</a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">2. Dados que coletamos</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Cadastro:</strong> nome completo, e-mail, senha (criptografada), foto de perfil</li>
                            <li><strong>Pagamentos:</strong> dados de cobrança processados pelo Stripe — não armazenamos número de cartão</li>
                            <li><strong>Uso da plataforma:</strong> progresso em aulas, XP ganho, conquistas desbloqueadas</li>
                            <li><strong>Técnicos:</strong> endereço IP, tipo de navegador, logs de acesso</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">3. Como usamos seus dados</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Fornecer e melhorar nossos serviços</li>
                            <li>Processar pagamentos e emitir certificados</li>
                            <li>Enviar notificações relevantes sobre seu progresso</li>
                            <li>Cumprir obrigações legais</li>
                        </ul>
                        <p className="mt-3">Não vendemos seus dados a terceiros.</p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">4. Base legal (LGPD — Art. 7)</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Execução de contrato</strong> — para prestação do serviço contratado</li>
                            <li><strong>Consentimento</strong> — para comunicações de marketing (você pode revogar a qualquer momento)</li>
                            <li><strong>Obrigação legal</strong> — para retenção fiscal e compliance</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">5. Seus direitos (LGPD — Art. 18)</h2>
                        <p>Você tem direito a:</p>
                        <ul className="list-disc list-inside space-y-2 mt-2">
                            <li>Confirmar a existência de tratamento de dados</li>
                            <li>Acessar seus dados</li>
                            <li>Corrigir dados incompletos ou incorretos</li>
                            <li><strong>Excluir sua conta e dados</strong> — solicite pelo chat de suporte ou pelo e-mail privacidade@xtage.app</li>
                            <li>Portabilidade dos dados</li>
                            <li>Revogar consentimento</li>
                        </ul>
                        <p className="mt-3">Prazo de resposta: até 15 dias corridos.</p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">6. Cookies</h2>
                        <p>
                            Usamos cookies estritamente necessários para autenticação e sessão. Não utilizamos cookies de rastreamento de terceiros para fins publicitários sem seu consentimento.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">7. Retenção de dados</h2>
                        <p>
                            Mantemos seus dados enquanto sua conta estiver ativa. Após solicitação de exclusão, removemos ou anonimizamos os dados em até 30 dias, exceto quando obrigados por lei a retê-los.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">8. Segurança</h2>
                        <p>
                            Utilizamos infraestrutura segura (Supabase/PostgreSQL com RLS, Stripe PCI-DSS, CDN Bunny.net) e comunicação criptografada via HTTPS/TLS.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">9. Contato e DPO</h2>
                        <p>
                            Encarregado de Dados (DPO): <a href="mailto:privacidade@xtage.app" className="text-primary hover:underline">privacidade@xtage.app</a><br />
                            Autoridade Nacional de Proteção de Dados (ANPD): <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">gov.br/anpd</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
