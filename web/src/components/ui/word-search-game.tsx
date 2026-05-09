"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Instagram } from "lucide-react";

const HIDDEN_WORDS = ["STREAMING", "HOME", "VIDEO", "PLATAFORMA", "CONFORTO", "TELA", "RANKING", "ESTUDIO"];
const DIRS: [number, number][] = [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
const STATUS_BAR_PX = 64; // altura da barra de status inferior (px)
const MAX_HINTS = 5;

const STATUS_MSGS = [
  "SCANNING FOR PATTERNS...",
  "DECIPHERING CODEBASE...",
  "ANALYZING SEQUENCES...",
  "PATTERN RECOGNITION ACTIVE...",
  "SEARCHING ENCRYPTED DATA...",
];

// LCG — seed fixo garante grade IDÊNTICA para todos os usuários
function makePRNG(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}
const SEED = 42069; // seed fixo

interface PlacedWord { word: string; cells: [number, number][]; }

function buildGrid(cols: number, rows: number, safeRows: number) {
  // safeRows: linhas disponíveis para colocar palavras (exclui área da barra de UI)
  const rng = makePRNG(SEED);
  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ALPHA[Math.floor(rng() * 26)])
  );
  const placed: PlacedWord[] = [];
  const occ = new Set<string>();

  for (const word of HIDDEN_WORDS) {
    let ok = false;
    for (let t = 0; t < 600 && !ok; t++) {
      const [dr, dc] = DIRS[Math.floor(rng() * DIRS.length)];
      // Restringe r0 à zona segura (fora da área da barra inferior)
      const r0 = Math.floor(rng() * safeRows);
      const c0 = Math.floor(rng() * cols);
      const cells: [number, number][] = [];
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i, c = c0 + dc * i;
        // Também valida que a palavra inteira fica na zona segura
        if (r < 0 || r >= safeRows || c < 0 || c >= cols) { fits = false; break; }
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

  // Planta "APP" no centro exato da grade — escondida entre as letras normais
  const cr = Math.floor(rows / 2);
  const cc = Math.floor(cols / 2) - 1; // 3 letras: A(cc), P(cc+1), P(cc+2) — horizontais
  // só planta se nenhuma das células foi ocupada por uma palavra
  const appCells: [number, number][] = [[cr, cc], [cr, cc+1], [cr, cc+2]];
  const appStr = "APP";
  const canPlantApp = appCells.every(([r,c]) => r >= 0 && r < rows && c >= 0 && c < cols && !occ.has(`${r},${c}`));
  if (canPlantApp) {
    appCells.forEach(([r, c], i) => { grid[r][c] = appStr[i]; });
  }

  return { grid, placed, appCells: canPlantApp ? appCells : [] };
}

interface State {
  grid: string[][];
  placed: PlacedWord[];
  foundCells: Set<string>;
  appCells: [number, number][];
  appRevealStep: number; // 0=hidden, 1=A aceso, 2=AP aceso, 3=APP aceso
  hintCell: string | null;
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
  const [appReveal, setAppReveal] = useState(0); // drive react re-render para sincronizar
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
    const { cellSize, cols, rows, grid, foundCells, hintCell, selCells, appCells, appRevealStep } = s;
    const selSet = new Set(selCells.map(([r, c]) => `${r},${c}`));
    const fs = Math.round(cellSize * 0.42);
    const appSet = new Set(appCells.slice(0, appRevealStep).map(([r,c]) => `${r},${c}`));

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
        const isApp = appSet.has(key);

        ctx.shadowBlur = 0;
        ctx.font = `${fs}px monospace`;

        if (isApp) {
          // APP revelado — grande destaque
          ctx.fillStyle = "rgba(235,0,188,0.25)";
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.shadowBlur = 20; ctx.shadowColor = "#eb00bc";
          ctx.font = `bold ${Math.round(fs * 1.4)}px monospace`;
          ctx.fillStyle = "#eb00bc";
        } else if (isFound) {
          ctx.fillStyle = "rgba(235,0,188,0.12)";
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.shadowBlur = 8; ctx.shadowColor = "#eb00bc";
          ctx.fillStyle = "#eb00bc";
        } else if (isHint) {
          ctx.fillStyle = "rgba(235,0,188,0.2)";
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.shadowBlur = 14; ctx.shadowColor = "#eb00bc";
          ctx.fillStyle = "#fff";
        } else if (isSel) {
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
        } else {
          const isWordChar = s.placed.some(p => p.cells.some(([pr,pc]) => pr === r && pc === c));
          ctx.fillStyle = isWordChar ? "rgba(200,255,200,0.11)" : "rgba(255,255,255,0.06)";
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

  // Revela APP letra por letra após todas as palavras encontradas
  const revealApp = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const step = (n: number) => {
      s.appRevealStep = n;
      setAppReveal(n);
    };
    setTimeout(() => step(1), 400);
    setTimeout(() => step(2), 900);
    setTimeout(() => step(3), 1400);
    setTimeout(() => setGameWon(true), 3200);
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
        setTimeout(() => setLastFound(null), 2000);
        if (s.foundWords.length === HIDDEN_WORDS.length) {
          setTimeout(() => revealApp(), 600);
        }
        break;
      }
    }
    s.selCells = []; s.selStart = null; s.selecting = false;
  }, [revealApp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    const setup = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const isMobile = w < 768;
      const cellSize = isMobile ? 38 : 30;
      const cols = Math.floor(w / cellSize);
      const rows = Math.floor(h / cellSize);
      // Zona segura: exclui as linhas cobertas pela barra de UI inferior
      const safeRows = Math.max(4, rows - Math.ceil(STATUS_BAR_PX / cellSize) - 1);
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.resetTransform(); ctx.scale(dpr, dpr);
      const { grid, placed, appCells } = buildGrid(cols, rows, safeRows);
      stateRef.current = {
        grid, placed, appCells, appRevealStep: 0,
        foundCells: new Set(), hintCell: null,
        cellSize, cols, rows, selecting: false, selStart: null, selCells: [], foundWords: [],
      };
    };
    setup();

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
    const onEnd = () => { const s = stateRef.current; if (!s || !s.selecting) return; tryMatch(s.selCells); };

    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; onStart(t.clientX, t.clientY); };
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); const t = e.touches[0]; onMove(t.clientX, t.clientY); };
    const onTouchEnd = (e: TouchEvent) => { e.preventDefault(); onEnd(); };
    const onMouseDown = (e: MouseEvent) => onStart(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onEnd);
    canvas.addEventListener("mouseleave", onEnd);
    const onResize = () => { canvas.getContext("2d")!.resetTransform(); setup(); };
    window.addEventListener("resize", onResize);

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onEnd);
      canvas.removeEventListener("mouseleave", onEnd);
      window.removeEventListener("resize", onResize);
    };
  }, [cellFromPoint, cellLine, tryMatch]);

  const handleHint = useCallback(() => {
    const s = stateRef.current;
    if (!s || hintsLeft <= 0) return;
    const unfound = s.placed.filter(p => !s.foundWords.includes(p.word));
    if (!unfound.length) return;
    const target = unfound[Math.floor(Math.random() * unfound.length)];
    const [r, c] = target.cells[0];
    s.hintCell = `${r},${c}`;
    setHintsLeft(h => h - 1);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => { if (stateRef.current) stateRef.current.hintCell = null; }, 3000);
  }, [hintsLeft]);

  if (gameWon) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 overflow-auto">
        <div className="max-w-lg w-full font-mono text-left animate-in fade-in zoom-in duration-700">
          <p className="text-[#eb00bc] text-[10px] mb-2 animate-pulse tracking-[0.4em]">{">"} DECODING COMPLETE_</p>
          <p className="text-white/30 text-[9px] mb-8 uppercase tracking-widest">{">"} A palavra central era: <span className="text-white">APP</span></p>
          
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#eb00bc]/20 to-transparent blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative border border-white/10 bg-black/40 backdrop-blur-sm p-8 mb-8 space-y-4">
              <p className="text-white/20 text-[8px] tracking-[0.3em] uppercase">{">"} PROJECT_XPACE_MANIFEST</p>
              <div className="h-px bg-white/5 w-12" />
              <p className="text-[#eb00bc] font-display text-4xl md:text-5xl leading-none tracking-tighter uppercase">XPACE DANCE</p>
              <p className="text-white font-display text-xl md:text-2xl leading-tight text-balance">
                A primeira plataforma de streaming e gamificação para a cultura urbana.
              </p>
              <div className="space-y-1 pt-4">
                <p className="text-white/40 text-[9px] uppercase tracking-widest">{">"} Streaming. Ranking. Studio.</p>
                <p className="text-white/40 text-[9px] uppercase tracking-widest">{">"} Transformando movimento em evolução.</p>
              </div>
            </div>
          </div>

          <a
            href="https://www.instagram.com/xpacedance"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-5 uppercase tracking-[0.2em] text-xs hover:bg-[#eb00bc] transition-all duration-300 font-display shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(235,0,188,0.3)]"
          >
            <Instagram size={16} />
            Acompanhar Lançamento
          </a>
        </div>
      </div>
    );
  }

  // Tela de "APP revelando" — transição antes do win screen
  if (appReveal === 3 && !gameWon) {
    return (
      <div className="relative w-full h-full">
        <canvas ref={canvasRef} className="absolute inset-0" style={{ touchAction: "none", userSelect: "none" }} />
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <p className="text-[#eb00bc] font-display text-xs tracking-[0.4em] animate-pulse">{">"} SISTEMA DECIFRADO</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0" style={{ touchAction: "none", userSelect: "none" }} />

      {/* Terminal Status - Top Left */}
      <div className="absolute top-16 left-4 z-20 pointer-events-none sm:top-20">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 bg-[#eb00bc] animate-pulse" />
          <p className="text-[8px] font-mono text-white/40 uppercase tracking-[0.2em] animate-in fade-in duration-1000">
            {STATUS_MSGS[statusIdx]}
          </p>
        </div>
      </div>

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
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
              {foundWords.length}/{HIDDEN_WORDS.length} decifradas
            </p>
            <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#eb00bc] transition-all duration-500" 
                style={{ width: `${(foundWords.length / HIDDEN_WORDS.length) * 100}%` }}
              />
            </div>
          </div>
          {foundWords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {foundWords.map(w => (
                <span key={w} className="text-[8px] font-mono text-[#eb00bc] border border-[#eb00bc]/30 px-1.5 py-0.5 uppercase">{w}</span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleHint}
          disabled={hintsLeft <= 0}
          className="shrink-0 flex flex-col items-center text-[9px] font-mono text-white/40 hover:text-[#eb00bc] border border-white/10 hover:border-[#eb00bc]/40 px-3 py-2 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
        >
          <span className="uppercase tracking-widest group-hover:scale-105 transition-transform">dica</span>
          <span className="text-[#eb00bc] mt-0.5">{hintsLeft}/{MAX_HINTS}</span>
        </button>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <a href="https://www.instagram.com/xpacedance" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[9px] font-mono text-white/25 hover:text-white/50 border border-white/10 hover:border-white/20 px-2.5 py-1.5 transition-all">
          <Instagram size={10} />
          <span className="uppercase tracking-widest">@xpacedance</span>
        </a>
      </div>
    </div>
  );
}
