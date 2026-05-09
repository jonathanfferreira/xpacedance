'use client'

import { useState } from 'react'
import { Heart, Share2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface LessonActionsProps {
    lessonId: string
    initialLikes: number
    initialIsLiked: boolean
}

export function LessonActions({ lessonId, initialLikes, initialIsLiked }: LessonActionsProps) {
    const [likes, setLikes] = useState(initialLikes)
    const [isLiked, setIsLiked] = useState(initialIsLiked)
    const [isLiking, setIsLiking] = useState(false)
    const supabase = createClient()

    const handleLike = async () => {
        if (isLiking) return;
        setIsLiking(true);

        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikes(prev => newIsLiked ? prev + 1 : prev - 1);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Você precisa estar logado para curtir.");
            setIsLiked(!newIsLiked);
            setLikes(prev => !newIsLiked ? prev + 1 : prev - 1);
            setIsLiking(false);
            return;
        }

        try {
            if (newIsLiked) {
                // Insert and increment
                await supabase.from('lesson_likes').insert({ lesson_id: lessonId, user_id: user.id });
                await supabase.rpc('increment_lesson_likes', { l_id: lessonId });
            } else {
                // Delete and decrement
                await supabase.from('lesson_likes').delete().eq('lesson_id', lessonId).eq('user_id', user.id);
                await supabase.rpc('decrement_lesson_likes', { l_id: lessonId });
            }
        } catch (error) {
            console.error("Erro ao processar curtida:", error);
            // Revert state if error
            setIsLiked(!newIsLiked);
            setLikes(prev => !newIsLiked ? prev + 1 : prev - 1);
        } finally {
            setIsLiking(false);
        }
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'XPACE DANCE',
                text: 'Olha essa aula surreal na XPACE DANCE!',
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert('Link copiado para a área de transferência!')
        }
    }

    const handleReport = () => {
        alert('Reportagem enviada para moderação. Obrigado por manter a comunidade segura!')
    }

    return (
        <div className="flex items-center gap-3 md:gap-4 shrink-0 border-t md:border-t-0 border-[#222] pt-4 md:pt-0">
            <button
                onClick={handleLike}
                className={`flex flex-col items-center justify-center w-14 h-14 bg-[#111] border transition-colors group ${isLiked ? 'border-secondary/50 text-secondary' : 'border-[#222] hover:border-primary/50 text-[#888] hover:text-white'}`}
            >
                <Heart size={20} className={`mb-1 transition-colors ${isLiked ? 'fill-secondary text-secondary' : 'group-hover:fill-secondary group-hover:text-secondary'}`} />
                <span className="text-[10px] font-mono tracking-widest">{likes}</span>
            </button>
            <button
                onClick={handleShare}
                className="flex flex-col items-center justify-center w-14 h-14 bg-[#111] border border-[#222] hover:border-primary/50 text-[#888] hover:text-white transition-colors"
                title="Compartilhar Aula"
            >
                <Share2 size={20} className="mb-1" />
            </button>
            <button
                onClick={handleReport}
                className="flex flex-col items-center justify-center w-14 h-14 bg-[#111] border border-[#222] hover:border-[#ff3300]/50 text-[#888] hover:text-[#ff3300] transition-colors"
                title="Reportar Problema"
            >
                <AlertTriangle size={20} className="mb-1" />
            </button>
        </div>
    )
}
