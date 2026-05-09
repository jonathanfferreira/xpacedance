import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/server';
import CourseGridClient from './CourseGridClient';

export const revalidate = 3600; // Cache de 1 hora para o catálogo público

export default async function ExplorePage() {
    const supabase = await createClient();

    // Fetch all active courses. (Assuming 'status' or just fetching all for now)
    const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, description, thumbnail_url, price, instructor_name:tenants(name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching courses for explore page:", error);
    }

    return (
        <div className="min-h-screen bg-black text-[#ededed] font-sans selection:bg-primary/30 selection:text-white pb-24">
            {/* Navbar Minimalista */}
            <header className="sticky top-0 inset-x-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="relative w-32 h-8 block">
                        <Image src="/images/xpace-on-branco.png" alt="XPACE DANCE" fill className="object-contain object-left" />
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-sm font-semibold text-[#888] hover:text-white transition-colors uppercase tracking-widest">
                            Acesso Aluno
                        </Link>
                        <Link href="/register" className="px-6 py-2.5 rounded-sm bg-primary border border-primary/50 text-white font-bold uppercase tracking-widest text-xs hover:bg-primary/80 transition-colors">
                            Assinar Premium
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section Coleções */}
            <section className="relative pt-20 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 uppercase tracking-tighter">
                        Explore o <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Plano de Ensino</span>
                    </h1>
                    <p className="text-[#888] text-lg max-w-2xl font-light">
                        O catálogo completo de masterclasses e treinamentos dos melhores coreógrafos. Escolha sua jornada e destrave o acesso.
                    </p>
                </div>
            </section>

            {/* Grid de Cursos (Estilo Streaming) */}
            <section className="px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <CourseGridClient courses={courses || []} />
                </div>
            </section>
        </div>
    );
}
