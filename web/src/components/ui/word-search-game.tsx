"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const HIDDEN_WORDS = [
  "XPACE", "DANCE", "FREESTYLE", "BREAKING", "POPPING",
  "LOCKING", "WAACKING", "RANKING", "BATALHA", "STUDIO",
  "CYPHER", "RITMO", "CULTURA", "CONQUISTAS", "URBAN",
  "TREINO", "HIPHOP", "PASSOS", "AULAS",
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIRS: [number, number][] = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
  [0, -1], [-1, 0], [-1, -1], [1, -1],
];

interface PlacedWord {
  word: string;
  cells: [number, number][];
}

function buildWordSearch(cols: number, rows: number): { grid: string[][], placed: PlacedWord[] } {
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => CHARS[Math.floor(Math.random() * CHARS.length)])
  );
  const placed: PlacedWord[] = [];
  const occupied = new Set<string>();

  for (const word of HIDDEN_WORDS) {
    let ok = false;
    for (let attempt = 0; attempt < 400 && !ok; attempt++) {
      const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
      const r0 = Math.floor(Math.random() * rows);
      const c0 = Math.floor(Math.random() * cols);
      const cells: [number, number][] = [];
      let fits = true;

      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i;
        const c = c0 + dc * i;
        if (r < 0 || r >= rows || c < 0 || c >= cols) { fits = false; break; }
        const key = `${r},${c}`;
        if (occupied.has(key) && grid[r][c] !== word[i]) { fits = false; break; }
        cells.push([r, c]);
      }

      if (fits) {
        cells.forEach(([r, c], i) => {
          grid[r][c] = word[i];
          occupied.add(`${r},${c}`);
        });
        placed.push({ word, cells });
        ok = true;
      }
    }
  }

  return { grid, placed };
}

interface GameState {
  grid: string[][];
  placed: PlacedWord[];
  foundCells: Set<string>;
  hintCells: Set<string>;
  cellSize: number;
  cols: number;
  rows: number;
  selecting: boolean;
  selStart: [number, number] | null;
  selCells: [number, number][];
  foundWords: string[];
}

