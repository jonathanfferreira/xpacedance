'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Mail, Camera, Save, Shield, Link2, AlertTriangle, Loader2, CheckCircle, Upload } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'

export default function PerfilPage() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [gender, setGender] = useState('N')
    const [socialLink, setSocialLink] = useState('')
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [message, setMessage] = useState({ text: '', type: '' })
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setEmail(user.email || '')
                const { data } = await supabase.from('users').select('full_name, gender, avatar_url').eq('id', user.id).single()
                if (data) {
                    setFullName(data.full_name || user.user_metadata?.full_name || '')
                    if (data.gender) setGender(data.gender)
                    setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null)
                } else {
                    setFullName(user.user_metadata?.full_name || '')
                    setAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || null)
                }
            }
        }
        loadProfile()
    }, [supabase])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ text: 'A imagem deve ter menos de 2MB.', type: 'error' })
            return
        }

        setUploading(true)
        setMessage({ text: '', type: '' })

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Não autenticado')

            const ext = file.name.split('.').pop() || 'png'
            const path = `avatars/${user.id}-${Date.now()}.${ext}`

            const { error: uploadErr } = await supabase.storage
                .from('public-assets')
                .upload(path, file, { upsert: true, contentType: file.type })

            if (uploadErr) throw uploadErr

            const { data: { publicUrl } } = supabase.storage
                .from('public-assets')
                .getPublicUrl(path)

            // Update in users table
            await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)

            setAvatarUrl(publicUrl)
            setMessage({ text: 'Foto atualizada!', type: 'success' })
        } catch (err: any) {
            setMessage({ text: err.message || 'Erro ao enviar foto.', type: 'error' })
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage({ text: '', type: '' })

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Não autenticado')

            const { error } = await supabase
                .from('users')
                .upsert({ id: user.id, full_name: fullName, gender }, { onConflict: 'id' })
                .select()

            if (error) throw error

            setMessage({ text: 'Identidade atualizada com sucesso!', type: 'success' })
        } catch (err: any) {
            setMessage({ text: err.message || 'Erro ao salvar.', type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteAccount = async () => {
        setShowDeleteModal(false)
        setMessage({ text: 'Para excluir sua conta, envie um e-mail para suporte@xtage.app com o assunto "Excluir Conta". Processamos a solicitação em até 48h.', type: 'error' })
    }

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="mb-10">
                <h1 className="font-heading text-4xl mb-2 tracking-tight uppercase">
                    <span className="text-transparent bg-clip-text text-gradient-neon">Identidade</span>
                </h1>
                <p className="text-[#888] font-sans">Gerencie seu perfil e informações de conta.</p>
            </div>

            {/* Messages */}
            {message.text && (
                <div className={`mb-6 p-4 rounded text-sm font-sans flex items-center gap-2 ${message.type === 'error'
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : 'bg-green-500/10 border border-green-500/20 text-green-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    {message.text}
                </div>
            )}

            {/* Avatar Section */}
            <div className="bg-[#0A0A0A] border border-[#222] rounded-sm p-6 mb-6">
                <div className="flex items-center gap-6">
                    <div
                        className="relative group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden relative">
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                            ) : (
                                <span className="font-heading text-2xl text-primary uppercase">{fullName ? fullName.substring(0, 2) : 'XP'}</span>
                            )}
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {uploading ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <div>
                        <h2 className="font-heading text-xl text-white uppercase">{fullName || 'Dancer'}</h2>
                        <p className="text-xs font-sans text-[#666]">{email || 'Carregando infos...'}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <Shield size={12} className="text-emerald-400" />
                            <span className="text-[10px] font-sans text-emerald-400">Conta validada ativamente</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-[#0A0A0A] border border-[#222] rounded-sm p-6 mb-6 space-y-5">
                <h2 className="font-heading text-lg uppercase tracking-widest text-white mb-4">Dados Pessoais</h2>

                <div className="space-y-2">
                    <label className="font-sans text-sm font-medium text-white/70">Nome Completo</label>
                    <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" />
                        <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="w-full bg-[#050505] border border-surface focus:border-primary rounded-lg pl-10 pr-4 py-3 font-sans text-white outline-none transition-colors focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="font-sans text-sm font-medium text-white/70">Como você se identifica? (Gênero)</label>
                        <select
                            value={gender}
                            onChange={e => setGender(e.target.value)}
                            className="w-full bg-[#050505] border border-surface focus:border-primary rounded-lg px-4 py-3.5 font-sans text-white outline-none transition-colors"
                        >
                            <option value="N">Prefiro não dizer</option>
                            <option value="F">Feminino</option>
                            <option value="M">Masculino</option>
                            <option value="O">Outro</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="font-sans text-sm font-medium text-white/70">Instagram ou TikTok</label>
                        <div className="relative">
                            <Link2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" />
                            <input
                                type="text"
                                value={socialLink}
                                onChange={e => setSocialLink(e.target.value)}
                                placeholder="@seuperfil"
                                className="w-full bg-[#050505] border border-surface focus:border-primary rounded-lg pl-10 pr-4 py-3 font-sans text-white outline-none transition-colors focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="font-sans text-sm font-medium text-white/70">E-mail</label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" />
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full bg-[#050505] border border-surface rounded-lg pl-10 pr-4 py-3 font-sans text-[#666] outline-none cursor-not-allowed"
                        />
                    </div>
                    <p className="text-[10px] font-sans text-[#444]">E-mail vinculado via OAuth. Não pode ser alterado.</p>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full relative overflow-hidden rounded-lg bg-white text-black font-sans font-bold py-3.5 transition-transform duration-200 active:scale-[0.98] disabled:opacity-50"
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'SALVANDO...' : 'SALVAR IDENTIDADE'}
                </span>
            </button>

            {/* Danger Zone */}
            <div className="mt-10 border border-red-500/20 rounded-lg p-6 bg-red-500/5">
                <h3 className="text-red-400 font-heading uppercase text-sm tracking-widest mb-3">Zona de Perigo</h3>
                <p className="text-[#888] text-xs mb-4">Ação irreversível. Todos os seus dados serão apagados.</p>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-red-500 border border-red-500/30 px-4 py-2 rounded text-xs font-mono uppercase tracking-widest hover:bg-red-500/10 transition-colors"
                >
                    Excluir Minha Conta
                </button>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#0a0a0a] border border-red-500/30 rounded-lg p-6 max-w-md w-full text-center">
                        <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-white mb-2 uppercase font-heading">Apagar Conta?</h3>
                        <p className="text-[#888] text-sm mb-6">Todos os seus cursos, progresso e assinaturas serão apagados de nossos servidores.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-3 border border-[#333] hover:bg-[#111] text-white rounded font-bold">CANCELAR</button>
                            <button onClick={handleDeleteAccount} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded font-bold">CONFIRMAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
