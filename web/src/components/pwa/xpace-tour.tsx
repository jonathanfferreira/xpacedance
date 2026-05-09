'use client';

import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

export function XpaceTour() {
    const [run, setRun] = useState(false);

    useEffect(() => {
        // Dispara o tour apenas na primeira vez do usuário, com um pequeno delay
        const tourCompleted = localStorage.getItem('xpace-tour-completed');
        if (!tourCompleted) {
            const timer = setTimeout(() => {
                setRun(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const steps: Step[] = [
        {
            target: 'body',
            placement: 'center',
            content: (
                <div className="text-left font-sans">
                    <h2 className="text-xl font-heading font-bold text-primary uppercase mb-2">Bem-vindo à XPACE DANCE</h2>
                    <p className="text-sm text-[#ddd]">Esta é a Central de Inteligência de Dança da XPACE DANCE. Vamos fazer um tour de 30 segundos pela sua nova nave para que você não perca tempo.</p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '.tour-step-1', // Header (XP e Nome)
            content: (
                <div className="text-left font-sans">
                    <h3 className="font-bold text-white mb-1">Acompanhe seu Progresso</h3>
                    <p className="text-xs text-[#aaa]">Esta é sua Barra de Status (HUD). Conclua aulas para ganhar <strong className="text-secondary">XP</strong> e subir de nível no ranking dos dançarinos.</p>
                </div>
            ),
        },
        {
            target: '.tour-step-2', // Continue Watching
            content: (
                <div className="text-left font-sans">
                    <h3 className="font-bold text-white mb-1">Cursos em Andamento</h3>
                    <p className="text-xs text-[#aaa]">Nós salvamos exatamente onde você parou de assistir da sua última sessão. Apenas dê play!</p>
                </div>
            ),
        },
        {
            target: '.tour-step-3', // Menu Lateral / Configs
            content: (
                <div className="text-left font-sans">
                    <h3 className="font-bold text-white mb-1">Cursos Globais e Top 10</h3>
                    <p className="text-xs text-[#aaa]">Explore o Leaderboard Global (The Board) com os cursos mais aclamados do momento da plataforma.</p>
                </div>
            ),
            placement: 'top'
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            // Marca o tour como concluído
            setRun(false);
            localStorage.setItem('xpace-tour-completed', 'true');
        }
    };

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous
            hideCloseButton
            run={run}
            scrollToFirstStep
            showProgress
            showSkipButton
            steps={steps}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: '#6324b2', // Brand Primary
                    backgroundColor: '#0a0a0a',
                    textColor: '#fff',
                    arrowColor: '#0a0a0a',
                    overlayColor: 'rgba(0, 0, 0, 0.85)',
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                buttonNext: {
                    backgroundColor: '#6324b2',
                    borderRadius: 2,
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    fontSize: 12,
                    padding: '8px 16px'
                },
                buttonBack: {
                    color: '#888',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    fontSize: 12,
                },
                buttonSkip: {
                    color: '#ff5200',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    fontSize: 12,
                }
            }}
            locale={{
                back: 'Voltar',
                close: 'Fechar',
                last: 'Começar',
                next: 'Avançar',
                skip: 'Pular Tour'
            }}
        />
    );
}
