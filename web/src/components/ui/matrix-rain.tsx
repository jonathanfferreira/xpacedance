"use client";

import { useEffect, useRef } from "react";

// Dicas do app — aparecem em destaque rosa
const WORDS = [
  "XPACE", "DANCE", "HIP HOP", "FREESTYLE", "BREAKING",
  "POPPING", "LOCKING", "WAACKING", "URBAN", "EVOLUÇÃO",
  "DESAFIO", "CONQUISTAS", "RANKING", "XP", "BATALHA",
  "STREAMING", "AULAS", "TREINO", "STUDIO", "CYPHER",
  "COMUNIDADE", "RITMO", "CULTURA", "PASSOS",
];

// Sem katakana — caracteres originais com feel de "dados urbanos"
const SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789↑↓→←×+/|\\-_><≠∞◆◇●○";

interface MatrixRainProps {
  fade?: boolean;
}

interface Drop {
  y: number;           // posição y atual (em unidades de fontSize)
  speed: number;       // velocidade base da coluna
  pauseFor: number;    // frames que ainda ficará pausada (para exibir a palavra)
}

interface WordDrop {
  word: string;
  charIndex: number;   // próximo char da palavra a revelar
  x: number;           // coluna
  displayFor: number;  // frames restantes para palavra ficar na tela após completa
  done: boolean;       // palavra já foi totalmente revelada
}

export function MatrixRain({ fade = true }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Suporte a telas de alta densidade (Retina, mobile)
    const dpr = window.devicePixelRatio || 1;
    let cssWidth = window.innerWidth;
    let cssHeight = window.innerHeight;
    const isMobile = cssWidth < 768;

    const resize = () => {
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    // Fonte maior no mobile
    const fontSize = isMobile ? 20 : 16;
    const wordFontSize = isMobile ? 24 : 20; // palavras ligeiramente maiores

    let columns = Math.floor(cssWidth / fontSize);
    let drops: Drop[] = Array.from({ length: columns }, () => ({
      y: Math.random() * -150,
      speed: 0.5 + Math.random() * 0.5, // velocidade suave e variada entre colunas
      pauseFor: 0,
    }));

    let wordDrops: WordDrop[] = [];
    let tick = 0;

    const draw = () => {
      tick++;

      // Rastro lento — aumentar este valor torna o rastro mais curto
      ctx.fillStyle = "rgba(0, 0, 0, 0.055)";
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];

        // Se a coluna está pausada, aguardar antes de continuar
        if (drop.pauseFor > 0) {
          drop.pauseFor--;
          continue;
        }

        // Avança apenas a cada 2 ticks para velocidade cadenciada
        if (tick % 2 !== 0) continue;

        const wordDropIndex = wordDrops.findIndex(w => w.x === i);

        if (wordDropIndex !== -1) {
          const wd = wordDrops[wordDropIndex];

          if (!wd.done && wd.charIndex < wd.word.length) {
            // Revela próxima letra da palavra
            const char = wd.word[wd.charIndex];
            wd.charIndex++;

            ctx.font = `bold ${wordFontSize}px monospace`;
            ctx.fillStyle = "#eb00bc";
            ctx.shadowBlur = 18;
            ctx.shadowColor = "#eb00bc";
            ctx.fillText(char, i * fontSize, drop.y * fontSize);
            ctx.shadowBlur = 0;

            // Pausa a coluna por alguns frames para dar tempo de ler
            drop.pauseFor = isMobile ? 8 : 6;
          } else if (!wd.done) {
            // Palavra completa — congela por um tempo
            wd.done = true;
            wd.displayFor = isMobile ? 60 : 45;
          } else {
            wd.displayFor--;
            if (wd.displayFor <= 0) {
              wordDrops.splice(wordDropIndex, 1);
            }
            // Não avança a coluna enquanto a palavra está parada
            continue;
          }
        } else {
          // Chuva normal: caracteres sutis brancos
          const char = SYMBOLS.charAt(Math.floor(Math.random() * SYMBOLS.length));
          const opacity = 0.2 + Math.random() * 0.35;
          ctx.font = `${fontSize}px monospace`;
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.shadowBlur = 0;
          ctx.fillText(char, i * fontSize, drop.y * fontSize);
        }

        // Avança a gota
        drop.y += drop.speed;

        // Reset ao sair da tela
        if (drop.y * fontSize > cssHeight + fontSize) {
          drop.y = Math.random() * -50;

          // Injeta palavra secreta com boa probabilidade
          if (Math.random() > 0.6 && !wordDrops.some(w => w.x === i)) {
            const word = WORDS[Math.floor(Math.random() * WORDS.length)];
            wordDrops.push({ word, charIndex: 0, x: i, displayFor: 0, done: false });
          }
        }
      }
    };

    const intervalId = setInterval(draw, 50);

    const handleResize = () => {
      resize();
      const newColumns = Math.floor(cssWidth / fontSize);
      const newDrops: Drop[] = Array.from({ length: newColumns }, (_, x) => (
        drops[x] ?? {
          y: Math.random() * -150,
          speed: 0.5 + Math.random() * 0.5,
          pauseFor: 0,
        }
      ));
      drops = newDrops;
      columns = newColumns;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={fade ? {
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)",
        } : {}}
      />
    </div>
  );
}
