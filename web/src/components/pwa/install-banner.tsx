'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, Download } from 'lucide-react';

export function PwaInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Verifica se o usuário já dispensou permanentemente
        if (localStorage.getItem('xpace-pwa-dismissed') === 'true') return;

        // Verifica se já está instalado (Standalone)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        if (isStandalone) return;

        // Detecta iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsIOS(isIOSDevice);

        if (isIOSDevice) {
            // No iOS Safari não há evento prompt nativo, exibimos manual após uns segundos
            setTimeout(() => setShowBanner(true), 3000);
        } else {
            // Android / Chrome emite o beforeinstallprompt
            const handleBeforeInstallPrompt = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setShowBanner(true);
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        }
    }, []);

    const handleInstallClick = async () => {
        if (!isIOS && deferredPrompt) {
            // Android Install Flow
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('xpace-pwa-dismissed', 'true');
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-[#0a0a0a] border border-[#222] shadow-[0_0_40px_rgba(99,36,178,0.2)] rounded-sm z-[100] p-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-[#666] hover:text-white transition-colors p-1"
                title="Fechar e não perguntar mais"
            >
                <X size={16} />
            </button>

            <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/20 border border-primary/50 rounded flex items-center justify-center shrink-0">
                    <Smartphone size={24} className="text-primary" />
                </div>

                <div className="flex-1 pr-4">
                    <h4 className="font-heading font-bold text-white uppercase text-sm mb-1 leading-tight">
                        Instale o App
                    </h4>

                    {isIOS ? (
                        <p className="text-xs text-[#888] mb-3 leading-relaxed">
                            Toque no botão <strong className="text-[#aaa]">Compartilhar</strong> do Safari e depois em <strong className="text-white">&quot;Adicionar à Tela de Início&quot;</strong> para plugar no App da XPACE DANCE.
                        </p>
                    ) : (
                        <div className="mb-3">
                            <p className="text-xs text-[#888] leading-relaxed">
                                Instale o aplicativo XPACE DANCE no seu celular para acesso rápido e suporte offline básico.
                            </p>
                            <button
                                onClick={handleInstallClick}
                                className="mt-3 flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold uppercase tracking-widest py-2 px-4 transition-colors rounded-sm"
                            >
                                <Download size={14} />
                                Instalar Agora
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
