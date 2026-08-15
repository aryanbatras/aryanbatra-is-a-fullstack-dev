"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/desktop/apps.module.css";

interface TetrisGameProps {
  onExit: () => void;
}

const COLS = 10;
const ROWS = 20;
const BLOCK = 22;

const SHAPES: { cells: [number, number][]; color: string }[] = [
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], color: "#00d4ff" }, // I
  { cells: [[1, 0], [0, 1], [1, 1], [2, 1]], color: "#bf5af2" }, // T
  { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], color: "#ff9f0a" }, // L
  { cells: [[2, 0], [0, 1], [1, 1], [2, 1]], color: "#0a84ff" }, // J
  { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: "#ffd60a" }, // O
  { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], color: "#30d158" }, // S
  { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: "#ff375f" }, // Z
];

const rotate = (cells: [number, number][]): [number, number][] =>
  cells.map(([x, y]) => [y, -x]);

type Piece = { type: number; cells: [number, number][]; x: number; y: number };

const randomPiece = (): Piece => {
  const type = Math.floor(Math.random() * SHAPES.length);
  return {
    type,
    cells: SHAPES[type].cells.map(([x, y]) => [x, y] as [number, number]),
    x: Math.floor((COLS - 4) / 2),
    y: 0,
  };
};

const collides = (board: (number | null)[][], p: Piece): boolean =>
  p.cells.some(([x, y]) => {
    const nx = p.x + x;
    const ny = p.y + y;
    return nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx] !== null);
  });

const merge = (board: (number | null)[][], p: Piece): (number | null)[][] => {
  const next = board.map((row) => [...row]);
  for (const [x, y] of p.cells) {
    const ny = p.y + y;
    if (ny >= 0) next[ny][p.x + x] = p.type;
  }
  return next;
};

const clearLines = (board: (number | null)[][]): { board: (number | null)[][]; lines: number } => {
  const kept = board.filter((row) => row.some((c) => c === null));
  const cleared = ROWS - kept.length;
  const empty = Array.from({ length: cleared }, () => Array.from({ length: COLS }, () => null));
  return { board: [...empty, ...kept], lines: cleared };
};

