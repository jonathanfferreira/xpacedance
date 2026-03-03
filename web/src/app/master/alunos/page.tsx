'use client';

import { Users, Search, ShieldOff, ShieldCheck, UserX, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Student {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
}

export default function MasterStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const supabase = createClient();

    const fetchStudents = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('users')
            .select('id, email, full_name, role, created_at')
            .order('created_at', { ascending: false });
        if (!error && data) setStudents(data);
        setLoading(false);
    };

    useEffect(() => { fetchStudents(); }, []);

    const handleBan = async (userId: string) => {
        if (!confirm("Tem certeza que deseja BANIR este aluno? Ele perderá acesso permanentemente.")) return;
        const { error } = await supabase.from('users').update({ role: 'banned' }).eq('id', userId);
        if (error) { alert("Erro: " + error.message); return; }
        alert("Aluno banido da plataforma.");
        fetchStudents();
    };

    const handleSuspend = async (userId: string) => {
        if (!confirm("Suspender este aluno? Ele perderá acesso temporário.")) return;
        const { error } = await supabase.from('users').update({ role: 'suspended' }).eq('id', userId);
        if (error) { alert("Erro: " + error.message); return; }
        alert("Aluno suspenso.");
        fetchStudents();
    };

    const handleRestore = async (userId: string) => {
        const { error } = await supabase.from('users').update({ role: 'student' }).eq('id', userId);
        if (error) { alert("Erro: " + error.message); return; }
        alert("Acesso restaurado.");
        fetchStudents();
    };

    const filtered = students.filter(s =>
        s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div>
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-2">
                    ALUNOS GLOBAIS
                </h1>
                <p className="text-[#888] font-mono text-sm uppercase tracking-widest">
                    Visão Geral de todos os consumidores da Plataforma
                </p>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar aluno por nome ou email..."
                        className="w-full bg-[#111] border border-[#222] rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-red-500/50 transition-colors"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={fetchStudents} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-[#222] bg-[#111] text-[#888] rounded-full text-sm font-medium hover:text-white hover:border-[#333] transition-colors">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Sincronizar
                    </button>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#111] text-[#666] text-xs uppercase font-mono tracking-widest border-b border-[#222]">
                                <th className="p-4 font-normal">Aluno</th>
                                <th className="p-4 font-normal">Role</th>
                                <th className="p-4 font-normal hidden md:table-cell">Membro Desde</th>
                                <th className="p-4 font-normal text-right">Ações Globais</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-sans divide-y divide-[#1a1a1a]">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-[#555]">Carregando cadastros...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-[#555]">Nenhum aluno encontrado.</td></tr>
                            ) : (
                                filtered.map((aluno) => (
                                    <tr key={aluno.id} className="hover:bg-[#111] transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center font-bold text-[#888] font-mono text-xs">
                                                    {(aluno.full_name || aluno.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{aluno.full_name || 'Sem nome'}</p>
                                                    <p className="text-[#666] text-xs font-mono">{aluno.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded border
                                                ${aluno.role === 'admin' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                                                    aluno.role === 'escola' ? 'text-purple-400 border-purple-400/30 bg-purple-400/10' :
                                                        'text-[#888] border-[#333] bg-[#111]'}
                                            `}>
                                                {aluno.role}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[#666] hidden md:table-cell font-mono text-xs">
                                            {new Date(aluno.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {(aluno.role === 'banned' || aluno.role === 'suspended') ? (
                                                    <button onClick={() => handleRestore(aluno.id)} className="p-2 text-green-500/70 hover:text-green-500 hover:bg-green-500/10 rounded transition-colors" title="Restaurar Acesso">
                                                        <ShieldCheck size={16} />
                                                    </button>
                                                ) : (
                                                    <>
                                                        {aluno.role !== 'admin' && (
                                                            <button onClick={() => handleSuspend(aluno.id)} className="p-2 text-[#666] hover:text-yellow-500 hover:bg-yellow-500/10 rounded transition-colors" title="Suspender (temporário)">
                                                                <ShieldOff size={16} />
                                                            </button>
                                                        )}
                                                        {aluno.role !== 'admin' && (
                                                            <button onClick={() => handleBan(aluno.id)} className="p-2 text-[#666] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Banir Aluno (permanente)">
                                                                <UserX size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
