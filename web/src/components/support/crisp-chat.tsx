'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        $crisp: any[];
        CRISP_WEBSITE_ID: string;
    }
}

interface CrispChatProps {
    user?: {
        id: string;
        email?: string;
        full_name?: string;
        role?: string;
        enrollmentsCount?: number;
        username?: string;
    };
}

/**
 * Carrega o widget do Crisp Chat e injeta dados contextuais do usuário.
 * Isso permite que o time de suporte veja o perfil do aluno/professor
 * sem precisar perguntar quem é a pessoa.
 */
export function CrispChat({ user }: CrispChatProps) {
    useEffect(() => {
        const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
        if (!websiteId) return; // Sem ID configurado, não carrega

        // Inicializa o array de comandos do Crisp
        window.$crisp = [];
        window.CRISP_WEBSITE_ID = websiteId;

        // Injeta dados do usuário para contexto do atendimento
        if (user) {
            if (user.email) window.$crisp.push(['set', 'user:email', [user.email]]);
            if (user.full_name) window.$crisp.push(['set', 'user:nickname', [user.full_name]]);
            
            // Dados de sessão para o atendente ver imediatamente
            window.$crisp.push(['set', 'session:data', [[
                ['id', user.id],
                ['username', user.username || 'não definido'],
                ['role', user.role || 'aluno'],
                ['cursos_matriculados', String(user.enrollmentsCount || 0)],
            ]]]);
        }

        // Carrega o SDK do Crisp de forma assíncrona
        const script = document.createElement('script');
        script.src = 'https://client.crisp.chat/l.js';
        script.async = true;
        document.head.appendChild(script);

        return () => {
            // Cleanup: remover script ao desmontar (ex: logout)
            document.head.removeChild(script);
        };
    }, [user?.id]); // Re-inicia apenas se o usuário mudar

    return null; // Componente invisível
}
