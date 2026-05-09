'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import {
    ArrowLeft, Upload, Package, DollarSign, Weight, Ruler,
    Save, Loader2, Info, Camera, CheckCircle
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

export default function NovoProdutoPage() {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '1',
        category: '',
        image_url: '',
        weight_kg: '0.3',
        width_cm: '20',
        height_cm: '10',
        length_cm: '20',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            setError('A imagem deve ter menos de 5MB.')
            return
        }

        setUploading(true)
        setError('')

        try {
            const ext = file.name.split('.').pop() || 'png'
            const path = `products/new-${Date.now()}.${ext}`

            const { error: uploadErr } = await supabase.storage
                .from('public-assets')
                .upload(path, file, { upsert: true, contentType: file.type })

            if (uploadErr) throw uploadErr

            const { data: { publicUrl } } = supabase.storage
                .from('public-assets')
                .getPublicUrl(path)

            setFormData(prev => ({ ...prev, image_url: publicUrl }))
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar imagem.')
        } finally {
            setUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (!formData.name || !formData.price) {
                throw new Error("Nome e Preço são obrigatórios.")
            }

            const payload = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price.replace(',', '.')),
                stock: parseInt(formData.stock, 10),
                category: formData.category || null,
                image_url: formData.image_url || null,
                weight_kg: parseFloat(formData.weight_kg),
                width_cm: parseFloat(formData.width_cm),
                height_cm: parseFloat(formData.height_cm),
                length_cm: parseFloat(formData.length_cm),
                is_active: true
            }

            const response = await fetch('/api/xtore/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Erro ao salvar produto.")
            }

            router.push('/studio/loja')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro desconhecido.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="mb-8">
                <Link href="/studio/loja" className="inline-flex items-center gap-2 text-[#888] hover:text-white transition-colors mb-4 text-sm font-sans">
                    <ArrowLeft size={16} /> Voltar para Minha Loja
                </Link>
                <h1 className="font-heading text-4xl mb-2 tracking-tight uppercase">
                    Novo <span className="text-transparent bg-clip-text text-gradient-neon">Produto</span>
                </h1>
                <p className="text-[#888] font-sans">Cadastre itens de merchandising do seu Studio na XTORE.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 font-sans text-sm flex items-center gap-2">
                    <Info size={16} /> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Image Upload */}
                <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-6 border-b border-[#222] pb-4">
                        <Camera className="text-primary" size={20} />
                        <h2 className="font-heading text-xl uppercase text-white">Foto do Produto</h2>
                    </div>

                    <div className="flex items-start gap-6">
                        <div
                            className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-dashed border-[#333] hover:border-primary/50 transition-colors cursor-pointer group shrink-0 bg-[#111]"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {formData.image_url ? (
                                <Image src={formData.image_url} alt="Preview" fill className="object-cover" />
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
                                PNG, JPG ou WebP. Máximo 5MB.
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
                <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-6 border-b border-[#222] pb-4">
                        <Package className="text-primary" size={20} />
                        <h2 className="font-heading text-xl uppercase text-white">Informações Básicas</h2>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#aaa] font-sans">Nome do Produto *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ex: Camiseta Oversized Studio Dance"
                                className="w-full bg-[#050505] border border-[#333] rounded px-4 py-3 text-white focus:border-primary outline-none transition-colors"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#aaa] font-sans">Descrição</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Detalhes do tecido, estampa, tamanho, conceito..."
                                rows={4}
                                className="w-full bg-[#050505] border border-[#333] rounded px-4 py-3 text-white focus:border-primary outline-none transition-colors resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#aaa] font-sans">Categoria</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-[#050505] border border-[#333] rounded px-4 py-3 text-white focus:border-primary outline-none transition-colors cursor-pointer"
                            >
                                <option value="">Selecione uma categoria...</option>
                                {PRODUCT_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Price and Stock */}
                <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-6 border-b border-[#222] pb-4">
                        <DollarSign className="text-secondary" size={20} />
                        <h2 className="font-heading text-xl uppercase text-white">Vendas e Estoque</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#aaa] font-sans">Preço de Venda (R$) *</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] font-display">R$</span>
                                <input
                                    type="text"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="89.90"
                                    className="w-full bg-[#050505] border border-[#333] rounded pl-12 pr-4 py-3 text-white focus:border-secondary outline-none transition-colors font-mono"
                                    required
                                />
                            </div>
                            <p className="text-[10px] text-[#555] font-sans">Taxa XPACE DANCE é aplicada sobre este valor via Asaas Split.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#aaa] font-sans">Quantidade em Estoque</label>
                            <input
                                type="number"
                                name="stock"
                                min="0"
                                value={formData.stock}
                                onChange={handleChange}
                                className="w-full bg-[#050505] border border-[#333] rounded px-4 py-3 text-white focus:border-secondary outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Shipping Dimensions */}
                <div className="bg-[#0A0A0A] border border-[#222] rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-6 border-b border-[#222] pb-4">
                        <Ruler className="text-blue-400" size={20} />
                        <h2 className="font-heading text-xl uppercase text-white">Dados de Frete (Correios)</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[#aaa] font-sans flex items-center gap-1">
                                <Weight size={12} /> Peso (kg)
                            </label>
                            <input type="number" step="0.100" min="0.100" name="weight_kg" value={formData.weight_kg} onChange={handleChange}
                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:border-blue-400 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[#aaa] font-sans">Largura (cm)</label>
                            <input type="number" name="width_cm" min="10" value={formData.width_cm} onChange={handleChange}
                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:border-blue-400 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[#aaa] font-sans">Altura (cm)</label>
                            <input type="number" name="height_cm" min="2" value={formData.height_cm} onChange={handleChange}
                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:border-blue-400 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[#aaa] font-sans">Comprim. (cm)</label>
                            <input type="number" name="length_cm" min="15" value={formData.length_cm} onChange={handleChange}
                                className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-white focus:border-blue-400 outline-none" />
                        </div>
                    </div>
                    <p className="text-xs text-[#555] mt-4 font-sans">Medidas da caixa embalada, usadas no cálculo de frete.</p>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4 border-t border-[#1a1a1a]">
                    <Link
                        href="/studio/loja"
                        className="px-6 py-4 rounded bg-[#111] hover:bg-[#1a1a1a] text-white border border-[#333] font-bold font-sans text-sm transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded bg-primary hover:bg-primary-hover text-white font-bold font-sans transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                        {loading ? (
                            <><Loader2 size={20} className="animate-spin" /> Salvando...</>
                        ) : (
                            <><Save size={20} /> Cadastrar Produto</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
