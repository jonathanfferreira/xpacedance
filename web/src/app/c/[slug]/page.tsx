import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Award, Calendar, Shield } from 'lucide-react';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Props = { params: Promise<{ slug: string }> };

async function getCertificate(slug: string) {
    const { data, error } = await supabaseAdmin
        .from('certificates')
        .select(`
            id, issued_at, public_slug, completion_pct,
            users!user_id(full_name, avatar_url),
            courses!course_id(title, description, thumbnail_url),
            tenants!tenant_id(name, logo_url, brand_color)
        `)
        .eq('public_slug', slug)
        .single();
    if (error) return null;
    return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const cert = await getCertificate(slug);
    if (!cert) return { title: 'Certificado inválido' };
    const user = cert.users as any;
    const course = cert.courses as any;
    return {
        title: `Certificado de ${user?.full_name || 'Aluno'} — ${course?.title}`,
        description: `${user?.full_name} concluiu o curso "${course?.title}" com sucesso.`,
    };
}

export default async function CertificatePage({ params }: Props) {
    const { slug } = await params;
    const cert = await getCertificate(slug);
    if (!cert) return notFound();

    const user = cert.users as any;
    const course = cert.courses as any;
    const tenant = cert.tenants as any;
    const brandColor = tenant?.brand_color || '#6324b2';
    const issuedDate = new Date(cert.issued_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    return (
        <div className="min-h-screen bg-[#020202] flex flex-col items-center justify-center p-6">
            {/* JSON-LD para SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'EducationalOccupationalCredential',
                        name: `Certificado: ${course?.title}`,
                        description: `Conclusão de curso por ${user?.full_name}`,
                        dateCreated: cert.issued_at,
                        credentialCategory: 'Certificate',
                        recognizedBy: { '@type': 'Organization', name: tenant?.name || 'Xpace On' },
                    })
                }}
            />

            {/* Certificado */}
            <div
                className="w-full max-w-2xl bg-[#0a0a0a] border rounded-sm overflow-hidden"
                style={{ borderColor: `${brandColor}33` }}
            >
                {/* Header colorido */}
                <div className="h-2" style={{ backgroundColor: brandColor }} />

                <div className="p-8 sm:p-12">
                    {/* Logo da escola */}
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            {tenant?.logo_url && (
                                <Image src={tenant.logo_url} alt={tenant.name} width={32} height={32} className="rounded" />
                            )}
                            <span className="text-white font-bold text-sm uppercase tracking-widest">
                                {tenant?.name || 'Xpace On'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield size={14} style={{ color: brandColor }} />
                            <span className="text-[#555] text-[10px] font-mono">{cert.public_slug}</span>
                        </div>
                    </div>

                    {/* Corpo */}
                    <div className="text-center mb-10">
                        <div
                            className="inline-flex w-16 h-16 rounded-full items-center justify-center mb-6"
                            style={{ backgroundColor: `${brandColor}20`, border: `1px solid ${brandColor}40` }}
                        >
                            <Award size={28} style={{ color: brandColor }} />
                        </div>

                        <p className="text-[#555] text-xs font-mono uppercase tracking-[0.3em] mb-3">Certificado de Conclusão</p>

                        <h1 className="text-white text-xl font-bold uppercase tracking-tight mb-1">
                            {user?.full_name || 'Aluno'}
                        </h1>
                        <p className="text-[#666] text-sm mb-8">concluiu com êxito o curso</p>

                        <div
                            className="inline-block border rounded p-5 mb-8"
                            style={{ borderColor: `${brandColor}33`, backgroundColor: `${brandColor}08` }}
                        >
                            <h2 className="text-white text-2xl font-bold uppercase tracking-tight">
                                {course?.title}
                            </h2>
                            {course?.description && (
                                <p className="text-[#888] text-sm mt-2 max-w-sm">{course.description}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-2 text-[#555]">
                            <Calendar size={12} />
                            <span className="text-xs font-mono">{issuedDate}</span>
                        </div>
                    </div>

                    {/* Rodapé / Assinatura */}
                    <div className="border-t pt-6 flex items-center justify-between" style={{ borderColor: '#1a1a1a' }}>
                        <div>
                            <p className="text-white text-sm font-bold">{tenant?.name}</p>
                            <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest">Certificado Digital</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[#333] text-[10px] font-mono">Verificável em</p>
                            <p className="text-[#555] text-[10px] font-mono">xpace.on/c/{cert.public_slug}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
                <p className="text-[#555] text-xs font-mono mb-4">Este é um certificado digital verificável.</p>
                <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 text-white border border-[#333] px-4 py-2 rounded text-xs font-mono uppercase tracking-widest hover:border-white/30 transition-colors"
                >
                    Ver mais cursos
                </Link>
            </div>
        </div>
    );
}
