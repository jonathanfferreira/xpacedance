import { createClient } from '@supabase/supabase-js';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'revenue' | 'achievement';

export interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    linkUrl?: string;
}

/**
 * Cria uma notificação no banco de dados.
 * Pode ser usada tanto no Client quanto no Server (se as envs estiverem disponíveis).
 */
export async function createNotification({
    userId,
    title,
    message,
    type = 'info',
    linkUrl
}: CreateNotificationParams) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Usa service role para garantir a entrega
    );

    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            title,
            message,
            type,
            link_url: linkUrl,
            read: false
        })
        .select()
        .single();

    if (error) {
        console.error('[NOTIFICATIONS] Erro ao criar notificação:', error);
        return null;
    }

    return data;
}

/**
 * Gatilhos comuns de notificação para facilitar o uso no ecossistema
 */
export const NotificationTriggers = {
    welcome: (userId: string, name: string) => 
        createNotification({
            userId,
            title: `Bem-vindo à XPACE, ${name}! 🚀`,
            message: 'Estamos felizes em ter você aqui. Explore nossos cursos e comece sua jornada na dança agora mesmo.',
            type: 'info',
            linkUrl: '/dashboard/explore'
        }),
        
    achievementUnlocked: (userId: string, achievementName: string, xp: number) =>
        createNotification({
            userId,
            title: `Nova Conquista: ${achievementName}! 🏆`,
            message: `Você acabou de desbloquear uma nova medalha e ganhou ${xp} XP. Parabéns!`,
            type: 'achievement',
            linkUrl: '/dashboard/conquistas'
        }),
        
    courseCompleted: (userId: string, courseTitle: string) =>
        createNotification({
            userId,
            title: `Curso Concluído: ${courseTitle}! 🎓`,
            message: 'Parabéns pela dedicação! Seu certificado já está disponível para visualização.',
            type: 'success',
            linkUrl: '/dashboard/certificados'
        }),
        
    newSale: (userId: string, amount: number) =>
        createNotification({
            userId,
            title: 'Nova Venda Realizada! 💰',
            message: `Você recebeu uma comissão de R$ ${amount.toFixed(2)} através do seu link de parceiro.`,
            type: 'revenue',
            linkUrl: '/dashboard/afiliados'
        }),

    refundProcessed: (userId: string, courseId: string | null) =>
        createNotification({
            userId,
            title: 'Reembolso Processado',
            message: 'Seu reembolso foi processado com sucesso e o acesso ao curso foi encerrado. O valor retorna em até 10 dias úteis.',
            type: 'warning',
            linkUrl: courseId ? `/dashboard/cursos` : '/dashboard'
        }),
};
