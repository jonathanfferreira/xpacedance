'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Send, Heart, CornerDownRight } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'

interface CommunityBoardProps {
    lessonId: string
}

interface CommentUser {
    id: string
    full_name: string | null
    avatar_url: string | null
}

interface Comment {
    id: string
    content: string
    likes: number
    created_at: string
    parent_id: string | null
    users: CommentUser | null
}

export function CommunityBoard({ lessonId }: CommunityBoardProps) {
    const supabase = createClient()
    const [newComment, setNewComment] = useState('')
    const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [currentUserProfile, setCurrentUserProfile] = useState<{ id: string; full_name?: string; avatar_url?: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [likingIds, setLikingIds] = useState<Set<string>>(new Set()) // Lock prevent spam
    const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set()) // Persisted user likes

    const timeAgo = (dateStr: string) => {
        const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return `Agora mesmo`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
        return `${Math.floor(diff / 86400)}d atrás`;
    }

    const fetchComments = useCallback(async () => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                id,
                content,
                likes,
                created_at,
                parent_id,
                users (
                    id,
                    full_name,
                    avatar_url
                )
            `)
            .eq('lesson_id', lessonId)
            .order('created_at', { ascending: false })

        if (data) {
            const normalized: Comment[] = data.map((row: any) => ({
                ...row,
                users: Array.isArray(row.users) ? row.users[0] ?? null : row.users,
            }))
            setComments(normalized)
        }
        if (error) console.error("Erro ao buscar mural:", error)
        setLoading(false)
    }, [lessonId, supabase])

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('users').select('id, full_name, avatar_url').eq('id', user.id).single()
                setCurrentUserProfile(profile || { id: user.id })

                const { data: userLikes } = await supabase.from('comment_likes').select('comment_id').eq('user_id', user.id)
                if (userLikes) {
                    setLikedCommentIds(new Set(userLikes.map((l: any) => l.comment_id)))
                }
            }
        }
        fetchUser()
        fetchComments()

        // Realtime: on INSERT, fetch only the new comment (not all) and prepend
        const channel = supabase.channel(`public:comments:lesson_${lessonId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'comments', filter: `lesson_id=eq.${lessonId}` },
                async (payload) => {
                    const { data: newItem } = await supabase
                        .from('comments')
                        .select(`id, content, likes, created_at, parent_id, users(id, full_name, avatar_url)`)
                        .eq('id', payload.new.id)
                        .single()

                    if (newItem) {
                        const normalized: Comment = {
                            ...(newItem as any),
                            users: Array.isArray((newItem as any).users) ? (newItem as any).users[0] ?? null : (newItem as any).users,
                        }
                        setComments(prev => [normalized, ...prev])
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'comments', filter: `lesson_id=eq.${lessonId}` },
                (payload) => {
                    // Update only the changed comment's likes in local state
                    setComments(prev => prev.map(c =>
                        c.id === payload.new.id ? { ...c, likes: payload.new.likes } : c
                    ))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [lessonId, supabase, fetchComments])

    // Bad words pt-br (partial list for MVP)
    const BANNED_WORDS = ['puta', 'caralho', 'porra', 'buceta', 'crl', 'fdp'];
    // RegEx checking for URLs
    const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/gi;

    const handleSend = async () => {
        if (!newComment.trim() || !currentUserProfile?.id) return

        let contentToSend = newComment

        // 1. Validate if there are links (security)
        if (URL_REGEX.test(contentToSend)) {
            alert('🚨 O envio de links externos não é permitido na comunidade XPACE DANCE.')
            return;
        }

        // 2. Validate and mask bad words
        BANNED_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            contentToSend = contentToSend.replace(regex, '***');
        });

        const parentId = replyTo?.id || null
        setNewComment('')
        setReplyTo(null)

        const { error } = await supabase.from('comments').insert({
            lesson_id: lessonId,
            user_id: currentUserProfile.id,
            content: contentToSend,
            parent_id: parentId,
        })

        if (error) {
            console.error("Erro ao postar comentário:", error)
            setNewComment(contentToSend)
        }
    }

    const handleLike = async (commentId: string, currentLikes: number) => {
        if (likingIds.has(commentId) || !currentUserProfile?.id) return;
        setLikingIds(prev => new Set(prev).add(commentId));

        const isCurrentlyLiked = likedCommentIds.has(commentId);
        const newLikesCount = isCurrentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

        // 1. Optimistic Update (UI Local)
        setLikedCommentIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyLiked) {
                next.delete(commentId);
            } else {
                next.add(commentId);
            }
            return next;
        });
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: newLikesCount } : c));

        try {
            // 2. Transaction Database Interaction
            if (isCurrentlyLiked) {
                await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', currentUserProfile.id);
                await supabase.rpc('decrement_comment_likes', { c_id: commentId });
            } else {
                await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: currentUserProfile.id });
                await supabase.rpc('increment_comment_likes', { c_id: commentId });
            }
        } catch (error) {
            console.error("Erro ao alterar like:", error);
            // Revert state if backend fails
            setLikedCommentIds(prev => {
                const next = new Set(prev);
                if (isCurrentlyLiked) {
                    next.add(commentId);
                } else {
                    next.delete(commentId);
                }
                return next;
            });
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: currentLikes } : c));
        } finally {
            setLikingIds(prev => { const s = new Set(prev); s.delete(commentId); return s; });
        }
    }

    const parentComments = comments.filter(c => !c.parent_id)
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId).reverse()

    return (
        <div className="w-full mt-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-sm bg-secondary/10 border border-secondary/30 flex items-center justify-center">
                    <MessageSquare size={20} className="text-secondary" />
                </div>
                <div>
                    <h2 className="font-heading text-xl uppercase tracking-widest text-white">Mural da Aula</h2>
                    <p className="text-[10px] font-sans text-[#666]">Discuta técnicas e tire dúvidas ao vivo</p>
                </div>
            </div>

            {/* Input Form */}
            <div className="bg-[#0A0A0A] border border-[#222] rounded-sm p-4 mb-8 flex gap-4 items-start">
                <div className="relative w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center font-heading text-primary border border-primary/30 shrink-0 overflow-hidden">
                    {currentUserProfile?.avatar_url ? (
                        <Image src={currentUserProfile.avatar_url} alt="Profile" fill className="object-cover grayscale" unoptimized />
                    ) : (
                        currentUserProfile?.full_name?.substring(0, 2).toUpperCase() || "YOU"
                    )}
                </div>
                <div className="flex-1 relative">
                    {replyTo && (
                        <div className="flex items-center gap-2 mb-2 text-xs text-[#888] font-sans">
                            <CornerDownRight size={12} className="text-secondary" />
                            <span>Respondendo <span className="text-white">{replyTo.name}</span></span>
                            <button onClick={() => setReplyTo(null)} className="ml-auto text-[#555] hover:text-white">✕</button>
                        </div>
                    )}
                    <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend() }}
                        placeholder={replyTo ? `Responda ${replyTo.name}...` : "Compartilhe uma dúvida ou insight..."}
                        className="w-full bg-[#111] border border-[#222] focus:border-secondary/50 rounded-sm p-3 min-h-[80px] text-sm text-white font-sans outline-none transition-colors resize-none placeholder:text-[#555]"
                    />
                    <div className="absolute right-2 bottom-2">
                        <button
                            onClick={handleSend}
                            disabled={!newComment.trim()}
                            className="bg-secondary text-black p-2 rounded-sm hover:bg-white transition-colors disabled:opacity-50 disabled:hover:bg-secondary"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            {loading ? (
                <div className="animate-pulse flex flex-col gap-4">
                    <div className="h-16 bg-[#111] rounded-sm w-full"></div>
                    <div className="h-16 bg-[#111] rounded-sm w-full"></div>
                </div>
            ) : parentComments.length === 0 ? (
                <p className="text-[#555] text-sm italic py-4">Nenhum comentário ainda. Seja o primeiro a puxar o assunto!</p>
            ) : (
                <div className="space-y-6">
                    {parentComments.map(comment => {
                        const replies = getReplies(comment.id)

                        return (
                            <div key={comment.id} className="flex gap-4">
                                <div className="relative w-10 h-10 rounded-full bg-[#222] flex items-center justify-center font-heading text-[#888] border border-[#333] shrink-0 overflow-hidden">
                                    {comment.users?.avatar_url ? (
                                        <Image src={comment.users.avatar_url} alt="User" fill className="object-cover grayscale" unoptimized />
                                    ) : (
                                        comment.users?.full_name?.substring(0, 2).toUpperCase() || "?"
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="font-heading text-sm uppercase text-white hover:text-primary transition-colors cursor-pointer">
                                            {comment.users?.full_name || 'DANCER ANÔNIMO'}
                                        </span>
                                        <span className="text-[10px] text-[#555] font-sans ml-auto">{timeAgo(comment.created_at)}</span>
                                    </div>

                                    <p className="text-sm font-sans text-[#ccc] leading-relaxed mb-2">
                                        {comment.content}
                                    </p>

                                    <div className="flex items-center gap-4 mb-4">
                                        <button
                                            onClick={() => handleLike(comment.id, comment.likes)}
                                            disabled={likingIds.has(comment.id)}
                                            className={`flex items-center gap-1.5 text-xs transition-colors group disabled:opacity-50 ${likedCommentIds.has(comment.id) ? 'text-secondary' : 'text-[#666] hover:text-secondary'}`}
                                        >
                                            <Heart size={14} className={likedCommentIds.has(comment.id) ? 'fill-secondary text-secondary' : 'group-hover:fill-secondary/20'} /> {comment.likes}
                                        </button>
                                        <button
                                            onClick={() => setReplyTo({ id: comment.id, name: comment.users?.full_name || 'Dancer' })}
                                            className="text-xs text-[#666] hover:text-white transition-colors font-sans uppercase tracking-widest text-[10px]"
                                        >
                                            Responder
                                        </button>
                                    </div>

                                    {/* Replies */}
                                    {replies.length > 0 && (
                                        <div className="pl-4 border-l-2 border-[#222] space-y-4">
                                            {replies.map(reply => (
                                                <div key={reply.id} className="flex gap-3">
                                                    <div className="relative w-8 h-8 rounded-full bg-[#111] flex items-center justify-center font-heading text-white border border-[#333] shrink-0 overflow-hidden">
                                                        {reply.users?.avatar_url ? (
                                                            <Image src={reply.users.avatar_url} alt="User" fill className="object-cover grayscale" unoptimized />
                                                        ) : (
                                                            reply.users?.full_name?.substring(0, 2).toUpperCase() || "?"
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-baseline gap-2 mb-0.5">
                                                            <span className="font-heading text-xs uppercase text-white cursor-pointer hover:text-primary transition-colors">
                                                                {reply.users?.full_name || 'DANCER ANÔNIMO'}
                                                            </span>
                                                            <span className="text-[10px] text-[#555] font-sans ml-auto">{timeAgo(reply.created_at)}</span>
                                                        </div>
                                                        <p className="text-xs font-sans text-[#aaa] leading-relaxed mb-3">
                                                            {reply.content}
                                                        </p>
                                                        <div className="flex items-center gap-4 mb-4">
                                                            <button
                                                                onClick={() => handleLike(reply.id, reply.likes)}
                                                                disabled={likingIds.has(reply.id)}
                                                                className={`flex items-center gap-1.5 text-xs transition-colors group disabled:opacity-50 ${likedCommentIds.has(reply.id) ? 'text-secondary' : 'text-[#666] hover:text-secondary'}`}
                                                            >
                                                                <Heart size={12} className={likedCommentIds.has(reply.id) ? 'fill-secondary text-secondary' : 'group-hover:fill-secondary/20'} /> {reply.likes}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
