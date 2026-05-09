"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Instagram } from "lucide-react";

// 8 palavras cuidadosamente escolhidas para contar a história do app
const HIDDEN_WORDS = ["STREAMING", "HOME", "VIDEO", "PLATAFORMA", "CONFORTO", "TELA", "RANKING", "ESTUDIO"];
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const DIRS: [number, number][] = [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
const MAX_HINTS = 5;

// Mensagens estilo terminal que rotacionam
const STATUS_MSGS = [
  "SCANNING FOR PATTERNS...",
  "DECIPHERING CODEBASE...",
  "ANALYZING SEQUENCES...",
  "PATTERN RECOGNITION ACTIVE...",
  "SEARCHING ENCRYPTED DATA...",
];

interface PlacedWord { word: string; cells: [number, number][]; }

function buildGrid(cols: number, rows: number) {
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => CHARS[Math.floor(Math.random() * 26)]) // só letras no grid
  );
  const placed: PlacedWord[] = [];
  const occ = new Set<string>();

  for (const word of HIDDEN_WORDS) {
    let ok = false;
    for (let t = 0; t < 500 && !ok; t++) {
      const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
      const r0 = Math.floor(Math.random() * rows);
      const c0 = Math.floor(Math.random() * cols);
      const cells: [number, number][] = [];
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i, c = c0 + dc * i;
        if (r < 0 || r >= rows || c < 0 || c >= cols) { fits = false; break; }
        if (occ.has(`${r},${c}`) && grid[r][c] !== word[i]) { fits = false; break; }
        cells.push([r, c]);
      }
      if (fits) {
        cells.forEach(([r, c], i) => { grid[r][c] = word[i]; occ.add(`${r},${c}`); });
        placed.push({ word, cells });
        ok = true;
      }
    }
  }
  return { grid, placed };
}

