"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Heart, MessageSquare, Loader2, UserCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
    full_name: string;
    avatar_url: string | null;
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    likes_count: number;
    parent_id: string | null;
    user_id: string;
    users: User;
    currentUserLiked: boolean;
    replies: Comment[];
}

export function LessonComments({ lessonId }: { lessonId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [content, setContent] = useState("");
    const [replyingTo, setReplyingTo] = useState<{ id: string, name: string } | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const loadComments = async () => {
        try {
            const res = await fetch(`/api/comments?lesson_id=${lessonId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoadingSubmit(true);
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lesson_id: lessonId,
                    content,
                    parent_id: replyingTo?.id || null
                })
            });

            if (res.ok) {
                // Ao invez de carregar tudo, poderia só injetar, mas loadComments garante ordem correta e replies de outros
                await loadComments();
                setContent("");
                setReplyingTo(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingSubmit(false);
        }
    };

    const handleLike = async (commentId: string, currentLiked: boolean) => {
        // Optimistic UI Update
        const updateLikes = (list: Comment[]): Comment[] => {
            return list.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        currentUserLiked: !currentLiked,
                        likes_count: currentLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1
                    };
                }
                if (c.replies?.length > 0) {
                    return { ...c, replies: updateLikes(c.replies) };
                }
                return c;
            });
        };

        setComments(updateLikes(comments));

        try {
            await fetch("/api/comments/like", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    comment_id: commentId,
                    action: currentLiked ? 'unlike' : 'like'
                })
            });
        } catch (error) {
            console.error("Erro ao curtir:", error);
            // Revert on error
            loadComments();
        }
    };

    const handleReply = (commentId: string, userName: string) => {
        setReplyingTo({ id: commentId, name: userName });
        inputRef.current?.focus();
    };

    const CommentNode = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
        const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR });

        return (
            <div className={`flex gap-4 ${isReply ? 'ml-8 md:ml-12 mt-4 border-l-2 border-primary/20 pl-4' : 'mt-6'}`}>
                {/* Avatar */}
                <div className="shrink-0">
                    {comment.users?.avatar_url ? (
                        <img src={comment.users.avatar_url} alt={comment.users.full_name} className="w-10 h-10 rounded-full object-cover border border-[#333]" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-[#888]">
                            <UserCircle2 size={24} />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{comment.users?.full_name || "Aluno"}</span>
                        <span className="text-[#666] text-xs font-mono">{timeAgo}</span>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                        <button
                            onClick={() => handleLike(comment.id, comment.currentUserLiked)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${comment.currentUserLiked ? 'text-rose-500' : 'text-[#888] hover:text-rose-400'}`}
                        >
                            <Heart size={14} className={comment.currentUserLiked ? 'fill-current' : ''} />
                            {comment.likes_count > 0 && comment.likes_count}
                        </button>

                        {!isReply && (
                            <button
                                onClick={() => handleReply(comment.id, comment.users?.full_name || "Aluno")}
                                className="flex items-center gap-1.5 text-xs font-bold text-[#888] hover:text-primary transition-colors uppercase tracking-wider"
                            >
                                <MessageSquare size={14} />
                                Responder
                            </button>
                        )}
                    </div>

                    {/* Render Replies Recursive */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                            {comment.replies.map(r => <CommentNode key={r.id} comment={r} isReply={true} />)}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden mt-8">
            <div className="p-6 border-b border-[#1a1a1a] flex items-center justify-between">
                <div>
                    <h2 className="text-white font-display font-bold text-xl uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="text-primary" size={24} />
                        Comunidade
                    </h2>
                    <p className="text-[#888] text-xs font-mono tracking-widest uppercase mt-1">Conecte-se com a turma e tire dúvidas</p>
                </div>
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold font-mono">
                    {comments.length} COMENTÁRIOS
                </span>
            </div>

            <div className="p-6">
                {/* Formulário de Envio */}
                <form onSubmit={handleSubmit} className="mb-10 block">
                    {replyingTo && (
                        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-4 py-2 rounded-t text-sm relative top-1">
                            <span className="text-primary font-mono text-xs tracking-wider">Respondendo a <strong className="font-bold text-white">{replyingTo.name}</strong></span>
                            <button type="button" onClick={() => setReplyingTo(null)} className="text-[#888] hover:text-white text-xs font-bold uppercase tracking-widest px-2">Cancelar</button>
                        </div>
                    )}
                    <div className="relative group">
                        <textarea
                            ref={inputRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={replyingTo ? "Escreva sua resposta..." : "Deixe um comentário, dúvida ou insight..."}
                            className={`w-full bg-[#111] border ${replyingTo ? 'border-primary/50' : 'border-[#2a2a2a]'} text-white placeholder-[#555] p-4 pr-16 rounded-xl resize-none focus:outline-none focus:border-primary transition-colors min-h-[100px] text-sm leading-relaxed shadow-inner`}
                            required
                        />
                        <button
                            type="submit"
                            disabled={loadingSubmit || !content.trim()}
                            className="absolute bottom-4 right-4 bg-primary hover:bg-primary-hover text-white w-10 h-10 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed transform group-focus-within:scale-105"
                        >
                            {loadingSubmit ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                        </button>
                    </div>
                </form>

                {/* Lista de Comentários */}
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 bg-[#111] rounded-lg border border-[#1a1a1a] border-dashed">
                        <MessageSquare size={32} className="mx-auto text-[#333] mb-3" />
                        <h3 className="text-[#888] font-bold uppercase tracking-widest text-sm mb-1">Nenhum comentário ainda</h3>
                        <p className="text-[#555] text-xs">Seja o primeiro a compartilhar seus conhecimentos sobre esta aula.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {comments.map(comment => (
                            <CommentNode key={comment.id} comment={comment} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
