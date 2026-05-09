"use client";

import { useEffect, useRef } from "react";

const WORDS = [
  "XPACE", "DANCE", "HIP HOP", "FREESTYLE", 
  "GAMIFICATION", "COREOGRAFIA", "OS", "E-LEARNING", "MATRIX",
  "CYBERPUNK", "BRUTALISM", "STREAMING"
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

    const fontSize = 16;
    let columns = Math.floor(width / fontSize);
    
    let drops: number[] = [];
    let wordDrops: { word: string; index: number; x: number }[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * -100; // Começa de alturas negativas aleatórias para não cair tudo igual
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < drops.length; i++) {
        let text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // White for normal rain

        const activeWordIndex = wordDrops.findIndex(w => w.x === i);
        if (activeWordIndex !== -1) {
          const activeWord = wordDrops[activeWordIndex];
          if (activeWord.index < activeWord.word.length) {
            text = activeWord.word[activeWord.index];
            activeWord.index++;
            ctx.fillStyle = "#eb00bc"; // Pink for words (dicas)
            
            // Glow effect
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#eb00bc";
          } else {
            wordDrops.splice(activeWordIndex, 1);
            ctx.shadowBlur = 0;
          }
        } else {
            ctx.shadowBlur = 0;
            // Efeito visual clássico: a cabeça da trilha
            if (Math.random() > 0.95) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            }
        }

        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drops
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
          
          // Chance de injetar uma palavra secreta ao invés de código aleatório
          if (Math.random() > 0.8) {
            const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
            // Adiciona apenas se não houver outra palavra já descendo nesta coluna
            if (!wordDrops.some(w => w.x === i)) {
                wordDrops.push({ word: randomWord, index: 0, x: i });
            }
          }
        }
        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 33); // ~30fps

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      const newColumns = Math.floor(width / fontSize);
      const newDrops = [];
      for (let x = 0; x < newColumns; x++) {
        newDrops[x] = drops[x] || Math.random() * -100;
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
        className="w-full h-full opacity-40"
        style={fade ? {
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 100%)",
        } : {}}
      />
    </div>
  );
}
