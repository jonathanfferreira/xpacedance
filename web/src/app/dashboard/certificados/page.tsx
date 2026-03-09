import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Image from 'next/image';
import { Award, Download, ExternalLink, BookOpen } from 'lucide-react';

async function getUserCertificates() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, certificates: [] };

    const { data: certs } = await supabase
        .from('certificates')
        .select('id, issued_at, public_slug, courses!course_id(title, thumbnail_url), tenants!tenant_id(name, logo_url, brand_color)')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

    return { user, certificates: certs || [] };
}

export default async function CertificatesPage() {
    const { user, certificates } = await getUserCertificates();

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64 text-[#555]">
                <p className="font-mono text-sm uppercase tracking-widest">Faça login para ver seus certificados.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-10">
                <h1 className="font-heading text-4xl mb-2 tracking-tight uppercase text-white">
                    Meus Certificados
                </h1>
                <p className="text-[#888] font-sans text-sm">
                    Cursos concluídos com 100% de aproveitamento.
                </p>
            </div>

            {certificates.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[#222] rounded">
                    <Award size={48} className="text-[#333] mx-auto mb-4" />
                    <h2 className="text-white font-bold text-lg uppercase tracking-wide mb-2">Nenhum certificado ainda</h2>
                    <p className="text-[#555] text-sm mb-6">Complete 100% de um curso para receber seu certificado.</p>
                    <Link
                        href="/dashboard/cursos"
                        className="inline-flex items-center gap-2 border border-[#333] text-white px-4 py-2 rounded text-xs font-mono uppercase tracking-widest hover:border-white/30 transition-colors"
                    >
                        <BookOpen size={14} />
                        Ver meus cursos
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {(certificates as any[]).map(cert => {
                        const course = cert.courses;
                        const tenant = cert.tenants;
                        const brandColor = tenant?.brand_color || '#6324b2';
                        const issuedDate = new Date(cert.issued_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', year: 'numeric'
                        });

                        return (
                            <div
                                key={cert.id}
                                className="bg-[#0a0a0a] border rounded overflow-hidden group hover:border-white/20 transition-colors"
                                style={{ borderColor: `${brandColor}33` }}
                            >
                                {/* Barra colorida */}
                                <div className="h-1" style={{ backgroundColor: brandColor }} />

                                {/* Thumbnail */}
                                {course?.thumbnail_url ? (
                                    <div className="relative h-28 bg-[#111]">
                                        <Image
                                            src={course.thumbnail_url}
                                            alt={course.title}
                                            fill
                                            className="object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                                    </div>
                                ) : (
                                    <div className="h-28 bg-[#111] flex items-center justify-center">
                                        <Award size={32} style={{ color: brandColor }} className="opacity-30" />
                                    </div>
                                )}

                                <div className="p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span
                                            className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded"
                                            style={{ color: brandColor, backgroundColor: `${brandColor}15`, border: `1px solid ${brandColor}30` }}
                                        >
                                            {tenant?.name || 'XTAGE'}
                                        </span>
                                    </div>

                                    <h3 className="text-white font-bold text-sm uppercase leading-tight mb-4" title={course?.title}>
                                        {course?.title}
                                    </h3>

                                    <div className="flex items-center justify-between">
                                        <p className="text-[#555] text-[10px] font-mono">{issuedDate}</p>
                                        <div className="flex items-center gap-2">
                                            {/* Ver certificado */}
                                            <Link
                                                href={`/c/${cert.public_slug}`}
                                                target="_blank"
                                                className="flex items-center gap-1 text-[#888] hover:text-white transition-colors text-[10px] font-mono uppercase"
                                            >
                                                <ExternalLink size={12} />
                                                Ver
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
