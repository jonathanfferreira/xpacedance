"use client";

import { useEffect, useRef } from "react";

// Palavras escondidas na grade (sem espaços para o caça-palavras)
const WORDS = [
  "XPACE", "DANCE", "FREESTYLE", "BREAKING", "POPPING",
  "LOCKING", "WAACKING", "RANKING", "BATALHA", "STUDIO",
  "CYPHER", "RITMO", "CULTURA", "CONQUISTAS", "URBAN",
  "TREINO", "HIPHOP", "PASSOS", "AULAS", "EVOLUCAO",
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Direções possíveis: →, ↓, ↘, ↗
const DIRS: [number, number][] = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
];

interface PlacedWord {
  word: string;
  cells: [number, number][];
}

interface MatrixRainProps {
  fade?: boolean;
}

function buildGrid(cols: number, rows: number): { grid: string[][], placed: PlacedWord[] } {
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => CHARS[Math.floor(Math.random() * CHARS.length)])
  );

  const placed: PlacedWord[] = [];

  for (const word of WORDS) {
    let attempts = 0;
    let success = false;

    while (attempts < 200 && !success) {
      attempts++;
      const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);

      // Verifica se a palavra cabe sem conflito
      const cells: [number, number][] = [];
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r < 0 || r >= rows || c < 0 || c >= cols) { fits = false; break; }
        if (grid[r][c] !== word[i] && grid[r][c] !== CHARS[Math.floor(Math.random() * CHARS.length)]) {
          // Permite sobrescrever letras aleatórias, conflita só se já é parte de outra palavra
        }
        cells.push([r, c]);
      }
      if (!fits) continue;

      // Coloca a palavra na grade
      for (let i = 0; i < word.length; i++) {
        const [r, c] = cells[i];
        grid[r][c] = word[i];
      }
      placed.push({ word, cells });
      success = true;
    }
  }

  return { grid, placed };
}

export function MatrixRain({ fade = true }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const isMobile = window.innerWidth < 768;
    const fontSize = isMobile ? 16 : 14;
    const cellW = isMobile ? 20 : 18;
    const cellH = isMobile ? 24 : 20;

    let cssWidth = window.innerWidth;
    let cssHeight = window.innerHeight;

    const setupCanvas = () => {
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    setupCanvas();

    let cols = Math.floor(cssWidth / cellW);
    let rows = Math.floor(cssHeight / cellH);
    let { grid, placed } = buildGrid(cols, rows);

    // Estado da animação
    let highlightedWordIndex = -1;
    let highlightTimer = 0;
    const HIGHLIGHT_DURATION = 120; // frames (~3s a 40ms)
    const PAUSE_DURATION = 180;     // frames entre highlights (~4.5s)
    let pauseTimer = 60;            // começa com um delay inicial

    // Células que piscam aleatoriamente (renovação de letras)
    const refreshCell = () => {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      // Não renova se a célula pertence a uma palavra colocada
      const isWordCell = placed.some(p => p.cells.some(([pr, pc]) => pr === r && pc === c));
      if (!isWordCell) {
        grid[r][c] = CHARS[Math.floor(Math.random() * CHARS.length)];
      }
    };

    let tick = 0;

    const draw = () => {
      tick++;
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      // Atualiza 3 células aleatórias por frame para efeito vivo
      if (tick % 3 === 0) {
        refreshCell();
        refreshCell();
        refreshCell();
      }

      // Lógica de highlight: alterna entre pausar e iluminar
      if (highlightedWordIndex === -1) {
        if (pauseTimer > 0) {
          pauseTimer--;
        } else {
          // Escolhe uma nova palavra aleatória para iluminar
          highlightedWordIndex = Math.floor(Math.random() * placed.length);
          highlightTimer = HIGHLIGHT_DURATION;
        }
      } else {
        highlightTimer--;
        if (highlightTimer <= 0) {
          highlightedWordIndex = -1;
          pauseTimer = PAUSE_DURATION;
        }
      }

      // Desenha a grade
      // Fontes carregadas via document
      const fontsReady = document.fonts.check(`${fontSize}px Steelfish`);
      const baseFont = fontsReady ? `${fontSize}px Steelfish, monospace` : `${fontSize}px monospace`;
      const wordFont = fontsReady ? `bold ${fontSize + 2}px Steelfish, monospace` : `bold ${fontSize + 2}px monospace`;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW + cellW / 2;
          const y = r * cellH + cellH / 2 + fontSize / 2;

          const char = grid[r][c];

          // Verifica se esta célula pertence à palavra iluminada
          let isHighlighted = false;
          if (highlightedWordIndex !== -1) {
            const hw = placed[highlightedWordIndex];
            isHighlighted = hw.cells.some(([pr, pc]) => pr === r && pc === c);
          }

          // Verifica se é qualquer palavra (para dar leve destaque fixo)
          const isAnyWord = placed.some(p => p.cells.some(([pr, pc]) => pr === r && pc === c));

          if (isHighlighted) {
            // Fade in/out suave baseado no timer
            const progress = highlightTimer / HIGHLIGHT_DURATION;
            const alpha = progress < 0.15
              ? progress / 0.15
              : progress > 0.85
              ? (1 - progress) / 0.15
              : 1;

            ctx.font = wordFont;
            ctx.fillStyle = `rgba(235, 0, 188, ${alpha * 0.95})`;
            ctx.shadowBlur = 12 * alpha;
            ctx.shadowColor = "#eb00bc";
          } else if (isAnyWord) {
            // Palavras não iluminadas: levemente mais brilhantes que o fundo
            ctx.font = baseFont;
            ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
            ctx.shadowBlur = 0;
          } else {
            // Letras de fundo: muito sutis
            ctx.font = baseFont;
            ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
            ctx.shadowBlur = 0;
          }

          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(char, x, y);
          ctx.shadowBlur = 0;
        }
      }
    };

    const intervalId = setInterval(draw, 40); // ~25fps — suficiente para este efeito

    const handleResize = () => {
      setupCanvas();
      cols = Math.floor(cssWidth / cellW);
      rows = Math.floor(cssHeight / cellH);
      const rebuilt = buildGrid(cols, rows);
      grid = rebuilt.grid;
      placed = rebuilt.placed;
      highlightedWordIndex = -1;
      pauseTimer = 30;
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
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0) 100%)",
        } : {}}
      />
    </div>
  );
}
