"use client";

import { useEffect, useRef } from "react";

// Dicas que revelam o propósito do app sem entregar tudo
const WORDS = [
  // Identidade
  "XPACE",
  "DANCE",
  // Estilos de dança
  "HIP HOP",
  "FREESTYLE",
  "BREAKING",
  "POPPING",
  "LOCKING",
  "WAACKING",
  "URBAN",
  // Objetivo do app
  "EVOLUÇÃO",
  "DESAFIO",
  "CONQUISTAS",
  "RANKING",
  "XP",
  "BATALHA",
  // Plataforma
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

    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
    const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const alphabet = katakana + latin + nums;

    const fontSize = 18; // Um pouco maior para mais legibilidade
    let columns = Math.floor(width / fontSize);

    let drops: number[] = [];
    let wordDrops: { word: string; index: number; x: number; tick: number }[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * -120;
    }

    let tick = 0;

    const draw = () => {
      tick++;

      // Rastro mais lento: aumentamos o alpha do fade para o rastro durar mais tempo
      ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Velocidade reduzida: só avança a chuva a cada 2 ticks
        if (tick % 2 !== 0) {
          // Mesmo sem avançar, redesenhamos para manter o glow visível
          const activeWordIndex = wordDrops.findIndex(w => w.x === i);
          if (activeWordIndex !== -1) {
            const aw = wordDrops[activeWordIndex];
            // Pulsa o glow sem mover
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#eb00bc";
          }
          continue;
        }

        let text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)"; // Branco com boa visibilidade

        const activeWordIndex = wordDrops.findIndex(w => w.x === i);
        if (activeWordIndex !== -1) {
          const activeWord = wordDrops[activeWordIndex];
          if (activeWord.index < activeWord.word.length) {
            text = activeWord.word[activeWord.index];
            activeWord.index++;
            ctx.fillStyle = "#eb00bc"; // Rosa vivo para as dicas
            ctx.shadowBlur = 14;
            ctx.shadowColor = "#eb00bc";
          } else {
            wordDrops.splice(activeWordIndex, 1);
            ctx.shadowBlur = 0;
          }
        } else {
          ctx.shadowBlur = 0;
          // Cabeça da trilha: mais brilhante
          if (Math.random() > 0.92) {
            ctx.fillStyle = "rgba(255, 255, 255, 1)";
          }
        }

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset da coluna
        if (drops[i] * fontSize > height && Math.random() > 0.97) {
          drops[i] = 0;

          // Injetar palavra secreta com boa probabilidade
          if (Math.random() > 0.65) {
            const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
            if (!wordDrops.some(w => w.x === i)) {
              wordDrops.push({ word: randomWord, index: 0, x: i, tick: 0 });
            }
          }
        }
        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 50); // ~20fps — velocidade bem mais cadenciada

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const newColumns = Math.floor(width / fontSize);
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
        className="w-full h-full opacity-70"
        style={fade ? {
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)",
        } : {}}
      />
    </div>
  );
}