/** Tetris — 10x20, hold, next preview, line-clear scoring with increasing speed. */
export default function TetrisGame({ onExit }: TetrisGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [over, setOver] = useState(false);
  const [next, setNext] = useState<Piece>(randomPiece);
  const [hold, setHold] = useState<number | null>(null);
  const stateRef = useRef({
    board: Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null)) as (number | null)[][],
    piece: randomPiece(),
    next: randomPiece(),
    hold: null as number | null,
    usedHold: false,
    score: 0,
    lines: 0,
    level: 1,
    over: false,
    dropAcc: 0,
    last: 0,
  });

  const spawn = (s: typeof stateRef.current, useNext = false) => {
    const p = useNext ? s.next : randomPiece();
    s.next = randomPiece();
    s.piece = p;
    s.usedHold = false;
    if (collides(s.board, p)) {
      s.over = true;
    }
  };

  const lockAndSpawn = (s: typeof stateRef.current) => {
    s.board = merge(s.board, s.piece);
    const { board, lines: cleared } = clearLines(s.board);
    s.board = board;
    if (cleared > 0) {
      const pts = [0, 100, 300, 500, 800][cleared] ?? 800;
      s.score += pts * s.level;
      s.lines += cleared;
      s.level = 1 + Math.floor(s.lines / 10);
      setScore(s.score);
      setLines(s.lines);
      setLevel(s.level);
    }
    spawn(s);
  };

  const tryShift = (dx: number) => {
    const s = stateRef.current;
    const p = { ...s.piece, x: s.piece.x + dx };
    if (!collides(s.board, p)) s.piece = p;
  };

  const tryRotate = () => {
    const s = stateRef.current;
    const p = { ...s.piece, cells: rotate(s.piece.cells) };
    // simple wall kicks
    for (const kick of [0, -1, 1, -2, 2]) {
      const kicked = { ...p, x: p.x + kick };
      if (!collides(s.board, kicked)) {
        s.piece = kicked;
        return;
      }
    }
  };

  const hardDrop = () => {
    const s = stateRef.current;
    while (!collides(s.board, { ...s.piece, y: s.piece.y + 1 })) {
      s.piece.y += 1;
    }
    lockAndSpawn(s);
  };

  const doHold = () => {
    const s = stateRef.current;
    if (s.usedHold || s.over) return;
    s.usedHold = true;
    if (s.hold === null) {
      s.hold = s.piece.type;
      spawn(s, true);
    } else {
      const held = s.hold;
      s.hold = s.piece.type;
      s.piece = { type: held, cells: SHAPES[held].cells.map(([x, y]) => [x, y] as [number, number]), x: Math.floor((COLS - 4) / 2), y: 0 };
      if (collides(s.board, s.piece)) s.over = true;
    }
    setHold(s.hold);
    setNext({ ...s.next });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = COLS * BLOCK * dpr;
    canvas.height = ROWS * BLOCK * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const speedFor = (lvl: number) => Math.max(60, 800 - (lvl - 1) * 70);

    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (s.over) return;
      switch (e.key) {
        case "ArrowLeft": e.preventDefault(); tryShift(-1); break;
        case "ArrowRight": e.preventDefault(); tryShift(1); break;
        case "ArrowDown": e.preventDefault(); s.dropAcc += speedFor(s.level) * 0.5; break;
        case "ArrowUp": e.preventDefault(); tryRotate(); break;
        case " ": e.preventDefault(); hardDrop(); break;
        case "c":
        case "C":
        case "Shift":
          e.preventDefault();
          doHold();
          break;
      }
      setOver(s.over);
    };
    window.addEventListener("keydown", onKey);

    const tick = (t: number) => {
      const s = stateRef.current;
      if (!s.last) s.last = t;
      const dt = t - s.last;
      s.last = t;
      if (!s.over) {
        s.dropAcc += dt;
        const interval = speedFor(s.level);
        while (s.dropAcc >= interval) {
          s.dropAcc -= interval;
          const p = { ...s.piece, y: s.piece.y + 1 };
          if (collides(s.board, p)) {
            lockAndSpawn(s);
            setOver(s.over);
          } else {
            s.piece = p;
          }
        }
      }

      // draw
      ctx.fillStyle = "#0c0e16";
      ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
      const drawCell = (x: number, y: number, type: number | null, alpha = 1) => {
        if (type === null) return;
        ctx.globalAlpha = alpha;
        const color = SHAPES[type]?.color ?? "#888";
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = "#fff";
        ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, 4);
        ctx.globalAlpha = 1;
      };
      s.board.forEach((row, y) => row.forEach((c, x) => drawCell(x, y, c)));
      // ghost piece
      let ghost = s.piece;
      while (!collides(s.board, { ...ghost, y: ghost.y + 1 })) ghost = { ...ghost, y: ghost.y + 1 };
      if (!s.over) {
        ghost.cells.forEach(([x, y]) => {
          if (ghost.y + y >= 0) drawCell(ghost.x + x, ghost.y + y, ghost.type, 0.18);
        });
      }
      // active piece
      if (!s.over) {
        s.piece.cells.forEach(([x, y]) => {
          if (s.piece.y + y >= 0) drawCell(s.piece.x + x, s.piece.y + y, s.piece.type);
        });
      }
      // subtle grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK + 0.5, 0);
        ctx.lineTo(x * BLOCK + 0.5, ROWS * BLOCK);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK + 0.5);
        ctx.lineTo(COLS * BLOCK, y * BLOCK + 0.5);
        ctx.stroke();
      }
      raf = requestAnimationFrame(tick);
    };
    let raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newGame = () => {
    const s = stateRef.current;
    s.board = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
    s.hold = null;
    s.usedHold = false;
    s.score = 0;
    s.lines = 0;
    s.level = 1;
    s.over = false;
    s.dropAcc = 0;
    setScore(0);
    setLines(0);
    setLevel(1);
    setOver(false);
    setHold(null);
    spawn(s);
    setNext({ ...s.next });
  };

  const holdPreview = hold !== null ? SHAPES[hold] : null;

  return (
    <div className={styles.gameShell} data-game="tetris" style={{ "--accent": "#00d4ff" } as React.CSSProperties}>
      <div className={styles.gameBar}>
        <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to arcade">
          <span aria-hidden>←</span>
        </button>
        <span className={styles.gameTitle}>Tetris</span>
        <span className={styles.gameScore}>Score {score}</span>
        <span className={styles.gameScore}>Lines {lines}</span>
        <span className={styles.gameScore}>Lv {level}</span>
        <button type="button" className={styles.gameBtn} onClick={newGame}>
          New
        </button>
      </div>

      <div className={styles.tetrisWrap}>
        <div className={styles.tetrisSide}>
          <span className={styles.tetrisSideLabel}>Hold</span>
          <div className={styles.tetrisMini}>
            {holdPreview &&
              holdPreview.cells.map(([x, y], i) => (
                <span
                  key={i}
                  className={styles.tetrisMiniBlock}
                  style={{
                    gridColumn: x + 1,
                    gridRow: y + 1,
                    background: holdPreview.color,
                  }}
                />
              ))}
          </div>
        </div>

        <canvas ref={canvasRef} className={styles.tetrisCanvas} />

        <div className={styles.tetrisSide}>
          <span className={styles.tetrisSideLabel}>Next</span>
          <div className={styles.tetrisMini}>
            {next.cells.map(([x, y], i) => (
              <span
                key={i}
                className={styles.tetrisMiniBlock}
                style={{
                  gridColumn: x + 1,
                  gridRow: y + 1,
                  background: SHAPES[next.type].color,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {over && (
        <div className={styles.gameOverlay}>
          <strong>Game over — {lines} lines cleared.</strong>
          <button type="button" className={styles.gameBtn} onClick={newGame}>
            Play again
          </button>
        </div>
      )}

      <p className={styles.gameHint}>
        ← → move · ↑ rotate · ↓ soft drop · Space hard drop · C hold
      </p>
    </div>
  );
}
