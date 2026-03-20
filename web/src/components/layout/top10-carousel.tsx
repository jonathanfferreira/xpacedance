import Link from 'next/link';
import { Play } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

interface Lesson {
    id: string;
    title: string;
    module_name: string;
    course_id: string;
    video_id: string;
    course_title: string;
}

const getCachedRecentLessons = unstable_cache(
    async (): Promise<Lesson[]> => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data } = await supabase
            .from('lessons')
            .select('id, title, module_name, course_id, video_id, courses!inner(title, is_published)')
            .not('video_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10);

        return (data || [])
            .filter((l: any) => l.courses?.is_published)
            .map((l: any) => ({
                id: l.id,
                title: l.title,
                module_name: l.module_name,
                course_id: l.course_id,
                video_id: l.video_id,
                course_title: l.courses?.title || '',
            }));
    },
    ['recent-lessons-carousel'],
    { revalidate: 3600, tags: ['lessons', 'courses'] } // 1 hora de cache (ISR)
);

export async function Top10Carousel() {
    const lessons = await getCachedRecentLessons();

    if (lessons.length === 0) return null;

    return (
        <div className="w-full mt-16 mb-8 relative">
            <div className="flex items-center gap-3 mb-6">
                <h2 className="font-heading text-2xl tracking-tighter uppercase text-white">Aulas Recentes</h2>
                <div className="bg-primary/20 border border-primary/50 text-primary text-[10px] uppercase tracking-widest px-2 py-0.5 font-bold">Novo</div>
            </div>

            <div className="flex overflow-x-auto pt-4 pb-12 -mx-6 px-6 lg:-mx-10 lg:px-10 gap-x-8 lg:gap-x-12 no-scrollbar snap-x snap-mandatory">
                {lessons.map((lesson, index) => (
                    <Link
                        href={`/dashboard/aula/${lesson.id}`}
                        key={lesson.id}
                        className="relative shrink-0 w-[240px] sm:w-[280px] h-[160px] group snap-start block pl-16 sm:pl-20"
                    >
                        {/* 
                            Netflix-style Big Number Design!
                            Outline, 3D structure, sitting exactly behind the thumbnail.
                        */}
                        <div
                            className={`absolute -left-2 -bottom-6 font-display font-black text-[180px] sm:text-[220px] leading-[0.8] tracking-tighter z-0 select-none pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)] text-transparent bg-clip-text bg-gradient-to-b opacity-90 ${
                                index === 0 ? "from-[#F9E5C9] via-[#D4AF37] to-[#8A6327]" : 
                                index === 1 ? "from-[#E8E8E8] via-[#A0A5A8] to-[#595D62]" : 
                                index === 2 ? "from-[#FADCAF] via-[#CD7F32] to-[#6A3805]" : 
                                "from-[#555] via-[#222] to-[#111]"
                            }`}
                            style={{ WebkitTextStroke: '3px rgba(255,255,255,0.15)' }}
                        >
                            {index + 1}
                        </div>

                        {/* Thumbnail Box overlapping the number */}
                        <div className="absolute right-0 top-0 bottom-0 w-[180px] md:w-[200px] bg-[#0A0A0A] border border-[#222] group-hover:border-primary/60 transition-colors shadow-2xl rounded-sm overflow-hidden z-10 flex flex-col justify-end p-4">
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary to-secondary" />

                            <div className="relative z-20 flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] text-primary font-mono uppercase tracking-widest mb-1 line-clamp-1">{lesson.course_title}</p>
                                    <h3 className="text-white font-sans font-bold leading-tight text-sm line-clamp-2">{lesson.title}</h3>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0 ml-2 group-hover:bg-primary group-hover:border-primary transition-all">
                                    <Play size={14} className="text-white ml-0.5" fill="currentColor" />
                                </div>
                            </div>
                        </div>

                        {/* Badge */}
                        <div className="absolute right-2 top-2 z-20 bg-primary text-white font-bold text-[9px] px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,0,0,0.5)] uppercase tracking-widest">
                            Nova Aula
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
