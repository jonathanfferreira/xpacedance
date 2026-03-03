import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermosPage() {
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
                        Termos de <span className="text-secondary">Uso</span>
                    </h1>
                    <p className="text-[#888] font-mono tracking-widest text-xs uppercase">Última atualização: Fevereiro de 2026</p>
                </div>

                <div className="space-y-12 font-sans text-[#ccc] leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
                        <p className="mb-4">
                            Ao acessar e utilizar a plataforma XTAGE, você concorda em cumprir estes termos de serviço
                            e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de
                            usar ou acessar este site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Uso da Licença</h2>
                        <ul className="list-disc pl-5 space-y-3">
                            <li>Modificar ou copiar os materiais de vídeo (aulas, cursos);</li>
                            <li>Usar os materiais para qualquer finalidade comercial na forma de pirataria;</li>
                            <li>Tentar descompilar ou fazer engenharia reversa de qualquer software contido no site XTAGE;</li>
                            <li>Remover quaisquer direitos autorais ou outras notações de propriedade dos materiais; ou</li>
                            <li>Transferir os materiais para outra pessoa ou &apos;espelhar&apos; os materiais em qualquer outro servidor.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Sobre Assinaturas e Reembolsos</h2>
                        <p className="mb-4">
                            De acordo com o Código de Defesa do Consumidor brasileiro, assinaturas de produtos digitais preveem
                            um prazo de garantia incondicional de 7 dias na primeira compra. Renovação de planos não contam para este prazo.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Política Anti-Pirataria</h2>
                        <p className="mb-4">
                            Empregamos rastreamento de IP e limites de sessão simultânea atrelados à conta do usuário. O compartilhamento
                            maciço de senhas resultará no bloqueio automático da conta, sem direito a reembolso, para proteção do trabalho
                            intelectual dos criadores hospedados nesta plataforma.
                        </p>
                    </section>
                </div>
            </main>
        </div>
    )
}
