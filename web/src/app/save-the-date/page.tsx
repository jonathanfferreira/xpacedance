import Image from 'next/image';
import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { WordSearchGame } from '@/components/ui/word-search-game';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XPACE DANCE | DECIFRE AS PISTAS',
  description: 'Algo novo está chegando. Encontre as pistas escondidas.',
};

export default function SaveTheDatePage() {
  return (
    <div className="relative min-h-screen bg-[#020202] overflow-hidden select-none">

      {/* Jogo ocupa toda a tela */}
      <div className="absolute inset-0">
        <WordSearchGame />
      </div>

      {/* UI Overlay — Logo + badge */}
      <div className="relative z-10 flex flex-col items-center pt-10 px-4 pointer-events-none">
        <Image
          src="/images/xpace-logo-branca.png"
          alt="XPACE DANCE"
          width={160}
          height={40}
          className="object-contain mb-5"
          priority
        />
        <div className="inline-flex items-center gap-2 border border-white/10 rounded-full px-5 py-2 bg-black/70 backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-[#eb00bc] animate-pulse" />
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/50">
            Decifre as pistas
          </span>
        </div>
      </div>

      {/* CTA Instagram — fixo no rodapé */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20" style={{ bottom: '60px' }}>
        <a
          href="https://www.instagram.com/xpacedance"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white/5 text-white/50 border border-white/10 font-mono px-5 py-2.5 rounded-full uppercase tracking-widest hover:bg-white/10 hover:text-white/80 transition-all text-[9px]"
        >
          <Instagram size={12} />
          @xpacedance
        </a>
      </div>
    </div>
  );
}
