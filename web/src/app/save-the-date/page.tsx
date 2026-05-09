import Image from 'next/image';
import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { MatrixRain } from '@/components/ui/matrix-rain';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XPACE DANCE | UMA NOVA ERA SE APROXIMA',
  description: 'O sistema está despertando. Fique atento às nossas redes oficiais.',
};

export default function SaveTheDatePage() {
  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center font-sans overflow-hidden text-white selection:bg-primary/30">
      {/* Background Matrix Rain */}
      <MatrixRain fade={false} />

      {/* Radial Gradient to ensure text is readable over the matrix code */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.9)_100%)] pointer-events-none z-0" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl w-full">
        {/* Logo */}
        <div className="mb-16 md:mb-24">
          <Image 
            src="/images/xpace-logo-branca.png" 
            alt="XPACE DANCE" 
            width={200} 
            height={50} 
            className="object-contain"
            priority
          />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 border border-[#333] rounded-full px-5 py-2 mb-8 bg-black/50 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-[#bbb]">
            O sistema está despertando
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold uppercase tracking-tight text-white mb-6">
          UM NOVO JEITO DE DANÇAR<span className="text-primary animate-pulse">_</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-[#888] font-mono max-w-xl mx-auto mb-16 leading-relaxed">
          FIQUE ATENTO ÀS NOSSAS REDES OFICIAIS.
        </p>

        {/* CTA Button */}
        <a
          href="https://www.instagram.com/xpacedance" 
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center gap-3 bg-white text-black font-bold px-8 py-4 rounded-full uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300"
        >
          <Instagram size={20} />
          <span>Acompanhar no Instagram</span>
        </a>
      </div>
    </div>
  );
}
