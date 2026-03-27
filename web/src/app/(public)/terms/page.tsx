import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Termos de Uso — XPACE',
    description: 'Termos e condições de uso da plataforma XPACE.',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-[#ededed] font-sans">
            <div className="max-w-3xl mx-auto px-6 py-20">
                <Link href="/" className="text-xs text-[#555] hover:text-white font-mono uppercase tracking-widest transition-colors mb-10 inline-block">
                    ← Voltar
                </Link>

                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight mb-2">
                    Termos de Uso
                </h1>
                <p className="text-[#555] text-sm font-mono mb-12">Última atualização: 26 de março de 2026</p>

                <div className="prose prose-invert prose-sm max-w-none space-y-8 text-[#aaa] leading-relaxed">

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">1. Aceitação</h2>
                        <p>
                            Ao criar uma conta ou utilizar a plataforma XPACE você concorda com estes Termos. Se não concordar, não utilize o serviço.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">2. Conta de Usuário</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Você é responsável pela segurança da sua senha</li>
                            <li>Uma conta por pessoa — contas compartilhadas são proibidas</li>
                            <li>Você deve ter ao menos 13 anos para utilizar a plataforma</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">3. Licença de Conteúdo</h2>
                        <p>
                            Ao adquirir um curso, você recebe uma licença <strong>pessoal, intransferível e não exclusiva</strong> para assistir ao conteúdo.
                            É proibido gravar, redistribuir, revender ou compartilhar acesso.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">4. Pagamentos e Reembolsos</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Pagamentos processados pelo Stripe (cartão de crédito/débito)</li>
                            <li>Reembolso disponível em até <strong>7 dias corridos</strong> após a compra, sem necessidade de justificativa (Código de Defesa do Consumidor — Art. 49)</li>
                            <li>Após 7 dias, reembolsos são avaliados caso a caso pelo suporte</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">5. Conduta Proibida</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Fazer engenharia reversa do conteúdo ou da plataforma</li>
                            <li>Usar bots ou scripts automatizados</li>
                            <li>Assédio ou comportamento abusivo com outros usuários</li>
                            <li>Publicar conteúdo ilegal ou ofensivo (para criadores)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">6. Criadores de Conteúdo</h2>
                        <p>
                            Professores que publicam cursos na XPACE concordam adicionalmente com nossos <em>Termos para Criadores</em>,
                            incluindo split de receita e responsabilidade sobre a qualidade e legalidade do conteúdo publicado.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">7. Limitação de Responsabilidade</h2>
                        <p>
                            A XPACE não se responsabiliza por danos indiretos decorrentes do uso da plataforma. Nossa responsabilidade máxima é limitada ao valor pago pelo usuário nos últimos 12 meses.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">8. Suspensão e Encerramento</h2>
                        <p>
                            Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos, com aviso prévio quando possível.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">9. Lei Aplicável</h2>
                        <p>
                            Estes Termos são regidos pelas leis brasileiras. Foro eleito: comarca de São Paulo/SP.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest mb-3">10. Contato</h2>
                        <p>
                            <a href="mailto:contato@xtage.app" className="text-primary hover:underline">contato@xtage.app</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
