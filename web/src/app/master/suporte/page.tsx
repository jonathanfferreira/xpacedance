import { createClient } from '@supabase/supabase-js';
import { MessageSquare, AlertCircle, CheckCircle2, Clock, User2 } from 'lucide-react';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getSupportData() {
    // Busca os logs de auditoria mais recentes (ações críticas do sistema)
    const [{ data: auditLogs }, { data: recentUsers }, { data: errorUsers }] = await Promise.all([
        supabaseAdmin
            .from('audit_logs')
            .select('id, action, user_id, created_at, metadata')
            .order('created_at', { ascending: false })
            .limit(30),

        // Usuários registrados recentemente (últimas 48h)
        supabaseAdmin
            .from('users')
            .select('id, full_name, email, role, created_at')
            .gte('created_at', new Date(Date.now() - 48 * 3600000).toISOString())
            .order('created_at', { ascending: false })
            .limit(20),

        // Usuários com status suspenso (possíveis problemas)
        supabaseAdmin
            .from('users')
            .select('id, full_name, email, role')
            .eq('status', 'suspended')
            .limit(10),
    ]);

    return {
        auditLogs: auditLogs || [],
        recentUsers: recentUsers || [],
        errorUsers: errorUsers || [],
    };
}

export default async function MasterSupportPage() {
    const { auditLogs, recentUsers, errorUsers } = await getSupportData();

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-1">
                    Suporte & Auditoria
                </h1>
                <p className="text-[#888] font-mono text-xs uppercase tracking-widest">
                    Logs do sistema, usuários recentes e alertas
                </p>
            </div>

            {/* KPIs Rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded hover:border-[#333] transition-colors">
                    <div className="flex justify-between items-start mb-3">
                        <p className="text-[#666] text-xs font-mono uppercase tracking-widest">Novos Usuários (48h)</p>
                        <User2 size={16} className="text-[#333]" />
                    </div>
                    <p className="text-white text-3xl font-bold font-mono">{recentUsers.length}</p>
                </div>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded hover:border-[#333] transition-colors">
                    <div className="flex justify-between items-start mb-3">
                        <p className="text-[#666] text-xs font-mono uppercase tracking-widest">Ações Auditadas</p>
                        <CheckCircle2 size={16} className="text-[#333]" />
                    </div>
                    <p className="text-white text-3xl font-bold font-mono">{auditLogs.length}</p>
                </div>
                <div className={`bg-[#0a0a0a] border p-5 rounded hover:border-[#333] transition-colors ${errorUsers.length > 0 ? 'border-red-900/50' : 'border-[#1a1a1a]'}`}>
                    <div className="flex justify-between items-start mb-3">
                        <p className="text-[#666] text-xs font-mono uppercase tracking-widest">Suspensos</p>
                        <AlertCircle size={16} className={errorUsers.length > 0 ? 'text-red-500' : 'text-[#333]'} />
                    </div>
                    <p className={`text-3xl font-bold font-mono ${errorUsers.length > 0 ? 'text-red-400' : 'text-white'}`}>
                        {errorUsers.length}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Novos Usuários */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded">
                    <div className="p-5 border-b border-[#1a1a1a]">
                        <h2 className="text-white font-bold font-heading uppercase tracking-wide text-sm flex items-center gap-2">
                            <User2 size={14} />
                            Registros Recentes (48h)
                        </h2>
                    </div>
                    <div className="divide-y divide-[#111]">
                        {recentUsers.length === 0 ? (
                            <p className="text-[#555] text-sm text-center py-8">Nenhum registro recente.</p>
                        ) : recentUsers.map(u => (
                            <div key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#111] transition-colors">
                                <div>
                                    <p className="text-white text-sm font-medium">{u.full_name || 'Sem nome'}</p>
                                    <p className="text-[#666] text-xs font-mono">{u.email}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-[#6324b2]/30 text-[#6324b2] bg-[#6324b2]/10">
                                        {u.role}
                                    </span>
                                    <p className="text-[#555] text-[10px] font-mono mt-1">
                                        {new Date(u.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Audit Log */}
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded">
                    <div className="p-5 border-b border-[#1a1a1a]">
                        <h2 className="text-white font-bold font-heading uppercase tracking-wide text-sm flex items-center gap-2">
                            <MessageSquare size={14} />
                            Log de Auditoria
                        </h2>
                    </div>
                    <div className="divide-y divide-[#111] max-h-96 overflow-y-auto">
                        {auditLogs.length === 0 ? (
                            <p className="text-[#555] text-sm text-center py-8">Nenhum log de auditoria.</p>
                        ) : (auditLogs as any[]).map(log => (
                            <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[#111] transition-colors">
                                <Clock size={12} className="text-[#444] mt-1 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-mono truncate">{log.action}</p>
                                    <p className="text-[#555] text-[10px] font-mono">
                                        {new Date(log.created_at).toLocaleString('pt-BR', {
                                            day: '2-digit', month: 'short',
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                        {log.user_id ? ` · ${log.user_id.slice(0, 8)}…` : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Suspensos */}
            {errorUsers.length > 0 && (
                <div className="bg-[#0a0a0a] border border-red-900/30 rounded">
                    <div className="p-5 border-b border-red-900/30 flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-500" />
                        <h2 className="text-red-400 font-bold font-heading uppercase tracking-wide text-sm">
                            Contas Suspensas ({errorUsers.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-[#111]">
                        {errorUsers.map(u => (
                            <div key={u.id} className="flex items-center justify-between px-5 py-3">
                                <div>
                                    <p className="text-white text-sm">{u.full_name || 'Sem nome'}</p>
                                    <p className="text-[#666] text-xs font-mono">{u.email}</p>
                                </div>
                                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-red-900/50 text-red-400 bg-red-400/10">
                                    suspenso
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
