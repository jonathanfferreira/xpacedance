"use client";

import { useEffect, useRef } from "react";

const WORDS = [
  "XPACE",
  "DANCE",
  "HIP HOP",
  "FREESTYLE",
  "BREAKING",
  "POPPING",
  "LOCKING",
  "WAACKING",
  "URBAN",
  "EVOLUÇÃO",
  "DESAFIO",
  "CONQUISTAS",
  "RANKING",
  "XP",
  "BATALHA",
  "STREAMING",
  "AULAS",
  "TREINO",
  "PROFESSOR",
  "STUDIO",
  "CYPHER",
  "COMUNIDADE",
  "RITMO",
  "CULTURA",
  "PASSOS",
];

interface MatrixRainProps {
  fade?: boolean;
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
    const isMobile = window.innerWidth < 768;

    let cssWidth = window.innerWidth;
    let cssHeight = window.innerHeight;

    // Define o tamanho real do canvas em pixels físicos
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;

    // Escala o contexto para que 1 unidade = 1 CSS pixel
    ctx.scale(dpr, dpr);

    const katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
    const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const alphabet = katakana + latin + nums;

    // Fonte maior no mobile para facilitar leitura
    const fontSize = isMobile ? 22 : 18;
    let columns = Math.floor(cssWidth / fontSize);

    let drops: number[] = [];
    let wordDrops: { word: string; index: number; x: number }[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * -120;
    }

    let tick = 0;

    const draw = () => {
      tick++;

      // Rastro mais lento e persistente
      ctx.fillStyle = "rgba(0, 0, 0, 0.045)";
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Velocidade reduzida: avança apenas a cada 2 ticks
        if (tick % 2 !== 0) continue;

        let text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        ctx.shadowBlur = 0;

        // No mobile, branco mais opaco para garantir contraste
        ctx.fillStyle = isMobile
          ? "rgba(255, 255, 255, 0.85)"
          : "rgba(255, 255, 255, 0.65)";

        const activeWordIndex = wordDrops.findIndex(w => w.x === i);
        if (activeWordIndex !== -1) {
          const activeWord = wordDrops[activeWordIndex];
          if (activeWord.index < activeWord.word.length) {
            text = activeWord.word[activeWord.index];
            activeWord.index++;
            ctx.fillStyle = "#eb00bc";
            // Glow mais forte no mobile
            ctx.shadowBlur = isMobile ? 20 : 14;
            ctx.shadowColor = "#eb00bc";
          } else {
            wordDrops.splice(activeWordIndex, 1);
            ctx.shadowBlur = 0;
          }
        } else {
          ctx.shadowBlur = 0;
          // Cabeça da trilha: brilhante
          if (Math.random() > 0.92) {
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
            ctx.shadowBlur = isMobile ? 6 : 4;
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
          }
        }

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset da coluna
        if (drops[i] * fontSize > cssHeight && Math.random() > 0.97) {
          drops[i] = 0;

          // Injetar palavra secreta com boa probabilidade
          if (Math.random() > 0.65) {
            const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
            if (!wordDrops.some(w => w.x === i)) {
              wordDrops.push({ word: randomWord, index: 0, x: i });
            }
          }
        }
        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 50);

    const handleResize = () => {
      const newDpr = window.devicePixelRatio || 1;
      const newIsMobile = window.innerWidth < 768;
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;

      canvas.width = cssWidth * newDpr;
      canvas.height = cssHeight * newDpr;
      ctx.scale(newDpr, newDpr);

      const newFontSize = newIsMobile ? 22 : 18;
      const newColumns = Math.floor(cssWidth / newFontSize);
      const newDrops: number[] = [];
      for (let x = 0; x < newColumns; x++) {
        newDrops[x] = drops[x] ?? Math.random() * -120;
      }
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
        className="w-full h-full opacity-80"
        style={fade ? {
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)",
        } : {}}
      />
    </div>
  );
}
