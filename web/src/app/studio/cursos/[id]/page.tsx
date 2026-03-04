'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Save, Loader2, Plus, Trash2, ExternalLink,
    Film, ChevronDown, ChevronRight, Edit2, Check, X, Eye, EyeOff
} from 'lucide-react';

interface Lesson {
    id: string;
    module_name: string;
    title: string;
    description: string | null;
    video_id: string | null;
    order_index: number;
}

interface Course {
    id: string;
    title: string;
    description: string | null;
    price: number;
    pricing_type: string;
    thumbnail_url: string | null;
    is_published: boolean;
    category: string | null;
}

export default function CourseEditorPage() {
    const { id } = useParams<{ id: string }>();

    const [course, setCourse] = useState<Course | null>(null);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [pricingType, setPricingType] = useState('one_time');
    const [category, setCategory] = useState('');

    const [showNewLesson, setShowNewLesson] = useState(false);
    const [newModule, setNewModule] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [addingLesson, setAddingLesson] = useState(false);

    const [editingLesson, setEditingLesson] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editModule, setEditModule] = useState('');

    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetch(`/api/studio/courses/${id}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) { setError(data.error); setLoading(false); return; }
                setCourse(data.course);
                setTitle(data.course.title);
                setDescription(data.course.description || '');
                setPrice(String(data.course.price));
                setPricingType(data.course.pricing_type);
                setCategory(data.course.category || '');
                setLessons(data.lessons);
                const mods = new Set<string>(data.lessons.map((l: Lesson) => l.module_name));
                setExpandedModules(mods);
                setLoading(false);
            })
            .catch(() => { setError('Erro ao carregar curso.'); setLoading(false); });
    }, [id]);

    const handleSaveCourse = async () => {
        const priceNum = parseFloat(price.replace(',', '.'));
        if (isNaN(priceNum) || priceNum < 39.90) {
            setError('Preço mínimo é R$ 39,90.'); return;
        }
        setSaving(true); setError('');
        const res = await fetch(`/api/studio/courses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, price: priceNum, pricing_type: pricingType, category: category || null }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Erro ao salvar.'); setSaving(false); return; }
        setCourse(prev => prev ? { ...prev, ...data.course } : null);
        setSaving(false);
    };

    const handleTogglePublish = async () => {
        if (!course) return;
        const res = await fetch(`/api/studio/courses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_published: !course.is_published }),
        });
        const data = await res.json();
        if (res.ok) setCourse(prev => prev ? { ...prev, is_published: data.course.is_published } : null);
    };

    const handleAddLesson = async () => {
        if (!newModule.trim() || !newTitle.trim()) return;
        setAddingLesson(true);
        const res = await fetch('/api/studio/lessons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: id, module_name: newModule.trim(), title: newTitle.trim() }),
        });
        const data = await res.json();
        if (!res.ok) { alert(data.error || 'Erro ao adicionar aula.'); setAddingLesson(false); return; }
        setLessons(prev => [...prev, data.lesson]);
        setExpandedModules(prev => new Set([...prev, newModule.trim()]));
        setNewModule(''); setNewTitle(''); setShowNewLesson(false);
        setAddingLesson(false);
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Excluir esta aula? Esta ação é irreversível.')) return;
        const res = await fetch(`/api/studio/lessons/${lessonId}`, { method: 'DELETE' });
        if (res.ok) setLessons(prev => prev.filter(l => l.id !== lessonId));
        else { const d = await res.json(); alert(d.error || 'Erro ao excluir.'); }
    };

    const handleSaveLesson = async (lessonId: string) => {
        const res = await fetch(`/api/studio/lessons/${lessonId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: editTitle, module_name: editModule }),
        });
        const data = await res.json();
        if (res.ok) {
            setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, ...data.lesson } : l));
            setEditingLesson(null);
        } else alert(data.error || 'Erro ao salvar.');
    };

    const startEdit = (lesson: Lesson) => {
        setEditingLesson(lesson.id);
        setEditTitle(lesson.title);
        setEditModule(lesson.module_name);
    };

    const toggleModule = (mod: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(mod)) next.delete(mod); else next.add(mod);
            return next;
        });
    };

    const modules = Array.from(new Set(lessons.map(l => l.module_name)));

    if (loading) return (
        <div className="flex items-center justify-center py-20 text-[#555]">
            <Loader2 size={24} className="animate-spin mr-3" /> Carregando curso...
        </div>
    );

    if (error && !course) return (
        <div className="max-w-2xl mx-auto py-20 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link href="/studio/cursos" className="text-primary hover:text-white text-sm">
                <ArrowLeft size={14} className="inline mr-1" /> Voltar para Cursos
            </Link>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto pb-16">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/studio/cursos" className="flex items-center gap-2 text-[#666] hover:text-white text-sm transition-colors">
                    <ArrowLeft size={16} /> Voltar para Cursos
                </Link>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleTogglePublish}
                        className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs uppercase tracking-widest transition-colors border ${course?.is_published
                                ? 'border-[#333] text-[#888] hover:text-white hover:border-[#555]'
                                : 'border-primary/40 text-primary hover:border-primary'
                            }`}
                    >
                        {course?.is_published ? <><EyeOff size={14} /> Despublicar</> : <><Eye size={14} /> Publicar</>}
                    </button>
                    <button
                        onClick={handleSaveCourse}
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded font-mono text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded text-sm mb-6">{error}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Course Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6 space-y-5">
                        <h2 className="text-white font-heading font-bold uppercase tracking-wide text-sm">Informações do Curso</h2>

                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Título *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 px-4 text-white text-sm outline-none transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Descrição</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 px-4 text-white text-sm outline-none transition-colors resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Preço (R$) *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm font-mono">R$</span>
                                    <input
                                        type="number" min="39.90" step="0.01"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 pl-10 pr-4 text-white text-sm outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Cobrança</label>
                                <select
                                    value={pricingType}
                                    onChange={e => setPricingType(e.target.value)}
                                    className="w-full bg-[#111] border border-[#222] rounded py-3 px-4 text-white text-sm outline-none cursor-pointer"
                                >
                                    <option value="one_time">Compra Avulsa</option>
                                    <option value="subscription">Assinatura</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Estilo de Dança (Filtro do Catálogo)</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-[#111] border border-[#222] rounded py-3 px-4 text-white text-sm outline-none cursor-pointer"
                            >
                                <option value="">Selecione um estilo...</option>
                                <option value="hiphop">Hip Hop</option>
                                <option value="jazz">Jazz Funk</option>
                                <option value="commercial">Commercial Dance</option>
                                <option value="dancehall">Dancehall</option>
                                <option value="heels">Heels</option>
                                <option value="locking">Locking</option>
                                <option value="popping">Popping</option>
                                <option value="kpop">K-Pop</option>
                                <option value="contemporaneo">Contemporâneo</option>
                                <option value="ballet">Ballet Clássico</option>
                                <option value="breakdance">Breakdance</option>
                                <option value="house">House Dance</option>
                                <option value="afro">Afrobeat</option>
                                <option value="salsa">Salsa / Bachata</option>
                            </select>
                        </div>
                    </div>

                    {/* Lessons / Modules */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm">
                        <div className="p-6 border-b border-[#1a1a1a] flex justify-between items-center">
                            <h2 className="text-white font-heading font-bold uppercase tracking-wide text-sm">
                                Módulos & Aulas ({lessons.length})
                            </h2>
                            <button
                                onClick={() => setShowNewLesson(v => !v)}
                                className="flex items-center gap-1.5 text-primary hover:text-white text-xs font-mono uppercase tracking-widest transition-colors"
                            >
                                <Plus size={14} /> Adicionar Aula
                            </button>
                        </div>

                        {showNewLesson && (
                            <div className="p-4 border-b border-[#1a1a1a] bg-[#111] flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-mono uppercase tracking-widest text-[#666] block mb-1">Módulo</label>
                                        <input
                                            type="text"
                                            value={newModule}
                                            onChange={e => setNewModule(e.target.value)}
                                            placeholder="Ex: Módulo 1 — Fundamentos"
                                            className="w-full bg-[#0a0a0a] border border-[#222] focus:border-primary/50 rounded py-2 px-3 text-white text-sm outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-mono uppercase tracking-widest text-[#666] block mb-1">Título da Aula</label>
                                        <input
                                            type="text"
                                            value={newTitle}
                                            onChange={e => setNewTitle(e.target.value)}
                                            placeholder="Ex: Introdução ao Movimento"
                                            className="w-full bg-[#0a0a0a] border border-[#222] focus:border-primary/50 rounded py-2 px-3 text-white text-sm outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowNewLesson(false)} className="text-xs text-[#666] hover:text-white px-3 py-1.5 transition-colors">Cancelar</button>
                                    <button
                                        onClick={handleAddLesson}
                                        disabled={addingLesson || !newModule.trim() || !newTitle.trim()}
                                        className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded font-mono text-xs uppercase disabled:opacity-50 transition-colors"
                                    >
                                        {addingLesson ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                        Criar Aula
                                    </button>
                                </div>
                            </div>
                        )}

                        {lessons.length === 0 ? (
                            <div className="p-10 text-center text-[#555] text-sm">
                                <Film size={32} className="mx-auto mb-3 text-[#333]" />
                                Nenhuma aula ainda. Clique em &quot;Adicionar Aula&quot; para começar.
                            </div>
                        ) : (
                            <div>
                                {modules.map(mod => (
                                    <div key={mod} className="border-b border-[#111] last:border-0">
                                        <button
                                            onClick={() => toggleModule(mod)}
                                            className="w-full flex items-center justify-between px-6 py-3 hover:bg-[#111] transition-colors"
                                        >
                                            <span className="text-[#888] font-mono text-xs uppercase tracking-widest">{mod}</span>
                                            <div className="flex items-center gap-2 text-[#555]">
                                                <span className="text-[10px]">{lessons.filter(l => l.module_name === mod).length} aulas</span>
                                                {expandedModules.has(mod) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                        </button>

                                        {expandedModules.has(mod) && (
                                            <div className="bg-[#050505]">
                                                {lessons.filter(l => l.module_name === mod).map(lesson => (
                                                    <div key={lesson.id} className="flex items-center gap-3 px-6 py-3 border-t border-[#111] group hover:bg-[#0a0a0a] transition-colors">
                                                        <div
                                                            className={`w-2 h-2 rounded-full shrink-0 ${lesson.video_id ? 'bg-green-500' : 'bg-[#333]'}`}
                                                            title={lesson.video_id ? 'Com vídeo' : 'Sem vídeo'}
                                                        />

                                                        {editingLesson === lesson.id ? (
                                                            <div className="flex-1 flex items-center gap-2">
                                                                <input
                                                                    value={editModule}
                                                                    onChange={e => setEditModule(e.target.value)}
                                                                    className="bg-[#111] border border-[#222] rounded py-1 px-2 text-white text-xs outline-none w-40"
                                                                    placeholder="Módulo"
                                                                />
                                                                <input
                                                                    value={editTitle}
                                                                    onChange={e => setEditTitle(e.target.value)}
                                                                    className="bg-[#111] border border-[#222] rounded py-1 px-2 text-white text-xs outline-none flex-1"
                                                                    placeholder="Título"
                                                                />
                                                                <button onClick={() => handleSaveLesson(lesson.id)} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                                                                <button onClick={() => setEditingLesson(null)} className="text-[#555] hover:text-white"><X size={14} /></button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex-1">
                                                                    <p className="text-white text-sm">{lesson.title}</p>
                                                                    {lesson.video_id && (
                                                                        <p className="text-[#555] text-[10px] font-mono">bunny: {lesson.video_id.slice(0, 16)}…</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button onClick={() => startEdit(lesson)} className="text-[#555] hover:text-white"><Edit2 size={14} /></button>
                                                                    <button onClick={() => handleDeleteLesson(lesson.id)} className="text-[#555] hover:text-red-400"><Trash2 size={14} /></button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar info */}
                <div className="space-y-4">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-5">
                        <h3 className="text-[#888] font-mono text-xs uppercase tracking-widest mb-3">Status</h3>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono uppercase ${course?.is_published
                                ? 'text-green-400 border-green-400/30 bg-green-400/10'
                                : 'text-[#888] border-[#333] bg-[#111]'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${course?.is_published ? 'bg-green-400' : 'bg-[#555]'}`} />
                            {course?.is_published ? 'Publicado' : 'Rascunho'}
                        </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-5 space-y-3">
                        <h3 className="text-[#888] font-mono text-xs uppercase tracking-widest">Ações Rápidas</h3>
                        <Link href="/studio/upload" className="flex items-center gap-2 text-primary hover:text-white text-sm font-mono transition-colors">
                            <Film size={14} /> Fazer Upload de Vídeo
                        </Link>
                        {course?.is_published && (
                            <Link href={`/checkout/${id}`} target="_blank" className="flex items-center gap-2 text-[#888] hover:text-white text-sm font-mono transition-colors">
                                <ExternalLink size={14} /> Ver Página de Venda
                            </Link>
                        )}
                    </div>

                    <div className="bg-[#111] border border-[#1a1a1a] rounded-sm p-5 text-xs text-[#555] font-mono space-y-1.5">
                        <p className="text-[#666] font-medium mb-2">Fluxo de publicação:</p>
                        <p>1. Adicione módulos e aulas</p>
                        <p>2. Faça upload dos vídeos no Studio Upload</p>
                        <p>3. Vincule o video_id às aulas</p>
                        <p>4. Clique em &quot;Publicar&quot; para vender</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
