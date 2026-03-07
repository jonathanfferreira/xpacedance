'use client';

import { Save, Sliders, Database, CreditCard, PlaySquare, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MasterConfigPage() {
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const [splitRate, setSplitRate] = useState('15');
    const [bunnyLibraryId, setBunnyLibraryId] = useState('258384');
    const [xpPerLesson, setXpPerLesson] = useState('50');
    const [pwaOffline, setPwaOffline] = useState('72h');

    useEffect(() => {
        fetch('/api/master/config')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data?.settings) return;
                const s = data.settings;
                if (s.split_rate) setSplitRate(s.split_rate);
                if (s.bunny_library_id) setBunnyLibraryId(s.bunny_library_id);
                if (s.xp_per_lesson) setXpPerLesson(s.xp_per_lesson);
                if (s.pwa_offline) setPwaOffline(s.pwa_offline);
            })
            .catch(() => {});
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/master/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ splitRate, bunnyLibraryId, xpPerLesson, pwaOffline }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Erro ao salvar.');
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div>
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-2">
                    ENGINE DA PLATAFORMA
                </h1>
                <p className="text-[#888] font-mono text-sm uppercase tracking-widest">
                    Configurações Globais (Tech Params, Integrações)
                </p>
            </div>

            {saved && (
                <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-fade-in font-mono text-sm">
                    <CheckCircle size={18} /> Parâmetros salvos com sucesso!
                </div>
            )}
            {error && (
                <div className="fixed top-6 right-6 z-50 bg-red-700 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-2 font-mono text-sm">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Asaas Config */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <CreditCard className="text-red-500" size={24} />
                        <h2 className="text-white font-bold font-heading uppercase tracking-wide">Painel Asaas</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-[#888] uppercase mb-1">API Key (Production)</label>
                            <input
                                type="password"
                                defaultValue={process.env.NEXT_PUBLIC_ASAAS_API_KEY ? '********************************' : ''}
                                placeholder="Insira sua ASAAS_API_KEY aqui..."
                                className="w-full bg-[#111] border border-[#222] rounded p-3 text-white font-mono text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                                readOnly
                            />
                            <p className="text-[#555] text-xs mt-1">Gerenciada via variável de ambiente ASAAS_API_KEY no servidor.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#888] uppercase mb-1">Taxa de Split Padrão (XTAGE %)</label>
                            <input
                                type="number"
                                value={splitRate}
                                onChange={e => setSplitRate(e.target.value)}
                                min="0"
                                max="100"
                                className="w-full bg-[#111] border border-[#222] rounded p-3 text-white font-mono text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                            />
                            <p className="text-[#555] text-xs mt-1">Essa taxa (%) é deduzida de todas as vendas das Escolas automaticamente no Gateway.</p>
                        </div>
                        <button onClick={handleSave} disabled={saving} className="bg-[#111] border border-[#333] hover:bg-[#222] text-white px-4 py-2 rounded text-sm font-bold mt-2 transition-colors flex items-center gap-2 disabled:opacity-50">
                            <Save size={14} /> Salvar Split Global
                        </button>
                    </div>
                </div>

                {/* Bunny.net Config */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <PlaySquare className="text-red-500" size={24} />
                        <h2 className="text-white font-bold font-heading uppercase tracking-wide">Bunny.net (Video API)</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-[#888] uppercase mb-1">Stream Library ID</label>
                            <input
                                type="text"
                                value={bunnyLibraryId}
                                onChange={e => setBunnyLibraryId(e.target.value)}
                                className="w-full bg-[#111] border border-[#222] rounded p-3 text-white font-mono text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#888] uppercase mb-1">Access Key</label>
                            <input type="password" defaultValue="********************************" readOnly className="w-full bg-[#111] border border-[#222] rounded p-3 text-white font-mono text-sm" />
                            <p className="text-[#555] text-xs mt-1">Gerenciada via variável de ambiente BUNNY_API_KEY no servidor.</p>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded mt-4">
                            <div>
                                <p className="text-white font-bold text-sm">HLS DRM Ativado</p>
                                <p className="text-red-500/80 text-xs">Vídeos criptografados contra download on-the-fly.</p>
                            </div>
                            <div className="w-10 h-6 bg-red-500 rounded-full flex items-center p-1">
                                <div className="w-4 h-4 bg-white rounded-full translate-x-4"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gamification Engine */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-6 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <Sliders className="text-red-500" size={24} />
                        <h2 className="text-white font-bold font-heading uppercase tracking-wide">Engine de Gamificação e App</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-mono text-[#888] uppercase mb-1">XP Ganho por Aula Base</label>
                            <input
                                type="number"
                                value={xpPerLesson}
                                onChange={e => setXpPerLesson(e.target.value)}
                                min="0"
                                className="w-full bg-[#111] border border-[#222] rounded p-3 text-white font-mono text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-mono text-[#888] uppercase mb-1">Tolerância de PWA Offline (HLS)</label>
                            <select
                                value={pwaOffline}
                                onChange={e => setPwaOffline(e.target.value)}
                                className="w-full bg-[#111] border border-[#222] rounded p-3 text-white font-mono text-sm outline-none focus:border-red-500/50 transition-colors"
                            >
                                <option value="off">Desativado (Risco Pirataria Alto)</option>
                                <option value="72h">72 Horas Cache (Recomendado)</option>
                                <option value="30d">30 Dias (Netflix Style)</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} className="w-full py-4 mt-8 flex items-center justify-center gap-2 bg-red-500 text-white font-bold uppercase tracking-widest rounded hover:bg-red-600 transition-colors disabled:opacity-50">
                        <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Parâmetros da Construção'}
                    </button>
                </div>
            </div>
        </div>
    );
}