export function WordSearchGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const [displayFound, setDisplayFound] = useState<string[]>([]);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [hintActive, setHintActive] = useState(false);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas || !s) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { cellSize, cols, rows, grid, foundCells, hintCells, selCells } = s;
    const selSet = new Set(selCells.map(([r, c]) => `${r},${c}`));
    const fontSize = Math.round(cellSize * 0.48);
    const fontsReady = document.fonts.check(`${fontSize}px Steelfish`);
    const font = fontsReady ? `bold ${fontSize}px Steelfish, monospace` : `bold ${fontSize}px monospace`;

    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellSize + cellSize / 2;
        const y = r * cellSize + cellSize / 2;
        const key = `${r},${c}`;
        const char = grid[r][c];

        const isFound = foundCells.has(key);
        const isHint = hintCells.has(key);
        const isSel = selSet.has(key);

        if (isFound) {
          ctx.fillStyle = "rgba(235,0,188,0.18)";
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#eb00bc";
          ctx.fillStyle = "#eb00bc";
        } else if (isHint) {
          ctx.fillStyle = "rgba(235,0,188,0.1)";
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.shadowBlur = 6;
          ctx.shadowColor = "#eb00bc";
          ctx.fillStyle = "rgba(235,0,188,0.8)";
        } else if (isSel) {
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.shadowBlur = 0;
          ctx.fillStyle = "rgba(255,255,255,0.95)";
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = "rgba(255,255,255,0.09)";
        }

        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;
      }
    }
  }, []);

  // Start animation loop
  useEffect(() => {
    const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const getCellFromPoint = useCallback((clientX: number, clientY: number): [number, number] => {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas || !s) return [-1, -1];
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((clientX - rect.left) / s.cellSize);
    const row = Math.floor((clientY - rect.top) / s.cellSize);
    if (row < 0 || row >= s.rows || col < 0 || col >= s.cols) return [-1, -1];
    return [row, col];
  }, []);

  const getCellLine = useCallback((start: [number, number], end: [number, number]): [number, number][] => {
    const [r0, c0] = start;
    const [r1, c1] = end;
    const dr = Math.sign(r1 - r0);
    const dc = Math.sign(c1 - c0);
    const rowDiff = Math.abs(r1 - r0);
    const colDiff = Math.abs(c1 - c0);
    if (dr !== 0 && dc !== 0 && rowDiff !== colDiff) return [start];
    const len = Math.max(rowDiff, colDiff);
    return Array.from({ length: len + 1 }, (_, i) => [r0 + dr * i, c0 + dc * i]);
  }, []);

  const tryMatch = useCallback((cells: [number, number][]) => {
    const s = stateRef.current;
    if (!s || cells.length < 2) return;
    const word = cells.map(([r, c]) => s.grid[r][c]).join("");
    const wordRev = [...word].reverse().join("");
    for (const p of s.placed) {
      if ((word === p.word || wordRev === p.word) && !s.foundWords.includes(p.word)) {
        p.cells.forEach(([r, c]) => s.foundCells.add(`${r},${c}`));
        s.foundWords = [...s.foundWords, p.word];
        setDisplayFound([...s.foundWords]);
        setLastFound(p.word);
        setTimeout(() => setLastFound(null), 2500);
        break;
      }
    }
    s.selCells = [];
    s.selStart = null;
    s.selecting = false;
  }, []);

  // Setup canvas + events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const isMobile = window.innerWidth < 768;
    const cellSize = isMobile ? 30 : 26;

    const setup = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
      const cols = Math.floor(w / cellSize);
      const rows = Math.floor(h / cellSize);
      const { grid, placed } = buildWordSearch(cols, rows);
      stateRef.current = {
        grid, placed, foundCells: new Set(), hintCells: new Set(),
        cellSize, cols, rows,
        selecting: false, selStart: null, selCells: [], foundWords: [],
      };
    };

    setup();

    const onDown = (e: PointerEvent) => {
      const s = stateRef.current; if (!s) return;
      e.preventDefault();
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (cell[0] === -1) return;
      s.selecting = true; s.selStart = cell; s.selCells = [cell];
    };
    const onMove = (e: PointerEvent) => {
      const s = stateRef.current; if (!s || !s.selecting || !s.selStart) return;
      e.preventDefault();
      const cell = getCellFromPoint(e.clientX, e.clientY);
      if (cell[0] === -1) return;
      s.selCells = getCellLine(s.selStart, cell);
    };
    const onUp = (e: PointerEvent) => {
      const s = stateRef.current; if (!s || !s.selecting) return;
      e.preventDefault();
      tryMatch(s.selCells);
    };

    canvas.addEventListener("pointerdown", onDown, { passive: false });
    canvas.addEventListener("pointermove", onMove, { passive: false });
    canvas.addEventListener("pointerup", onUp, { passive: false });
    canvas.addEventListener("pointerleave", onUp, { passive: false });
    window.addEventListener("resize", setup);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onUp);
      window.removeEventListener("resize", setup);
    };
  }, [getCellFromPoint, getCellLine, tryMatch]);

  const handleHint = useCallback(() => {
    const s = stateRef.current;
    if (!s || hintActive) return;
    const unfound = s.placed.filter(p => !s.foundWords.includes(p.word));
    if (!unfound.length) return;
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    setHintActive(true);
    target.cells.forEach(([r, c]) => s.hintCells.add(`${r},${c}`));
    setTimeout(() => {
      target.cells.forEach(([r, c]) => stateRef.current?.hintCells.delete(`${r},${c}`));
      setHintActive(false);
    }, 3000);
  }, [hintActive]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair touch-none select-none"
      />

      {/* Feedback ao encontrar palavra */}
      {lastFound && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-black/90 border border-[#eb00bc] px-10 py-5 text-center shadow-[0_0_40px_rgba(235,0,188,0.4)]">
            <p className="text-[9px] font-mono text-[#eb00bc] uppercase tracking-[0.3em] mb-2">Pista decifrada</p>
            <p className="text-4xl font-heading text-white uppercase">{lastFound}</p>
          </div>
        </div>
      )}

      {/* Palavras encontradas + contador */}
      <div className="absolute bottom-20 left-0 right-0 z-20 flex flex-col items-center gap-3 px-4">
        <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.25em]">
          {displayFound.length} / {HIDDEN_WORDS.length} pistas decifradas
        </p>
        {displayFound.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center max-w-md">
            {displayFound.map(w => (
              <span key={w} className="text-[9px] font-mono text-[#eb00bc] border border-[#eb00bc]/40 px-2 py-0.5 uppercase tracking-widest bg-black/60">
                {w}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Botão de dica */}
      <div className="absolute bottom-6 right-6 z-20">
        <button
          onClick={handleHint}
          disabled={hintActive}
          className="text-[9px] font-mono text-white/25 hover:text-white/50 uppercase tracking-widest border border-white/10 hover:border-white/20 px-4 py-2 transition-all disabled:opacity-20"
        >
          {hintActive ? "revelando..." : "pedir dica"}
        </button>
      </div>
    </div>
  );
}
