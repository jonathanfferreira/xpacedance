'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function NovoCursoPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [pricingType, setPricingType] = useState('one_time');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const priceNum = parseFloat(price.replace(',', '.'));
        if (isNaN(priceNum) || priceNum < 39.90) {
            setError('O preço mínimo é R$ 39,90.');
            return;
        }

        setLoading(true);
        const res = await fetch('/api/studio/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, price: priceNum, pricing_type: pricingType, category: category || null }),
        });

        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'Erro ao criar curso.');
            setLoading(false);
            return;
        }

        window.location.href = '/studio/cursos';
    };

    return (
        <div className="max-w-2xl mx-auto pb-10">
            <div className="mb-8">
                <Link href="/studio/cursos" className="flex items-center gap-2 text-[#666] hover:text-white text-sm transition-colors mb-6">
                    <ArrowLeft size={16} /> Voltar para Cursos
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded flex items-center justify-center">
                        <BookOpen size={20} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-white uppercase tracking-tight">Novo Curso</h1>
                        <p className="text-[#666] text-xs font-mono mt-0.5">Preencha as informações básicas. Você adiciona aulas depois.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-8 space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Título do Curso *</label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Ex: Fundamentos do Hip-Hop"
                        className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 px-4 text-white text-sm outline-none transition-colors focus:ring-1 focus:ring-primary/30"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Descrição</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Descreva o que o aluno vai aprender neste curso..."
                        rows={4}
                        className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 px-4 text-white text-sm outline-none transition-colors focus:ring-1 focus:ring-primary/30 resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Preço (R$) *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm font-mono">R$</span>
                            <input
                                type="number"
                                required
                                min="39.90"
                                step="0.01"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="39,90"
                                className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 pl-10 pr-4 text-white text-sm outline-none transition-colors focus:ring-1 focus:ring-primary/30"
                            />
                        </div>
                        <p className="text-[10px] text-[#555] font-mono">Mínimo: R$ 39,90</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Tipo de Cobrança</label>
                        <select
                            value={pricingType}
                            onChange={e => setPricingType(e.target.value)}
                            className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 px-4 text-white text-sm outline-none transition-colors cursor-pointer"
                        >
                            <option value="one_time">Compra Avulsa</option>
                            <option value="subscription">Assinatura Recorrente</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Estilo de Dança</label>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 px-4 text-white text-sm outline-none transition-colors cursor-pointer"
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
                    <p className="text-[10px] text-[#555] font-mono">Usado nos filtros do catálogo Explorar</p>
                </div>

                <div className="bg-[#111] border border-[#1a1a1a] rounded p-4 text-xs text-[#555] font-mono">
                    <p className="text-[#666] mb-1">ℹ️ Após criar o curso, você poderá:</p>
                    <ul className="space-y-0.5 ml-4 list-disc">
                        <li>Adicionar módulos e aulas via Upload de Vídeo</li>
                        <li>Publicar o curso para que alunos possam comprar</li>
                        <li>Definir thumbnail e materiais extras</li>
                    </ul>
                </div>

                <div className="flex gap-4 pt-2">
                    <Link
                        href="/studio/cursos"
                        className="flex-1 py-3 border border-[#333] text-[#888] hover:text-white hover:border-[#555] rounded font-mono text-sm uppercase tracking-wider text-center transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded font-mono text-sm uppercase tracking-wider font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Criando...</> : 'Criar Curso'}
                    </button>
                </div>
            </form>
        </div>
    );
}
