"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';

export default function SaveTheDatePage() {
  return (
    <div className="min-h-screen bg-[#020202] text-[#ededed] font-sans flex flex-col items-center justify-center relative overflow-hidden selection:bg-primary/30 selection:text-white">

      {/* Background Ambient Glows */}
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center items-center overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full mix-blend-screen" 
        />
        <div className="absolute w-[800px] h-[800px] bg-secondary/10 blur-[180px] rounded-full mix-blend-screen opacity-50" />
      </div>
      
      {/* Noise Texture Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      <main className="relative z-10 flex flex-col items-center justify-center p-6 text-center w-full max-w-2xl mx-auto">
        
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative w-48 h-12 mb-16"
        >
          <Image 
            src="/images/xpace-logo-branca.png" 
            alt="XPACE" 
            fill 
            className="object-contain" 
            priority 
          />
        </motion.div>

        {/* Tag */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-[#eb00bc] animate-pulse" />
          <span className="text-[10px] md:text-xs font-mono text-white/70 uppercase tracking-[0.2em]">Uma Nova Era se Aproxima</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight uppercase"
        >
          Save <br className="md:hidden" />The Date
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="text-white/50 text-sm md:text-base font-medium tracking-widest uppercase max-w-md mx-auto mb-16"
        >
          Um novo jeito de dançar. <br/>
          Fique atento às nossas redes oficiais.
        </motion.p>

        {/* CTA */}
        <motion.a
          href="https://instagram.com/xpacedance"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Instagram size={20} className="relative z-10" />
          <span className="relative z-10 font-bold uppercase tracking-wider text-sm">Acompanhar no Instagram</span>
        </motion.a>

      </main>

    </div>
  );
}
