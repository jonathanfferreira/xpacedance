'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Video, Edit2, Trash2, Eye, EyeOff, PlayCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Course {
    id: string;
    title: string;
    description: string | null;
    price: number;
    thumbnail_url: string | null;
    is_published: boolean;
    pricing_type: string;
    lesson_count: number;
    module_count: number;
    created_at: string;
}

export default function StudioCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const router = useRouter();

    const fetchCourses = async () => {
        setLoading(true);
        const res = await fetch('/api/studio/courses');
        const data = await res.json();
        setCourses(data.courses || []);
        setLoading(false);
    };

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            const res = await fetch('/api/studio/courses');
            const data = await res.json();
            if (mounted) {
                setCourses(data.courses || []);
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Tem certeza que deseja excluir o curso "${title}"? Esta ação é irreversível.`)) return;
        const res = await fetch(`/api/studio/courses/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setCourses(prev => prev.filter(c => c.id !== id));
        } else {
            const err = await res.json();
            alert('Erro ao excluir: ' + err.error);
        }
    };

    const handleTogglePublish = async (course: Course) => {
        const res = await fetch(`/api/studio/courses/${course.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_published: !course.is_published }),
        });
        if (res.ok) {
            setCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_published: !c.is_published } : c));
        }
    };

    const filtered = courses.filter(c => {
        const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' ||
            (statusFilter === 'published' && c.is_published) ||
            (statusFilter === 'draft' && !c.is_published);
        return matchSearch && matchStatus;
    });

    return (
        <div className="max-w-6xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-tight mb-2">Editor de Cursos</h1>
                    <p className="text-[#888] font-sans text-sm">Gerencie suas Séries, Módulos e ordene suas Aulas para entrega aos alunos.</p>
                </div>
                <Link
                    href="/studio/cursos/novo"
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded font-mono text-sm uppercase tracking-wider font-bold transition-all"
                >
                    <Plus size={18} /> Novo Curso
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar curso por título..."
                        className="w-full bg-[#111] border border-[#222] rounded py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-[#111] border border-[#222] rounded py-2 px-4 text-[#888] text-sm focus:outline-none cursor-pointer hover:border-[#333]"
                >
                    <option value="all">Todos os Status</option>
                    <option value="published">Publicados</option>
                    <option value="draft">Rascunhos</option>
                </select>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-20 text-[#555]">
                    <Loader2 size={24} className="animate-spin mr-3" /> Carregando cursos...
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="text-center py-20 border border-dashed border-[#222] rounded">
                    <Video size={40} className="mx-auto text-[#333] mb-4" />
                    <p className="text-[#555] text-sm mb-4">
                        {courses.length === 0 ? 'Você ainda não criou nenhum curso.' : 'Nenhum curso com esse filtro.'}
                    </p>
                    {courses.length === 0 && (
                        <Link href="/studio/cursos/novo" className="text-primary hover:text-white text-sm font-medium transition-colors">
                            + Criar meu primeiro curso
                        </Link>
                    )}
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(course => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            onDelete={() => handleDelete(course.id, course.title)}
                            onTogglePublish={() => handleTogglePublish(course)}
                            onEdit={() => router.push(`/studio/cursos/${course.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CourseCard({ course, onDelete, onTogglePublish, onEdit }: {
    course: Course;
    onDelete: () => void;
    onTogglePublish: () => void;
    onEdit: () => void;
}) {
    return (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#333] transition-colors rounded-sm overflow-hidden group flex flex-col">
            <div className="h-40 relative bg-[#111] border-b border-[#1a1a1a] overflow-hidden">
                {course.thumbnail_url ? (
                    <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" unoptimized />
                ) : (
                    <div className="absolute inset-0 opacity-20 group-hover:scale-105 transition-transform duration-700" style={{ background: 'linear-gradient(135deg, #6324b2, #7000F0)' }}></div>
                )}
                <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${course.is_published ? 'bg-primary/20 text-primary border-primary/30' : 'bg-[#1a1a1a] text-[#888] border-[#333]'}`}>
                        {course.is_published ? 'Publicado' : 'Rascunho'}
                    </span>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-heading font-bold text-white text-lg uppercase tracking-wide leading-tight mb-3">{course.title}</h3>
                    <div className="flex items-center gap-4 text-xs font-sans text-[#666] mb-1">
                        <span className="flex items-center gap-1.5"><Video size={14} /> {course.module_count} Módulos</span>
                        <span className="flex items-center gap-1.5"><PlayCircle size={14} className="text-[#444]" /> {course.lesson_count} Aulas</span>
                    </div>
                    <p className="text-xs font-mono text-[#555] mt-1">
                        R$ {Number(course.price).toFixed(2).replace('.', ',')} · {course.pricing_type === 'subscription' ? 'Assinatura' : 'Avulso'}
                    </p>
                </div>

                <div className="pt-4 border-t border-[#1a1a1a] flex justify-between items-center mt-4">
                    <div className="flex gap-3">
                        <button onClick={onEdit} className="text-xs font-mono text-[#888] hover:text-white uppercase tracking-widest flex items-center gap-1 transition-colors">
                            <Edit2 size={12} /> Editar
                        </button>
                        <button onClick={onTogglePublish} className="text-xs font-mono text-[#888] hover:text-secondary uppercase tracking-widest flex items-center gap-1 transition-colors">
                            {course.is_published ? <EyeOff size={12} /> : <Eye size={12} />}
                            {course.is_published ? 'Ocultar' : 'Publicar'}
                        </button>
                    </div>
                    <button onClick={onDelete} className="text-xs font-mono text-accent/50 hover:text-accent uppercase tracking-widest flex items-center gap-1 transition-colors">
                        <Trash2 size={12} /> Excluir
                    </button>
                </div>
            </div>
        </div>
    );
}
