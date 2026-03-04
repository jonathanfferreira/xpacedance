'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import {
    ArrowLeft, Save, Loader2, Trash2, Package, DollarSign,
    Weight, Ruler, Upload, Camera, Eye, EyeOff, CheckCircle, Info
} from 'lucide-react'

const PRODUCT_CATEGORIES = [
    { value: 'camiseta', label: 'Camisetas' },
    { value: 'moletom', label: 'Moletons & Hoodies' },
    { value: 'acessorio', label: 'Acessórios' },
    { value: 'bone', label: 'Bonés & Chapéus' },
    { value: 'tenis', label: 'Tênis' },
    { value: 'meia', label: 'Meias' },
    { value: 'ecobag', label: 'Ecobags' },
    { value: 'sticker', label: 'Adesivos & Stickers' },
    { value: 'poster', label: 'Posters & Prints' },
    { value: 'digital', label: 'Produto Digital' },
    { value: 'outro', label: 'Outro' },
]

export default function EditProductPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState({ text: '', type: '' })

    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        stock: '0',
        category: '',
        image_url: '',
        is_active: true,
    })

    useEffect(() => {
        fetch(`/api/xtore/products/${id}`)
            .then(r => r.json())
            .then(data => {
                if (data.product) {
                    setForm({
                        name: data.product.name || '',
                        description: data.product.description || '',
                        price: String(data.product.price || ''),
                        stock: String(data.product.stock || 0),
                        category: data.product.category || '',
                        image_url: data.product.image_url || '',
                        is_active: data.product.is_active !== false,
                    })
                }
                setLoading(false)
            })
            .catch(() => {
                setMessage({ text: 'Erro ao carregar produto.', type: 'error' })
                setLoading(false)
            })
    }, [id])

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ text: 'A imagem deve ter menos de 5MB.', type: 'error' })
            return
        }

        setUploading(true)
        setMessage({ text: '', type: '' })

        try {
            const ext = file.name.split('.').pop() || 'png'
            const path = `products/${id}-${Date.now()}.${ext}`

            const { error: uploadErr } = await supabase.storage
                .from('public-assets')
                .upload(path, file, { upsert: true, contentType: file.type })

            if (uploadErr) throw uploadErr

            const { data: { publicUrl } } = supabase.storage
                .from('public-assets')
                .getPublicUrl(path)

            setForm(prev => ({ ...prev, image_url: publicUrl }))
            setMessage({ text: 'Imagem enviada!', type: 'success' })
        } catch (err: any) {
            setMessage({ text: err.message || 'Erro ao enviar imagem.', type: 'error' })
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        if (!form.name.trim()) {
            setMessage({ text: 'Nome é obrigatório.', type: 'error' })
            return
        }

        setSaving(true)
        setMessage({ text: '', type: '' })

        try {
            const res = await fetch(`/api/xtore/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    price: parseFloat(form.price.replace(',', '.')) || 0,
                    stock: parseInt(form.stock) || 0,
                    category: form.category || null,
                    image_url: form.image_url || null,
                    is_active: form.is_active,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setMessage({ text: 'Produto salvo com sucesso!', type: 'success' })
        } catch (err: any) {
            setMessage({ text: err.message || 'Erro ao salvar.', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este produto? Esta ação é irreversível.')) return

        setDeleting(true)
        try {
            const res = await fetch(`/api/xtore/products/${id}`, { method: 'DELETE' })
            if (res.ok) {
                router.push('/studio/loja')
                router.refresh()
            } else {
                const data = await res.json()
                setMessage({ text: data.error || 'Erro ao excluir.', type: 'error' })
            }
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-[#555]">
                <Loader2 size={24} className="animate-spin mr-3" /> Carregando produto...
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/studio/loja" className="flex items-center gap-2 text-[#666] hover:text-white text-sm transition-colors">
                    <ArrowLeft size={16} /> Voltar para Minha Loja
                </Link>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-2 px-4 py-2 rounded font-mono text-xs uppercase tracking-widest transition-colors border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Excluir
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded font-mono text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar
                    </button>
                </div>
            </div>

            {/* Messages */}
            {message.text && (
                <div className={`mb-6 p-4 rounded text-sm font-mono flex items-center gap-2 ${message.type === 'error'
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                        : 'bg-green-500/10 border border-green-500/20 text-green-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={14} /> : <Info size={14} />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Image */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6">
                        <h2 className="text-white font-heading font-bold uppercase tracking-wide text-sm mb-4">
                            Imagem do Produto
                        </h2>

                        <div className="flex items-start gap-6">
                            <div
                                className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-dashed border-[#333] hover:border-primary/50 transition-colors cursor-pointer group shrink-0 bg-[#111]"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {form.image_url ? (
                                    <Image src={form.image_url} alt="Preview" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Camera size={32} className="text-[#444] group-hover:text-primary transition-colors" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload size={20} className="text-white" />
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                        <Loader2 size={20} className="text-primary animate-spin" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex items-center gap-2 bg-[#111] border border-[#333] hover:border-primary/50 text-white px-4 py-2.5 rounded text-sm font-mono transition-colors disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <><Loader2 size={14} className="animate-spin" /> Enviando...</>
                                    ) : (
                                        <><Upload size={14} /> Enviar Foto</>
                                    )}
                                </button>
                                <p className="text-[#555] text-[10px] font-mono mt-2">
                                    PNG, JPG ou WebP. Máximo 5MB. Exibida na vitrine XTORE.
                                </p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Package size={18} className="text-primary" />
                            <h2 className="text-white font-heading font-bold uppercase tracking-wide text-sm">Informações do Produto</h2>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Nome *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 px-4 text-white text-sm outline-none transition-colors"
                                placeholder="Ex: Camiseta Oversized Studio Dance"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Descrição</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={4}
                                className="w-full bg-[#111] border border-[#222] focus:border-primary/50 rounded py-3 px-4 text-white text-sm outline-none transition-colors resize-none"
                                placeholder="Detalhes do produto, material, conceito..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Categoria</label>
                            <select
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full bg-[#111] border border-[#222] rounded py-3 px-4 text-white text-sm outline-none cursor-pointer"
                            >
                                <option value="">Selecione uma categoria...</option>
                                {PRODUCT_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Price & Stock */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-6 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={18} className="text-secondary" />
                            <h2 className="text-white font-heading font-bold uppercase tracking-wide text-sm">Vendas e Estoque</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Preço (R$) *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] text-sm font-mono">R$</span>
                                    <input
                                        type="text"
                                        value={form.price}
                                        onChange={e => setForm({ ...form, price: e.target.value })}
                                        className="w-full bg-[#111] border border-[#222] focus:border-secondary/50 rounded py-3 pl-10 pr-4 text-white text-sm outline-none transition-colors font-mono"
                                        placeholder="89.90"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-[#888]">Estoque</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.stock}
                                    onChange={e => setForm({ ...form, stock: e.target.value })}
                                    className="w-full bg-[#111] border border-[#222] focus:border-secondary/50 rounded py-3 px-4 text-white text-sm outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar */}
                <div className="space-y-4">
                    {/* Status */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-5">
                        <h3 className="text-[#888] font-mono text-xs uppercase tracking-widest mb-3">Visibilidade</h3>
                        <button
                            onClick={() => setForm({ ...form, is_active: !form.is_active })}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded border transition-colors ${form.is_active
                                    ? 'border-green-400/30 bg-green-400/10 text-green-400'
                                    : 'border-[#333] bg-[#111] text-[#888]'
                                }`}
                        >
                            <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest">
                                {form.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                {form.is_active ? 'Ativo na XTORE' : 'Oculto'}
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${form.is_active ? 'bg-green-500' : 'bg-[#333]'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
                            </div>
                        </button>
                    </div>

                    {/* Preview Card */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-5">
                        <h3 className="text-[#888] font-mono text-xs uppercase tracking-widest mb-3">Prévia</h3>
                        <div className="bg-[#111] rounded-lg overflow-hidden border border-[#222]">
                            <div className="aspect-square relative bg-[#0a0a0a]">
                                {form.image_url ? (
                                    <Image src={form.image_url} alt="" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package size={40} className="text-[#333]" />
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <p className="text-white text-sm font-bold truncate">{form.name || 'Nome do Produto'}</p>
                                <p className="text-secondary text-sm font-mono mt-1">
                                    R$ {(parseFloat(form.price.replace(',', '.')) || 0).toFixed(2)}
                                </p>
                                {form.category && (
                                    <span className="inline-block mt-2 text-[8px] font-mono uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                                        {PRODUCT_CATEGORIES.find(c => c.value === form.category)?.label || form.category}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-[#111] border border-[#1a1a1a] rounded-sm p-5 text-xs text-[#555] font-mono space-y-1.5">
                        <p className="text-[#666] font-medium mb-2">Dicas:</p>
                        <p>• Use fotos de alta qualidade</p>
                        <p>• Descreva materiais e tamanhos</p>
                        <p>• Mantenha o estoque atualizado</p>
                        <p>• Taxa XTAGE sobre vendas via Split</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
