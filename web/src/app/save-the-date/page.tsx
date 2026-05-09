import Image from 'next/image';
import { WordSearchGame } from '@/components/ui/word-search-game';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XPACE DANCE | DECIFRE AS PISTAS',
  description: 'Algo novo está chegando. Encontre as pistas escondidas.',
};

export default function SaveTheDatePage() {
  return (
    <div className="fixed inset-0 bg-[#020202] overflow-hidden" style={{ userSelect: 'none' }}>

      {/* Scanlines — estética terminal/dev */}
      <div
        className="pointer-events-none fixed inset-0 z-30 opacity-[0.025]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
          backgroundSize: '100% 3px',
        }}
      />

      {/* Jogo ocupa toda a tela */}
      <div className="absolute inset-0">
        <WordSearchGame />
      </div>

      {/* Header: Logo + status terminal */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4 pb-2 pointer-events-none">
        <div className="flex flex-col gap-1">
          <Image
            src="/images/xpace-logo-branca.png"
            alt="XPACE DANCE"
            width={100}
            height={26}
            className="object-contain opacity-80"
            priority
          />
          <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest hidden sm:block">
            ENCRYPTED_HUNT v1.0
          </p>
        </div>
        {/* O botão do Instagram fica no componente (canto sup. direito) */}
      </div>

    </div>
  );
}
