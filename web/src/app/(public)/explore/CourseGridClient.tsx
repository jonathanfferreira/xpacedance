"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export default function CourseGridClient({ courses }: { courses: any[] }) {
    if (!courses || courses.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-20 text-center border border-white/10 rounded-xl bg-white/5"
            >
                <p className="text-[#888]">Nenhum curso disponível no momento. Fique ligado!</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
                hidden: { opacity: 0 }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
            {courses.map((course: any, index: number) => (
                <motion.div
                    key={course.id}
                    variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <Link href={`/course/${course.id}`} className="group flex flex-col h-full">
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-[#111] border border-white/10 group-hover:border-primary/50 transition-colors duration-300">
                            {course.thumbnail_url ? (
                                <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
                                    <Image src="/images/xpace-on-branco.png" alt="XPACE DANCE Cover" width={100} height={30} className="opacity-20" />
                                </div>
                            )}

                            {/* Hover Overlay c/ Play */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-[0_0_30px_rgba(99,36,178,0.5)] transform scale-75 group-hover:scale-100 transition-transform duration-300 delay-100">
                                    <Play className="text-white ml-1" size={24} />
                                </div>
                            </div>

                            {/* Badge Preço */}
                            <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded text-xs font-bold text-white uppercase tracking-wider border border-white/10">
                                R$ {Number(course.price).toFixed(2).replace('.', ',')}
                            </div>
                        </div>

                        <div className="mt-4 flex-1">
                            <h3 className="text-white font-bold text-lg line-clamp-1 mb-1">{course.title}</h3>
                            <p className="text-[#888] text-sm line-clamp-2 leading-relaxed">
                                {course.description || "Aprenda com especialistas de alto nível. Desbloqueie este conteúdo agora."}
                            </p>
                            {course.instructor_name && (
                                <p className="text-primary text-[10px] uppercase tracking-widest font-bold mt-3">
                                    {course.instructor_name[0]?.name || "Original XPACE DANCE"}
                                </p>
                            )}
                        </div>
                    </Link>
                </motion.div>
            ))}
        </motion.div>
    );
}
