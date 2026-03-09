'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export function PowerOnPreloader({ children }: { children: React.ReactNode }) {
    const [hasStarted, setHasStarted] = useState(false);
    const [isPoweringUp, setIsPoweringUp] = useState(false);

    useEffect(() => {
        // Pula a animação se for a mesma sessão pra não irritar quem dá refresh
        if (sessionStorage.getItem('xtage-powered')) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setHasStarted(true);
        }
    }, []);

    const handlePowerOn = () => {
        setIsPoweringUp(true);
        sessionStorage.setItem('xtage-powered', 'true');
        // Simula a inicialização brutalista que escala e esvanece (1.2s)
        setTimeout(() => {
            setHasStarted(true);
        }, 1200);
    };

    if (hasStarted) return <>{children}</>;

    return (
        <>
            <div className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center overflow-hidden">
                {/* Glow/Luz atrás do sticker */}
                <div className={`absolute w-64 h-64 bg-primary/30 rounded-full blur-[80px] transition-all duration-1000 ${isPoweringUp ? 'opacity-0 scale-150' : 'opacity-100 animate-pulse-slow'}`}></div>

                {/* Sticker Button / Simbolo de ON */}
                <button
                    onClick={handlePowerOn}
                    className={`relative z-10 w-48 h-48 sm:w-64 sm:h-64 rounded-full flex items-center justify-center transition-all duration-[1200ms] outline-none ${isPoweringUp ? 'scale-[4] opacity-0 blur-xl' : 'scale-100 cursor-pointer hover:scale-105 active:scale-95'}`}
                >
                    <Image
                        src="/images/xpace-on-sticker.png"
                        alt="Power On XTAGE"
                        fill
                        className="object-contain"
                        priority
                    />
                </button>

                {/* Hint Fading */}
                <div className={`mt-16 text-center transition-opacity duration-300 ${isPoweringUp ? 'opacity-0' : 'opacity-100'}`}>
                    <p className="text-white font-bold tracking-[0.3em] uppercase text-xs opacity-60 animate-pulse">Tap to Power On</p>
                </div>
            </div>
            {/* Renderiza as children escondidas apenas por segurança do SEO e Hydration */}
            <div style={{ display: 'none' }}>{children}</div>
        </>
    );
}
