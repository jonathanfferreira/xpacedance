'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

export default function AppearanceSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [form, setForm] = useState({
        name: '',
        slug: '',
        brand_color: '#6324b2',
        logo_url: '',
    });

    useEffect(() => {
        fetch('/api/studio/tenant') // Assume getting tenant info via a general endpoint or via appearance
            .then(res => res.json())
            .then(data => {
                if (data.tenant) {
                    setForm({
                        name: data.tenant.name || '',
                        slug: data.tenant.slug || '',
                        brand_color: data.tenant.brand_color || '#6324b2',
                        logo_url: data.tenant.logo_url || '',
                    });
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await fetch('/api/studio/tenant/appearance', {
                method: 'PATCH',
                body: JSON.stringify(form),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Erro ao salvar');

            setMessage({ text: 'Aparência atualizada com sucesso!', type: 'success' });
        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-[#333]" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Settings size={28} className="text-[#6324b2]" />
                    Aparência
                </h1>
                <p className="text-[#888] font-mono text-xs uppercase tracking-widest">
                    Personalize a marca da sua escola
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Info Básica */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded space-y-4">
                    <h2 className="text-white font-bold font-heading uppercase tracking-wide text-sm mb-4">
                        Informações Básicas
                    </h2>

                    <div>
                        <label className="block text-[#888] text-xs font-mono uppercase tracking-widest mb-2">
                            Nome da Escola
                        </label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-[#111] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-white/50 transition-colors"
                            placeholder="Ex: Academia Xpace"
                        />
                    </div>

                    <div>
                        <label className="block text-[#888] text-xs font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                            <LinkIcon size={12} /> URL da Vitrine (Slug)
                        </label>
                        <div className="flex bg-[#111] border border-[#333] rounded overflow-hidden focus-within:border-white/50 transition-colors">
                            <span className="bg-[#1a1a1a] text-[#666] px-4 py-2 text-sm font-mono border-r border-[#333]">
                                xpace.on/
                            </span>
                            <input
                                type="text"
                                required
                                value={form.slug}
                                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                className="w-full bg-transparent px-4 py-2 text-white focus:outline-none text-sm font-mono"
                                placeholder="minha-escola"
                            />
                        </div>
                        <p className="text-[#555] text-[10px] font-mono mt-1">
                            Este é o endereço público da sua vitrine de cursos.
                        </p>
                    </div>
                </div>

                {/* Identidade Visual */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded space-y-4">
                    <h2 className="text-white font-bold font-heading uppercase tracking-wide text-sm mb-4">
                        Identidade Visual
                    </h2>

                    <div>
                        <label className="block text-[#888] text-xs font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                            <ImageIcon size={12} /> Logo URL
                        </label>
                        <input
                            type="url"
                            value={form.logo_url}
                            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                            className="w-full bg-[#111] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-white/50 transition-colors font-mono text-sm"
                            placeholder="https://..."
                        />
                        <div className="mt-3 flex items-center gap-4">
                            {form.logo_url ? (
                                <img src={form.logo_url} alt="Logo preview" className="h-10 w-10 object-contain rounded bg-white p-1" />
                            ) : (
                                <div className="h-10 w-10 border border-dashed border-[#333] rounded flex items-center justify-center text-[#555] text-xs font-mono">
                                    N/A
                                </div>
                            )}
                            <p className="text-[#555] text-[10px] font-mono">URL direta da imagem (PNG, JPG, SVG).</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[#888] text-xs font-mono uppercase tracking-widest mb-2">
                            Cor da Marca (HEX)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={form.brand_color}
                                onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                                className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <input
                                type="text"
                                required
                                value={form.brand_color}
                                onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                                className="bg-[#111] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-white/50 transition-colors font-mono uppercase text-sm w-32"
                                placeholder="#6324b2"
                                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex items-center justify-between pt-4">
                    {message.text ? (
                        <p className={`text-sm font-mono ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                            {message.type === 'error' ? '> Erro: ' : '> '}{message.text}
                        </p>
                    ) : (
                        <div />
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 bg-[#6324b2] text-white px-6 py-2.5 rounded text-sm font-mono uppercase tracking-widest hover:bg-[#7a2cd8] transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    );
}
