'use client';

import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Loader2, CheckCircle2, Clock, Info } from 'lucide-react';

export default function DomainSettingsPage() {
    const [domains, setDomains] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchDomains = async () => {
        try {
            const res = await fetch('/api/studio/tenant/domain');
            const data = await res.json();
            setDomains(data.domains || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, []);

    const handleAddDomain = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await fetch('/api/studio/tenant/domain', {
                method: 'POST',
                body: JSON.stringify({ domain: newDomain.trim() }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Erro ao adicionar domínio');

            setMessage({ text: 'Domínio adicionado com sucesso', type: 'success' });
            setNewDomain('');
            fetchDomains();
        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, domainName: string) => {
        if (!confirm(`Tem certeza que deseja remover o domínio ${domainName}? A plataforma deixará de funcionar imediatamente nele.`)) return;

        try {
            const res = await fetch(`/api/studio/tenant/domain?id=${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }
            setDomains(domains.filter(d => d.id !== id));
        } catch (error: any) {
            alert(error.message);
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
        <div className="max-w-3xl animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Globe size={28} className="text-[#6324b2]" />
                    Domínios Customizados
                </h1>
                <p className="text-[#888] font-mono text-xs uppercase tracking-widest">
                    Utilize seu próprio endereço (Ex: alunos.suaescola.com)
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Lista e Add */}
                <div className="md:col-span-2 space-y-6">
                    <form onSubmit={handleAddDomain} className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded flex gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                required
                                value={newDomain}
                                onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
                                className="w-full bg-[#111] border border-[#333] rounded px-4 py-2.5 text-white focus:outline-none focus:border-white/50 transition-colors text-sm font-mono"
                                placeholder="alunos.suaescola.com"
                                pattern="^[a-z0-9.-]+\.[a-z]{2,}$"
                            />
                            {message.text && (
                                <p className={`text-[10px] font-mono mt-2 ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                                    {message.text}
                                </p>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={saving || !newDomain}
                            className="flex items-center justify-center gap-2 bg-white text-black px-6 py-2.5 rounded text-sm font-mono uppercase tracking-widest hover:bg-[#ccc] transition-colors disabled:opacity-50 shrink-0 h-[42px]"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Adicionar
                        </button>
                    </form>

                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded overflow-hidden">
                        <div className="p-4 border-b border-[#1a1a1a] bg-[#111]">
                            <h2 className="text-[#888] font-mono uppercase tracking-widest text-xs">Meus Domínios</h2>
                        </div>

                        {domains.length === 0 ? (
                            <div className="p-8 text-center text-[#555] font-mono text-sm uppercase tracking-widest">
                                Nenhum domínio adicionado.
                            </div>
                        ) : (
                            <ul className="divide-y divide-[#1a1a1a]">
                                {domains.map(domain => (
                                    <li key={domain.id} className="p-4 flex items-center justify-between hover:bg-[#111] transition-colors">
                                        <div>
                                            <p className="text-white font-mono text-sm font-medium">{domain.domain}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                {domain.verified ? (
                                                    <span className="flex items-center gap-1 text-green-400 text-[10px] font-mono uppercase tracking-wider">
                                                        <CheckCircle2 size={10} /> Verificado
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-[#ffbd2e] text-[10px] font-mono uppercase tracking-wider">
                                                        <Clock size={10} /> Aguardando DNS
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(domain.id, domain.domain)}
                                            className="p-2 text-[#555] hover:text-red-400 transition-colors rounded"
                                            title="Remover domínio"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Instruções */}
                <div className="md:col-span-1">
                    <div className="border border-[#222] border-dashed rounded p-5 sticky top-24">
                        <h3 className="text-white font-bold font-heading uppercase tracking-wide text-sm mb-4 flex items-center gap-2">
                            <Info size={16} className="text-[#6324b2]" />
                            Instruções de DNS
                        </h3>
                        <p className="text-[#888] text-xs mb-4">
                            Para que seu domínio funcione, você deve configurar um apontamento DNS no seu provedor (Cloudflare, Registro.br, Godaddy, etc).
                        </p>

                        <div className="bg-[#111] p-3 rounded mb-4">
                            <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest mb-1">Tipo</p>
                            <p className="text-white font-mono text-sm">CNAME</p>

                            <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest mt-3 mb-1">Nome / Host</p>
                            <p className="text-white font-mono text-sm">alunos</p>

                            <p className="text-[#555] text-[10px] font-mono uppercase tracking-widest mt-3 mb-1">Conteúdo / Destino</p>
                            <p className="text-white font-mono text-sm">cname.xpace.on</p>
                        </div>

                        <p className="text-[#555] text-[10px] font-mono leading-relaxed mt-4">
                            * Se quiser usar o domínio raiz (ex: suaescola.com), crie um apontamento tipo A para o IP <span className="text-white">76.76.21.21</span>.
                            A propagação pode levar até 24 horas.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
