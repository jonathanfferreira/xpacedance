import { Metadata } from 'next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { Award, Download, Share2 } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Certificado de Conclusão | XPACE DANCE',
};

interface Params {
    params: Promise<{ courseId: string }>;
}

export default async function CertificadoPage({ params }: Params) {
    const { courseId } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Buscar dados do curso e do usuário
    const [
        { data: course },
        { data: userData },
    ] = await Promise.all([
        supabase.from('courses').select('title, tenants(name, logo_url)').eq('id', courseId).single(),
        supabase.from('users').select('full_name').eq('id', user.id).single(),
    ]);

    if (!course) {
        redirect('/dashboard/cursos');
    }

    const tenantName = Array.isArray(course.tenants) ? course.tenants[0]?.name : (course.tenants as any)?.name || 'Academia XPACE DANCE Oficial';
    const studentName = userData?.full_name || user.user_metadata?.full_name || 'Estudante XPACE DANCE';
    const completionDate = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', day: 'numeric' });

    return (
        <div className="max-w-5xl mx-auto pb-20 px-4 pt-10 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
                <div>
                    <h1 className="font-heading text-4xl mb-2 tracking-tight uppercase flex items-center gap-3">
                        <Award className="text-primary w-10 h-10" />
                        <span className="text-transparent bg-clip-text text-gradient-neon">Mural de Honra</span>
                    </h1>
                    <p className="text-[#888] font-sans">Seu certificado oficial e criptografado de conclusão na rede XPACE DANCE.</p>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-black border border-[#333] hover:border-white transition-colors text-white rounded font-bold text-sm">
                        <Share2 size={16} /> COMPARTILHAR
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-gray-200 transition-colors rounded font-bold text-sm">
                        <Download size={16} /> SALVAR PDF
                    </button>
                </div>
            </div>

            {/* Quadro do Certificado */}
            <div className="relative w-full aspect-[1.414/1] md:aspect-[1.6/1] max-w-4xl mx-auto rounded-xl p-[2px] bg-gradient-to-br from-primary via-[#222] to-accent/50 shadow-[0_0_50px_rgba(99,36,178,0.15)] select-none">

                {/* Textura Cyberpunk base */}
                <div className="absolute inset-0 bg-[#050505] rounded-[10px] overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('/images/noise.png')] mix-blend-overlay"></div>

                    {/* Linhas Geométricas (Bordas futuristas) */}
                    <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-primary/50 m-8"></div>
                    <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-primary/50 m-8"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-primary/50 m-8"></div>
                    <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-primary/50 m-8"></div>

                    {/* Fundo glow central */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-primary/5 blur-[120px] rounded-full"></div>
                </div>

                {/* Conteúdo Central */}
                <div className="relative w-full h-full p-8 md:p-16 flex flex-col justify-center items-center text-center z-10">

                    {/* Logo/Header */}
                    <div className="mb-10 w-full flex justify-between items-start opacity-80">
                        <div className="flex flex-col text-left">
                            <Image src="/images/xpace-logo-branca.png" alt="XPACE" width={140} height={40} className="object-contain" />
                            <span className="text-[8px] font-mono tracking-widest text-[#666] uppercase mt-2">Autenticidade Verificada na Blockchain</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-mono tracking-widest text-primary uppercase border border-primary/30 px-3 py-1 rounded bg-primary/10">ID: {courseId.split('-')[0].toUpperCase()}</p>
                        </div>
                    </div>

                    <h2 className="text-xl md:text-2xl font-mono tracking-[0.3em] text-[#888] uppercase mb-4">Certificado de Conclusão</h2>

                    <h3 className="text-4xl md:text-6xl font-black font-heading text-white uppercase mb-8 leading-none" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                        {studentName}
                    </h3>

                    <p className="text-sm md:text-base font-sans text-[#aaa] max-w-2xl mx-auto leading-relaxed mb-8">
                        Por seu mérito e dedicação em completar integralmente a excelência exigida no treinamento de <span className="text-white font-bold">{course.title}</span>, garantindo proficiência técnica.
                    </p>

                    <div className="flex w-full justify-between items-end mt-auto pb-4 px-10">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase font-mono tracking-widest text-[#555] mb-2">{tenantName}</span>
                            <div className="w-40 h-[1px] bg-gradient-to-r from-transparent via-[#444] to-transparent"></div>
                            <span className="text-xs text-[#888] mt-2 italic font-serif">Escola Instrutora</span>
                        </div>

                        {/* Selo Central */}
                        <div className="absolute left-1/2 bottom-12 -translate-x-1/2 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full border border-accent/40 bg-accent/5 flex items-center justify-center relative overflow-hidden">
                                <Award className="w-8 h-8 text-accent opacity-80" />
                                <div className="absolute -inset-1 border border-accent/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <span className="text-sm font-bold font-sans text-white mb-2">{completionDate}</span>
                            <div className="w-40 h-[1px] bg-gradient-to-r from-transparent via-[#444] to-transparent"></div>
                            <span className="text-xs text-[#888] mt-2 italic font-serif">Data de Emissão</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
