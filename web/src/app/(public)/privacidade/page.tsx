import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacidadePage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
            <div className="fixed top-0 left-0 w-full h-20 bg-black/80 backdrop-blur-md border-b border-[#222] z-50 px-6 flex items-center">
                <Link href="/" className="flex items-center gap-2 text-[#888] hover:text-white transition-colors uppercase tracking-widest font-mono text-xs">
                    <ArrowLeft size={16} /> Voltar para o início
                </Link>
            </div>

            <main className="max-w-3xl mx-auto pt-40 pb-20 px-6">
                <div className="mb-16">
                    <h1 className="font-heading text-5xl md:text-6xl uppercase tracking-tighter mb-4 text-white">
                        Política de <span className="text-secondary">Privacidade</span>
                    </h1>
                    <p className="text-[#888] font-mono tracking-widest text-xs uppercase">Última atualização: Fevereiro de 2026</p>
                </div>

                <div className="space-y-12 font-sans text-[#ccc] leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Coleta de Dados</h2>
                        <p className="mb-4">
                            Em nossa plataforma XPACE DANCE, coletamos apenas os dados essenciais para o funcionamento
                            dos serviços de educação e streaming. Isso inclui: e-mail de registro, nome de perfil e
                            histórico de visualização (para progresso e XP).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Cookies e Rastreamento</h2>
                        <p className="mb-4">
                            Utilizamos Cookies de Sessão (necessários) para manter você logado de forma segura via Supabase.
                            Também utilizamos analytics básicos não-intrusivos para melhorar nossa biblioteca de cursos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Pagamentos Seguros</h2>
                        <p className="mb-4">
                            Todo processamento financeiro é realizado pela Instituição Financeira homologada pelo BACEN (Asaas).
                            O XPACE DANCE não armazena números de cartão de crédito brutos em nosso banco de dados.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. OAuth e Redes Sociais</h2>
                        <p className="mb-4">
                            Ao criar conta via Apple ou Google, armazenamos apenas o hash de identidade e endereço de e-mail liberado pelo seu provedor social.
                            Você poderá desvincular seu acesso social a qualquer momento no seu Painel de Configurações.
                        </p>
                    </section>

                    <section className="bg-[#111] border border-[#333] p-6 rounded-sm mt-12">
                        <h3 className="font-display text-xl uppercase tracking-widest text-white mb-2">Solicitação de Exclusão</h3>
                        <p className="text-sm">
                            De acordo com a LGPD Brasileira, você pode solicitar a remoção permanente (Data Deletion) de sua conta.
                            Basta acionar o botão de exclusão nas engrenagens de Identidade/Configurações.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    )
}
