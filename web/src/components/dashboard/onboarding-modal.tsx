'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { ArrowRight, Flame, Sparkles, AudioWaveform, Crown, Music } from 'lucide-react';
import Image from 'next/image';

const INTERESTS = [
    { id: 'hiphop', label: 'Hip Hop', icon: <Flame size={20} /> },
    { id: 'jazz', label: 'Jazz Funk', icon: <Sparkles size={20} /> },
    { id: 'dancehall', label: 'Dancehall', icon: <AudioWaveform size={20} /> },
    { id: 'heels', label: 'Heels', icon: <Crown size={20} /> },
    { id: 'locking', label: 'Locking/Popping', icon: <Music size={20} /> },
];

export function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkOnboarding = async () => {
            const hasDoneLocal = localStorage.getItem('xpace_onboarding_done');
            if (hasDoneLocal) return;

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const isComplete = user.user_metadata?.onboarding_completed;
                if (!isComplete) {
                    setIsOpen(true);
                } else {
                    localStorage.setItem('xpace_onboarding_done', 'true');
                }
            }
        };
        checkOnboarding();
    }, []);

    const toggleInterest = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSave = async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.updateUser({
            data: {
                onboarding_completed: true,
                interests: selected
            }
        });
        localStorage.setItem('xpace_onboarding_done', 'true');
        setIsOpen(false);
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(99,36,178,0.15)]"
                    >
                        {/* Header Image */}
                        <div className="h-32 bg-primary/20 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-[url('/images/bg-degrade.png')] bg-cover opacity-50 mix-blend-screen"></div>
                            <Image src="/images/xpace-logo-branca.png" alt="XPACE DANCE" width={140} height={40} className="relative z-10" />
                        </div>

                        <div className="p-8">
                            <h2 className="text-2xl font-bold font-heading text-white uppercase tracking-wider mb-2 text-center">
                                Personalize seu <span className="text-transparent bg-clip-text text-gradient-neon">Catálogo</span>
                            </h2>
                            <p className="text-[#888] text-center mb-8 text-sm">
                                Quais estilos de dança mais conectam com o seu movimento? Selecione os seus favoritos.
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-8">
                                {INTERESTS.map((item) => {
                                    const isSelected = selected.includes(item.id);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleInterest(item.id)}
                                            className={`
                                                flex items-center gap-3 p-3 text-left rounded-xl transition-all duration-300 border
                                                ${isSelected
                                                    ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(99,36,178,0.3)]'
                                                    : 'bg-[#111] border-[#222] text-[#888] hover:bg-[#1a1a1a] hover:border-[#333] hover:text-white'}
                                            `}
                                        >
                                            <span className={`${isSelected ? 'text-primary' : 'text-[#555]'}`}>
                                                {item.icon}
                                            </span>
                                            <span className="font-bold text-sm uppercase tracking-wide">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/80 transition-colors text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-50"
                            >
                                {loading ? 'Carregando...' : (
                                    <>Acessar Plataforma <ArrowRight size={18} /></>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