interface State {
  grid: string[][];
  placed: PlacedWord[];
  foundCells: Set<string>;
  hintCell: string | null;  // só a primeira letra
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
  const stateRef = useRef<State | null>(null);
  const rafRef = useRef<number>(0);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);

  // Rotaciona mensagem de status
  useEffect(() => {
    const id = setInterval(() => setStatusIdx(i => (i + 1) % STATUS_MSGS.length), 3500);
    return () => clearInterval(id);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas || !s) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { cellSize, cols, rows, grid, foundCells, hintCell, selCells } = s;
    const selSet = new Set(selCells.map(([r, c]) => `${r},${c}`));
    const fs = Math.round(cellSize * 0.42);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellSize + cellSize / 2;
        const y = r * cellSize + cellSize / 2;
        const key = `${r},${c}`;
        const char = grid[r][c];
        const isFound = foundCells.has(key);
        const isHint = hintCell === key;
        const isSel = selSet.has(key);

        ctx.shadowBlur = 0;
        ctx.font = `${fs}px monospace`;

        if (isFound) {
          ctx.fillStyle = "rgba(235,0,188,0.15)";
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.shadowBlur = 10; ctx.shadowColor = "#eb00bc";
          ctx.fillStyle = "#eb00bc";
        } else if (isHint) {
          ctx.fillStyle = "rgba(235,0,188,0.25)";
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.shadowBlur = 16; ctx.shadowColor = "#eb00bc";
          ctx.fillStyle = "#fff";
        } else if (isSel) {
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
        } else {
          // Estilo terminal: verde-branco bem sutil
          const isWordChar = s.placed.some(p => p.cells.some(([pr,pc]) => pr === r && pc === c));
          ctx.fillStyle = isWordChar
            ? "rgba(200,255,200,0.11)"
            : "rgba(255,255,255,0.06)";
        }
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;
      }
    }
  }, []);

  useEffect(() => {
    const loop = () => { draw(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  const cellFromPoint = useCallback((clientX: number, clientY: number): [number, number] => {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas || !s) return [-1, -1];
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((clientX - rect.left) / s.cellSize);
    const row = Math.floor((clientY - rect.top) / s.cellSize);
    if (row < 0 || row >= s.rows || col < 0 || col >= s.cols) return [-1, -1];
    return [row, col];
  }, []);

  const cellLine = useCallback((a: [number, number], b: [number, number]): [number, number][] => {
    const [r0,c0] = a; const [r1,c1] = b;
    const dr = Math.sign(r1-r0), dc = Math.sign(c1-c0);
    const rd = Math.abs(r1-r0), cd = Math.abs(c1-c0);
    if (dr !== 0 && dc !== 0 && rd !== cd) return [a];
    const len = Math.max(rd, cd);
    return Array.from({length: len+1}, (_,i) => [r0+dr*i, c0+dc*i]);
  }, []);

  const tryMatch = useCallback((cells: [number, number][]) => {
    const s = stateRef.current;
    if (!s || cells.length < 2) { if(s) { s.selCells=[]; s.selStart=null; s.selecting=false; } return; }
    const word = cells.map(([r,c]) => s.grid[r][c]).join("");
    const rev = [...word].reverse().join("");
    for (const p of s.placed) {
      if ((word === p.word || rev === p.word) && !s.foundWords.includes(p.word)) {
        p.cells.forEach(([r,c]) => s.foundCells.add(`${r},${c}`));
        s.foundWords = [...s.foundWords, p.word];
        setFoundWords([...s.foundWords]);
        setLastFound(p.word);
        setTimeout(() => setLastFound(null), 2500);
        if (s.foundWords.length === HIDDEN_WORDS.length) {
          setTimeout(() => setGameWon(true), 1000);
        }
        break;
      }
    }
    s.selCells = []; s.selStart = null; s.selecting = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    const setup = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const isMobile = w < 768;
      const cellSize = isMobile ? 32 : 26;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.resetTransform(); ctx.scale(dpr, dpr);
      const cols = Math.floor(w / cellSize);
      const rows = Math.floor(h / cellSize);
      const { grid, placed } = buildGrid(cols, rows);
      stateRef.current = {
        grid, placed, foundCells: new Set(), hintCell: null,
        cellSize, cols, rows, selecting: false, selStart: null, selCells: [], foundWords: [],
      };
    };
    setup();

    // Handlers compartilhados
    const onStart = (x: number, y: number) => {
      const s = stateRef.current; if (!s) return;
      const cell = cellFromPoint(x, y); if (cell[0] === -1) return;
      s.selecting = true; s.selStart = cell; s.selCells = [cell];
    };
    const onMove = (x: number, y: number) => {
      const s = stateRef.current; if (!s || !s.selecting || !s.selStart) return;
      const cell = cellFromPoint(x, y); if (cell[0] === -1) return;
      s.selCells = cellLine(s.selStart, cell);
    };
    const onEnd = () => {
      const s = stateRef.current; if (!s || !s.selecting) return;
      tryMatch(s.selCells);
    };

    // Touch events — prioridade mobile
    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; onStart(t.clientX, t.clientY); };
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; onMove(t.clientX, t.clientY); };
    const onTouchEnd = (e: TouchEvent) => { e.preventDefault(); onEnd(); };

    // Mouse events — desktop
    const onMouseDown = (e: MouseEvent) => onStart(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onMouseUp = () => onEnd();

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    window.addEventListener("resize", () => { const ctx = canvas.getContext("2d")!; ctx.resetTransform(); setup(); });

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
    };
  }, [cellFromPoint, cellLine, tryMatch]);

  const handleHint = useCallback(() => {
    const s = stateRef.current;
    if (!s || hintsLeft <= 0) return;
    const unfound = s.placed.filter(p => !s.foundWords.includes(p.word));
    if (!unfound.length) return;
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    const [r, c] = target.cells[0]; // apenas a PRIMEIRA letra
    s.hintCell = `${r},${c}`;
    setHintsLeft(h => h - 1);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      if (stateRef.current) stateRef.current.hintCell = null;
    }, 3000);
  }, [hintsLeft]);

  // Win Screen
  if (gameWon) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 overflow-auto">
        <div className="max-w-lg w-full font-mono text-left">
          <p className="text-[#eb00bc] text-xs mb-6 animate-pulse">{">"} DECODING COMPLETE_</p>
          <div className="border border-[#eb00bc]/30 p-6 mb-8 space-y-3">
            <p className="text-white/40 text-xs">{">"} SYSTEM UNLOCKED</p>
            <p className="text-white/40 text-xs">{">"} LOADING MANIFEST...</p>
            <div className="h-px bg-[#eb00bc]/20 my-4" />
            <p className="text-[#eb00bc] text-xs tracking-widest uppercase">{">"} XPACE DANCE</p>
            <p className="text-white font-display text-2xl md:text-3xl leading-tight mt-2">
              A primeira plataforma de gamificação para dançarinos urbanos.
            </p>
            <div className="h-px bg-[#eb00bc]/20 my-4" />
            <p className="text-white/50 text-xs">{">"} Evolua. Compita. Dance.</p>
            <p className="text-white/50 text-xs">{">"} Em breve.</p>
          </div>
          <a
            href="https://www.instagram.com/xpacedance"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-[#eb00bc] text-black font-bold py-4 uppercase tracking-widest text-sm hover:bg-white transition-colors font-display"
          >
            <Instagram size={18} />
            Acompanhar no Instagram
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0" style={{ touchAction: "none", userSelect: "none" }} />

      {/* Feedback ao encontrar palavra */}
      {lastFound && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-black border border-[#eb00bc] px-8 py-5 text-center shadow-[0_0_60px_rgba(235,0,188,0.3)]">
            <p className="text-[9px] font-mono text-[#eb00bc] tracking-[0.3em] mb-2">{">"} PADRÃO ENCONTRADO</p>
            <p className="text-3xl font-display text-white uppercase">{lastFound}</p>
          </div>
        </div>
      )}

      {/* Status bar inferior */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-md border-t border-white/5 px-4 py-3 flex items-center justify-between gap-4">

        {/* Progresso + palavras encontradas */}
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
            {foundWords.length}/{HIDDEN_WORDS.length} decifradas
          </p>
          {foundWords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {foundWords.map(w => (
                <span key={w} className="text-[8px] font-mono text-[#eb00bc] border border-[#eb00bc]/30 px-1.5 py-0.5 uppercase">
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dica — aqui onde estava o Instagram */}
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0}
          className="shrink-0 flex flex-col items-center text-[9px] font-mono text-white/40 hover:text-[#eb00bc] border border-white/10 hover:border-[#eb00bc]/40 px-3 py-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <span className="uppercase tracking-widest">dica</span>
          <span className="text-[#eb00bc] mt-0.5">{hintsLeft}/{MAX_HINTS}</span>
        </button>
      </div>

      {/* Instagram — agora onde estava a dica (canto superior direito) */}
      <div className="absolute top-4 right-4 z-20">
        <a
          href="https://www.instagram.com/xpacedance"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[9px] font-mono text-white/25 hover:text-white/50 border border-white/8 hover:border-white/20 px-2.5 py-1.5 transition-all"
        >
          <Instagram size={10} />
          <span className="uppercase tracking-widest">@xpacedance</span>
        </a>
      </div>
    </div>
  );
}
