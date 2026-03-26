'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Users, BookOpen, Loader2, X } from 'lucide-react';

interface DeactivationPreview {
    active: boolean;
    tenantName?: string;
    activeCourses?: number;
    activeStudents?: number;
}

interface DeactivationModalProps {
    onClose: () => void;
    onConfirmed: () => void;
}

export function DeactivationModal({ onClose, onConfirmed }: DeactivationModalProps) {
    const [preview, setPreview] = useState<DeactivationPreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [step, setStep] = useState<'preview' | 'confirm'>('preview');
    const [reason, setReason] = useState('');

    useEffect(() => {
        fetch('/api/studio/deactivate')
            .then(r => r.json())
            .then(setPreview)
            .finally(() => setLoading(false));
    }, []);

    const handleConfirm = async () => {
        setConfirming(true);
        try {
            const res = await fetch('/api/studio/deactivate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason || 'Solicitado pelo usuário' }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Erro ao desativar conta.');
                return;
            }

            onConfirmed();
        } catch {
            alert('Erro de conexão. Tente novamente.');
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="bg-[#080808] border border-red-500/20 rounded-xl p-8 w-full max-w-md shadow-2xl">
                {/* Botão fechar */}
                <button onClick={onClose} className="absolute top-4 right-4 text-[#555] hover:text-white transition-colors">
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-display font-bold text-white uppercase tracking-tight">
                            Encerrar Conta de Criador
                        </h2>
                        <p className="text-[#555] text-xs">Esta ação não pode ser desfeita facilmente.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 size={24} className="text-[#555] animate-spin" />
                    </div>
                ) : step === 'preview' ? (
                    <>
                        {/* Preview do impacto */}
                        <div className="space-y-3 mb-6">
                            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-4 flex items-center gap-3">
                                <BookOpen size={16} className="text-amber-500 shrink-0" />
                                <div>
                                    <p className="text-white text-sm font-medium">{preview?.activeCourses || 0} curso(s) serão arquivados</p>
                                    <p className="text-[#555] text-xs">Novas vendas serão bloqueadas</p>
                                </div>
                            </div>
                            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-4 flex items-center gap-3">
                                <Users size={16} className="text-green-500 shrink-0" />
                                <div>
                                    <p className="text-white text-sm font-medium">{preview?.activeStudents || 0} aluno(s) mantêm o acesso</p>
                                    <p className="text-[#555] text-xs">Quem já comprou não perde o conteúdo</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-[#666] text-xs mb-6 leading-relaxed">
                            Seu perfil de criador <span className="text-white font-mono">{preview?.tenantName}</span> será suspenso.
                            Você voltará a ser um aluno XPACE normal.
                        </p>

                        <button
                            onClick={() => setStep('confirm')}
                            className="w-full py-3 bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20 hover:border-red-500/60 transition-all rounded-lg text-sm font-mono uppercase tracking-widest"
                        >
                            Continuar →
                        </button>
                    </>
                ) : (
                    <>
                        {/* Passo de confirmação */}
                        <p className="text-[#666] text-sm mb-4">
                            Opcional: nos conte por que você está saindo (isso ajuda a melhorar a plataforma).
                        </p>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Ex: mudança de foco, retorno mais tarde..."
                            maxLength={300}
                            rows={3}
                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg p-3 text-white text-sm font-sans resize-none outline-none focus:border-[#333] placeholder:text-[#333] mb-4"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep('preview')}
                                className="flex-1 py-3 border border-[#222] text-[#666] hover:text-white hover:border-[#333] transition-all rounded-lg text-sm font-mono uppercase"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={confirming}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white transition-all rounded-lg text-sm font-mono uppercase tracking-widest disabled:opacity-40"
                            >
                                {confirming ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 size={14} className="animate-spin" /> Encerrando...
                                    </span>
                                ) : 'Confirmar Encerramento'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
