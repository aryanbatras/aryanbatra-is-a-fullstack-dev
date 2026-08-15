"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Keyboard, Play, Shuffle } from "lucide-react";
import ChessGame from "@/components/desktop/apps/ChessGame";
import MinesweeperGame from "@/components/desktop/apps/MinesweeperGame";
import Quake3Game from "@/components/desktop/apps/Quake3Game";
import SpaceCadetGame from "@/components/desktop/apps/SpaceCadetGame";
import TetrisGame from "@/components/desktop/apps/TetrisGame";
import Glyph from "@/components/desktop/Glyph";
import styles from "@/styles/components/desktop/apps.module.css";

type GameId = "2048" | "memory" | "snake" | "pong" | "piano" | "chess" | "minesweeper" | "tetris" | "breakout" | "dino" | "pinball" | "quake3";

interface GameMeta {
  id: GameId;
  icon: string;
  title: string;
  desc: string;
  /** Accent colour — every game gets its own identity. */
  accent: string;
  /** The keys you actually use. */
  keys: string;
}

const GAMES: GameMeta[] = [
  {
    id: "2048",
    icon: "binary",
    title: "2048 — Systems Edition",
    desc: "Merge the bits until you build a 64-bit register.",
    accent: "#ff9f0a",
    keys: "Arrow keys",
  },
  {
    id: "memory",
    icon: "brain",
    title: "Memory Match",
    desc: "Flip the stack and find every pair. Fewer moves = sharper cache.",
    accent: "#bf5af2",
    keys: "Click to flip",
  },
  {
    id: "snake",
    icon: "bug",
    title: "Heap Worm — Snake",
    desc: "Gobble the bytes, don't overwrite your own stack.",
    accent: "#30d158",
    keys: "Arrow keys",
  },
  {
    id: "pong",
    icon: "dices",
    title: "Binary Pong",
    desc: "First to 7 against a CPU that never sleeps.",
    accent: "#0a84ff",
    keys: "W/S or ↑/↓",
  },
  {
    id: "piano",
    icon: "piano",
    title: "Online Piano",
    desc: "A real, playable piano — my live project, right in the arcade.",
    accent: "#ff375f",
    keys: "Keyboard or clicks",
  },
  {
    id: "chess",
    icon: "dices",
    title: "Chess — AI / 2P / Watch",
    desc: "Play the minimax engine, a friend on the same board, or watch CPU vs CPU.",
    accent: "#5b8cff",
    keys: "Click to move",
  },
  {
    id: "minesweeper",
    icon: "zap",
    title: "Minesweeper",
    desc: "Clear the 9x9 field without hitting a mine. Right-click to flag.",
    accent: "#30d158",
    keys: "Left / right click",
  },
  {
    id: "tetris",
    icon: "grid",
    title: "Tetris",
    desc: "Stack the falling shapes, clear lines, survive the speed-up.",
    accent: "#00d4ff",
    keys: "Arrow keys · Space · C",
  },
  {
    id: "breakout",
    icon: "atom",
    title: "Breakout — DX-Ball",
    desc: "Smash the brick grid with the bouncing ball. Clear it to win.",
    accent: "#ff375f",
    keys: "←/→ or mouse",
  },
  {
    id: "dino",
    icon: "bug",
    title: "Offline Dino",
    desc: "The chrome://dino runner — jump the cacti, dodge the pterodactyls.",
    accent: "#8e8e93",
    keys: "Space · ↑ · click",
  },
];

/** The big WASM games, ported straight from the daedalOS machine. */
const FULL_GAMES: { id: GameId; icon: string; title: string; desc: string; accent: string; keys: string }[] = [
  {
    id: "pinball",
    icon: "pinball",
    title: "Space Cadet Pinball",
    desc: "The legendary Windows 95 table — flippers, bumpers, gravity. Compiled to WASM.",
    accent: "#3aa0ff",
    keys: "Z / X flippers",
  },
  {
    id: "quake3",
    icon: "quake",
    title: "Quake III Arena",
    desc: "Full 3D FPS against bots — pointer-lock shooting, running entirely in the browser.",
    accent: "#ff4d2e",
    keys: "WASD + mouse",
  },
];

/** Live project sites that allow embedding — playable right inside the arcade. */
const LIVE_PLAYS: { url: string; icon: string; title: string; desc: string }[] = [
  {
    url: "https://online-piano-two.vercel.app",
    icon: "piano",
    title: "Online Piano",
    desc: "My FFmpeg-compressed piano samples, playable with keyboard or clicks.",
  },
  {
    url: "https://browser-ai-dun.vercel.app",
    icon: "bot",
    title: "Browser AI",
    desc: "Object detection, background removal and PDF summaries — all on-device.",
  },
  {
    url: "https://weekend-movers.vercel.app",
    icon: "truck",
    title: "Weekend Movers",
    desc: "The GSAP + AI-generated redesign, live.",
  },
];

/** A live site embedded directly — the browser within the arcade. */
function WebPlay({ url, title, icon, onExit }: { url: string; title: string; icon: string; onExit: () => void }) {
  return (
    <div className={styles.gameShell} data-game="webplay">
      <div className={styles.gameBar}>
        <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to arcade">
          <ArrowLeft size={15} />
        </button>
        <span className={styles.gameTitleIcon}>
          <Glyph id={icon} size={15} />
        </span>
        <span className={styles.gameTitle}>{title}</span>
        <a
          className={styles.gameBtn}
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "none" }}
        >
          Open full <ArrowRight size={12} style={{ verticalAlign: -2 }} />
        </a>
      </div>
      <div className={styles.gameWebFrame}>
        <iframe
          src={url}
          title={title}
          className={styles.gameWebIframe}
          loading="lazy"
          allow="autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}

/** 2048 — the classic, rendered as a 4x4 grid. */
function Game2048({ onExit }: { onExit: () => void }) {
  const empty = () => Array.from({ length: 16 }, () => 0) as number[];
  const [grid, setGrid] = useState<number[]>(empty);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem("arcade-2048-best") ?? 0);
    setBest(saved);
  }, []);

  const addRandom = (g: number[]): number[] => {
    const zeros = g.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
    if (!zeros.length) return g;
    const idx = zeros[Math.floor(Math.random() * zeros.length)];
    const next = [...g];
    next[idx] = Math.random() < 0.9 ? 2 : 4;
    return next;
  };

  const newGame = () => {
    let g = addRandom(empty());
    g = addRandom(g);
    setGrid(g);
    setScore(0);
    scoreRef.current = 0;
    setOver(false);
    setWon(false);
  };

  useEffect(() => {
    newGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Slide a row toward index 0, merging equal neighbours; returns [row, gained].
  const slideRow = (row: number[]): [number[], number] => {
    const vals = row.filter((v) => v !== 0);
    const out: number[] = [];
    let gained = 0;
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] === vals[i + 1]) {
        out.push(vals[i] * 2);
        gained += vals[i] * 2;
        i++;
      } else {
        out.push(vals[i]);
      }
    }
    while (out.length < 4) out.push(0);
    return [out, gained];
  };

  const canMerge = (g: number[]) => {
    for (let i = 0; i < 16; i++) {
      const right = i % 4 < 3 && g[i] === g[i + 1];
      const down = i < 12 && g[i] === g[i + 4];
      if (right || down) return true;
    }
    return false;
  };

  const move = (dir: "left" | "right" | "up" | "down") => {
    if (over || won) return;
    const forward = (line: number[]): [number[], number] => slideRow(line);
    const backward = (line: number[]): [number[], number] => {
      const [s, g] = slideRow([...line].reverse());
      return [[...s].reverse(), g];
    };

    let gained = 0;
    let next: number[];
    if (dir === "left") {
      const lines = Array.from({ length: 4 }, (_, r) => grid.slice(r * 4, r * 4 + 4));
      const out = lines.map(forward);
      gained = out.reduce((a, [, g]) => a + g, 0);
      next = out.map(([line]) => line).flat();
    } else if (dir === "right") {
      const lines = Array.from({ length: 4 }, (_, r) => grid.slice(r * 4, r * 4 + 4));
      const out = lines.map(backward);
      gained = out.reduce((a, [, g]) => a + g, 0);
      next = out.map(([line]) => line).flat();
    } else {
      const cols = Array.from({ length: 4 }, (_, c) =>
        Array.from({ length: 4 }, (_, r) => grid[r * 4 + c]),
      );
      const out = cols.map(dir === "up" ? forward : backward);
      gained = out.reduce((a, [, g]) => a + g, 0);
      next = Array.from({ length: 16 }, (_, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        return out[c][0][r];
      });
    }
    if (next.join(",") === grid.join(",")) return; // nothing moved
    const withTile = addRandom(next);
    setGrid(withTile);
    setScore((s) => s + gained);
    scoreRef.current += gained;
    if (gained > 0) {
      const newBest = Math.max(best, scoreRef.current);
      if (newBest > best) {
        setBest(newBest);
        window.localStorage.setItem("arcade-2048-best", String(newBest));
      }
    }
    if (withTile.includes(2048)) setWon(true);
    if (!withTile.includes(0) && !canMerge(withTile)) setOver(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, "left" | "right" | "up" | "down"> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        move(d);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, over, won, best]);

  const colors: Record<number, string> = {
    0: "rgba(255,255,255,0.04)",
    2: "#eef0f4",
    4: "#e4e8ef",
    8: "#ffb340",
    16: "#ff9f0a",
    32: "#ff8a00",
    64: "#ff6b3d",
    128: "#ffd166",
    256: "#ffc94d",
    512: "#ffc233",
    1024: "#ffb81f",
    2048: "#ffb300",
  };

  return (
    <div className={styles.gameShell} data-game="2048" style={{ "--accent": "#ff9f0a" } as React.CSSProperties}>
      <div className={styles.gameBar}>
        <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to arcade">
          <ArrowLeft size={15} />
        </button>
        <span className={styles.gameTitleIcon}>
          <Glyph id="binary" size={15} />
        </span>
        <span className={styles.gameTitle}>2048 — Systems Edition</span>
        <span className={styles.gameScore}>Score {score}</span>
        {best > 0 && <span className={styles.gameScore}>Best {best}</span>}
        <button type="button" className={styles.gameBtn} onClick={newGame}>
          New Game
        </button>
      </div>
      <div className={styles.game2048Board}>
        {grid.map((v, i) => (
          <div
            key={i}
            className={styles.game2048Cell}
            style={{
              background: colors[v] ?? "#ffb300",
              color: v >= 8 ? "#fff" : v === 0 ? "transparent" : "#4a4d57",
              boxShadow: v >= 128 ? `0 0 18px rgba(255, 179, 0, 0.35)` : undefined,
            }}
          >
            {v || ""}
          </div>
        ))}
      </div>
      {(over || won) && (
        <div className={styles.gameOverlay}>
          <strong>{won ? "You built a 64-bit register! 🎉" : "Stack overflow — no moves left."}</strong>
          <span className={styles.gameOverlaySub}>Score {score} · Best {best}</span>
          <button type="button" className={styles.gameBtn} onClick={newGame}>
            Play again
          </button>
        </div>
      )}
      <p className={styles.gameHint}>
        <Keyboard size={12} /> Arrow keys to move · merges double the bits
      </p>
    </div>
  );
}

const PAIRS = ["coffee", "zap", "atom", "flame", "fish", "star"];

/** Build a shuffled double-deck of the pair icons. */
function shuffledDeck(): string[] {
  const deck = [...PAIRS, ...PAIRS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Memory Match — flip icon cards and find all pairs. */
function GameMemory({ onExit }: { onExit: () => void }) {
  const [cards, setCards] = useState<string[]>(shuffledDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const lockRef = useRef(false);

  const newGame = () => {
    setCards(shuffledDeck());
    setOpen([]);
    setMatched(new Set());
    setMoves(0);
    lockRef.current = false;
  };

  const flip = (i: number) => {
    if (lockRef.current || open.includes(i) || matched.has(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;
      const [a, b] = next;
      if (cards[a] === cards[b]) {
        window.setTimeout(() => {
          setMatched((m) => new Set(m).add(a).add(b));
          setOpen([]);
          lockRef.current = false;
        }, 350);
      } else {
        window.setTimeout(() => {
          setOpen([]);
          lockRef.current = false;
        }, 750);
      }
    }
  };

  const done = matched.size === cards.length && cards.length > 0;

  return (
    <div className={styles.gameShell} data-game="memory" style={{ "--accent": "#bf5af2" } as React.CSSProperties}>
      <div className={styles.gameBar}>
        <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to arcade">
          <ArrowLeft size={15} />
        </button>
        <span className={styles.gameTitleIcon}>
          <Glyph id="brain" size={15} />
        </span>
        <span className={styles.gameTitle}>Memory Match</span>
        <span className={styles.gameScore}>Moves {moves}</span>
        <button type="button" className={styles.gameBtn} onClick={newGame}>
          <Shuffle size={12} style={{ verticalAlign: -2 }} /> Shuffle
        </button>
      </div>
      <div className={styles.gameMemGrid}>
        {cards.map((c, i) => {
          const faceUp = open.includes(i) || matched.has(i);
          return (
            <button
              key={i}
              type="button"
              className={`${styles.gameMemCard} ${faceUp ? styles.gameMemCardUp : ""} ${
                matched.has(i) ? styles.gameMemCardMatched : ""
              }`}
              onClick={() => flip(i)}
              aria-label={faceUp ? c : "Hidden card"}
            >
              <span className={styles.gameMemFace}>
                {faceUp ? <Glyph id={c} size={30} /> : null}
              </span>
            </button>
          );
        })}
      </div>
      {done && (
        <div className={styles.gameOverlay}>
          <strong>Cache cleared — all pairs found in {moves} moves!</strong>
          <button type="button" className={styles.gameBtn} onClick={newGame}>
            Play again
          </button>
        </div>
      )}
      <p className={styles.gameHint}>
        <Keyboard size={12} /> Find every pair of the stack
      </p>
    </div>
  );
}

const SNAKE_COLS = 18;
const SNAKE_ROWS = 18;

/** Heap Worm — classic snake on a memory grid. */
function GameSnake({ onExit }: { onExit: () => void }) {
  const key = (x: number, y: number) => y * SNAKE_COLS + x;
  const [grid, setGrid] = useState<number[]>(() => new Array(SNAKE_COLS * SNAKE_ROWS).fill(0));
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const ref = useRef({
    snake: [[9, 9] as [number, number]],
    dir: [1, 0] as [number, number],
    next: [1, 0] as [number, number],
    food: [13, 9] as [number, number],
    tick: 0,
  });
  const cellsRef = useRef(grid);
  const setCells = (g: number[]) => {
    cellsRef.current = g;
    setGrid(g);
  };

  const spawnFood = (snake: [number, number][], occupied: Set<number>): [number, number] => {
    const free: number[] = [];
    for (let y = 0; y < SNAKE_ROWS; y++) {
      for (let x = 0; x < SNAKE_COLS; x++) {
        if (!occupied.has(key(x, y))) free.push(key(x, y));
      }
    }
    if (!free.length) return [-1, -1];
    const k = free[Math.floor(Math.random() * free.length)];
    return [k % SNAKE_COLS, Math.floor(k / SNAKE_COLS)];
  };

  const paint = (snake: [number, number][], food: [number, number]) => {
    const g = new Array(SNAKE_COLS * SNAKE_ROWS).fill(0);
    snake.forEach(([x, y]) => (g[key(x, y)] = 1));
    if (food[0] >= 0) g[key(food[0], food[1])] = 2;
    setCells(g);
  };

  const step = () => {
    const s = ref.current;
    s.dir = s.next;
    const head = s.snake[0];
    const nx = head[0] + s.dir[0];
    const ny = head[1] + s.dir[1];
    if (nx < 0 || ny < 0 || nx >= SNAKE_COLS || ny >= SNAKE_ROWS) {
      setOver(true);
      return;
    }
    const hitSelf = s.snake.some(([x, y]) => x === nx && y === ny);
    if (hitSelf) {
      setOver(true);
      return;
    }
    const ate = nx === s.food[0] && ny === s.food[1];
    const snake: [number, number][] = [[nx, ny], ...s.snake];
    if (!ate) snake.pop();
    const occupied = new Set(snake.map(([x, y]) => key(x, y)));
    s.food = ate ? spawnFood(snake, occupied) : s.food;
    s.snake = snake;
    if (ate) setScore((v) => v + 1);
    paint(snake, s.food);
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!ref.current.snake.length) return;
      step();
    }, 115);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = ref.current;
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      if (d[0] === -s.dir[0] && d[1] === -s.dir[1]) return; // no 180°
      s.next = d;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const newGame = () => {
    ref.current = {
      snake: [[9, 9]],
      dir: [1, 0],
      next: [1, 0],
      food: [13, 9],
      tick: 0,
    };
    setScore(0);
    setOver(false);
    paint([[9, 9]], [13, 9]);
  };

  useEffect(() => {
    paint([[9, 9]], [13, 9]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.gameShell} data-game="snake" style={{ "--accent": "#30d158" } as React.CSSProperties}>
      <div className={styles.gameBar}>
        <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to arcade">
          <ArrowLeft size={15} />
        </button>
        <span className={styles.gameTitleIcon}>
          <Glyph id="bug" size={15} />
        </span>
        <span className={styles.gameTitle}>Heap Worm — Snake</span>
        <span className={styles.gameScore}>Bytes {score}</span>
        <button type="button" className={styles.gameBtn} onClick={newGame}>
          Restart
        </button>
      </div>
      <div className={styles.gameSnakeBoard} style={{ gridTemplateColumns: `repeat(${SNAKE_COLS}, 1fr)` }}>
        {grid.map((v, i) => (
          <div
            key={i}
            className={`${styles.gameSnakeCell} ${
              v === 1 ? styles.gameSnakeBody : v === 2 ? styles.gameSnakeFood : ""
            }`}
          />
        ))}
      </div>
      {over && (
        <div className={styles.gameOverlay}>
          <strong>Segfault — you wrote past the heap ({score} bytes).</strong>
          <button type="button" className={styles.gameBtn} onClick={newGame}>
            Play again
          </button>
        </div>
      )}
      <p className={styles.gameHint}>
        <Keyboard size={12} /> Arrow keys to steer · bytes make you grow
      </p>
    </div>
  );
}

/** Binary Pong — paddle vs CPU, first to 7. */
function GamePong({ onExit }: { onExit: () => void }) {
  const courtRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const p1Ref = useRef<HTMLDivElement>(null);
  const p2Ref = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [over, setOver] = useState(false);
  const rafRef = useRef(0);
  const stateRef = useRef({
    ball: { x: 50, y: 50, vx: 0.95, vy: 0.55 },
    p1: 50,
    p2: 50,
    up: false,
    down: false,
    w: false,
    s: false,
    score: [0, 0] as [number, number],
    live: true,
  });

  const resetBall = (dir: number) => {
    const s = stateRef.current;
    s.ball = { x: 50, y: 50, vx: dir * 0.95, vy: (Math.random() - 0.5) * 0.8 || 0.4 };
  };

  const loop = () => {
    const s = stateRef.current;
    if (s.live) {
      // CPU paddle — lazy-chases the ball
      s.p2 += (s.ball.y - s.p2) * 0.05;
      s.p2 = Math.min(80, Math.max(14, s.p2));
      // Player paddle
      if (s.w) s.p1 -= 1.15;
      if (s.s) s.p1 += 1.15;
      s.p1 = Math.min(80, Math.max(14, s.p1));
      // Ball
      s.ball.x += s.ball.vx;
      s.ball.y += s.ball.vy;
      if (s.ball.y < 2.5 || s.ball.y > 97.5) s.ball.vy *= -1;
      const padY = (y: number) => y - 9; // paddle centre offset (18% tall)
      if (s.ball.vx < 0 && s.ball.x > 3 && s.ball.x < 9 && Math.abs(s.ball.y - padY(s.p1)) < 12) {
        s.ball.vx = Math.abs(s.ball.vx) + 0.06;
        s.ball.vy = (s.ball.y - padY(s.p1)) / 9;
      }
      if (s.ball.vx > 0 && s.ball.x > 91 && s.ball.x < 97 && Math.abs(s.ball.y - padY(s.p2)) < 12) {
        s.ball.vx = -Math.abs(s.ball.vx) - 0.06;
        s.ball.vy = (s.ball.y - padY(s.p2)) / 9;
      }
      if (s.ball.x < -3) {
        s.score[1] += 1;
        setScore([s.score[0], s.score[1]]);
        resetBall(1);
      } else if (s.ball.x > 103) {
        s.score[0] += 1;
        setScore([s.score[0], s.score[1]]);
        resetBall(-1);
      }
      if (s.score[0] >= 7 || s.score[1] >= 7) {
        s.live = false;
        setOver(true);
      }
      // Paint
      if (ballRef.current) {
        ballRef.current.style.left = `${s.ball.x}%`;
        ballRef.current.style.top = `${s.ball.y}%`;
      }
      if (p1Ref.current) p1Ref.current.style.top = `${s.p1}%`;
      if (p2Ref.current) p2Ref.current.style.top = `${s.p2}%`;
    }
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        s.up = true;
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        s.down = true;
      } else if (e.key === "w" || e.key === "W") s.w = true;
      else if (e.key === "s" || e.key === "S") s.s = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === "ArrowUp") s.up = false;
      else if (e.key === "ArrowDown") s.down = false;
      else if (e.key === "w" || e.key === "W") s.w = false;
      else if (e.key === "s" || e.key === "S") s.s = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const newGame = () => {
    const s = stateRef.current;
    s.score = [0, 0];
    s.p1 = 50;
    s.p2 = 50;
    s.live = true;
    setScore([0, 0]);
    setOver(false);
    resetBall(Math.random() < 0.5 ? 1 : -1);
  };

  return (
    <div className={styles.gameShell} data-game="pong" style={{ "--accent": "#0a84ff" } as React.CSSProperties}>
      <div className={styles.gameBar}>
        <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to arcade">
          <ArrowLeft size={15} />
        </button>
        <span className={styles.gameTitleIcon}>
          <Glyph id="dices" size={15} />
        </span>
        <span className={styles.gameTitle}>Binary Pong</span>
        <span className={styles.gameScore}>
          You {score[0]} — {score[1]} CPU
        </span>
        <button type="button" className={styles.gameBtn} onClick={newGame}>
          Restart
        </button>
      </div>
      <div ref={courtRef} className={styles.gamePongCourt}>
        <div className={styles.gamePongCenter} />
        <div ref={p1Ref} className={`${styles.gamePongPaddle} ${styles.gamePongP1}`} />
        <div ref={p2Ref} className={`${styles.gamePongPaddle} ${styles.gamePongP2}`} />
        <div ref={ballRef} className={styles.gamePongBall} />
      </div>
      {over && (
        <div className={styles.gameOverlay}>
          <strong>
            {stateRef.current.score[0] >= 7 ? "You win — CPU core dumped!" : "CPU wins this core."}
          </strong>
          <button type="button" className={styles.gameBtn} onClick={newGame}>
            Play again
          </button>
        </div>
      )}
      <p className={styles.gameHint}>
        <Keyboard size={12} /> W/S or ↑/↓ to move · first to 7
      </p>
    </div>
  );
}

/** Breakout — the daedalOS DX-Ball classic: smash every brick. */
function GameBreakout({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [state, setState] = useState<"ready" | "playing" | "won" | "lost">("ready");
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 520;
    const H = 380;
    canvas.width = W;
    canvas.height = H;

    const BRICK_ROWS = 7;
    const BRICK_COLS = 10;
    const brickW = (W - 24) / BRICK_COLS;
    const brickH = 14;
    const topPad = 34;
    const bricks = Array.from({ length: BRICK_ROWS * BRICK_COLS }, (_, i) => ({
      x: 12 + (i % BRICK_COLS) * brickW,
      y: topPad + Math.floor(i / BRICK_COLS) * (brickH + 5),
      alive: true,
      row: Math.floor(i / BRICK_COLS),
    }));

    const paddle = { w: 86, h: 10, x: W / 2 - 43, y: H - 26 };
    const ball = { r: 6, x: W / 2, y: H - 40, vx: 2.6, vy: -2.6 };

    let raf = 0;
    let keys = { left: false, right: false };
    let mouseX: number | null = null;

    const resetBall = () => {
      ball.x = W / 2;
      ball.y = H - 40;
      ball.vx = 2.6 * (Math.random() < 0.5 ? -1 : 1);
      ball.vy = -2.6;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") keys.left = e.type === "keydown";
      if (e.key === "ArrowRight") keys.right = e.type === "keydown";
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
    };
    const onClick = () => {
      if (stateRef.current === "ready") setState("playing");
      if (stateRef.current === "lost" || stateRef.current === "won") {
        // restart
        scoreRef.current = 0;
        livesRef.current = 3;
        setScore(0);
        setLives(3);
        bricks.forEach((b) => (b.alive = true));
        resetBall();
        setState("playing");
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("click", onClick);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      ctx.fillStyle = "#0b0d12";
      ctx.fillRect(0, 0, W, H);

      // bricks
      const colors = ["#ff375f", "#ff9f0a", "#ffd60a", "#30d158", "#64d2ff", "#0a84ff", "#bf5af2"];
      for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = colors[b.row % colors.length];
        ctx.globalAlpha = 1 - b.row * 0.08;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, brickW - 2, brickH, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // paddle
      if (stateRef.current === "playing") {
        if (keys.left) paddle.x -= 6;
        if (keys.right) paddle.x += 6;
        if (mouseX !== null) paddle.x = mouseX - paddle.w / 2;
      }
      paddle.x = Math.max(6, Math.min(W - paddle.w - 6, paddle.x));
      ctx.fillStyle = "#f5f5f7";
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 5);
      ctx.fill();

      // ball + physics
      if (stateRef.current === "playing") {
        ball.x += ball.vx;
        ball.y += ball.vy;
        if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
        if (ball.y < ball.r) ball.vy *= -1;
        // paddle bounce
        if (
          ball.vy > 0 &&
          ball.y + ball.r >= paddle.y &&
          ball.y + ball.r <= paddle.y + paddle.h + 6 &&
          ball.x >= paddle.x - ball.r &&
          ball.x <= paddle.x + paddle.w + ball.r
        ) {
          const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          ball.vy = -Math.abs(ball.vy);
          ball.vx = hit * 4.2;
        }
        // brick collision
        for (const b of bricks) {
          if (!b.alive) continue;
          if (
            ball.x + ball.r > b.x &&
            ball.x - ball.r < b.x + brickW &&
            ball.y + ball.r > b.y &&
            ball.y - ball.r < b.y + brickH
          ) {
            b.alive = false;
            ball.vy *= -1;
            scoreRef.current += 10 * (BRICK_ROWS - b.row);
            setScore(scoreRef.current);
            break;
          }
        }
        // lost ball
        if (ball.y > H + 20) {
          livesRef.current -= 1;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            setState("lost");
          } else {
            resetBall();
          }
        }
        // won
        if (bricks.every((b) => !b.alive)) setState("won");
      }

      // ball
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      // overlays
      if (stateRef.current === "ready") {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.font = "600 20px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Click to serve", W / 2, H / 2 - 6);
        ctx.font = "12px system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText("←/→ or mouse to steer", W / 2, H / 2 + 18);
      } else if (stateRef.current === "lost" || stateRef.current === "won") {
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.font = "600 22px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          stateRef.current === "won" ? "All bricks cleared! 🎉" : "Stack overflow — ball lost.",
          W / 2,
          H / 2 - 6,
        );
        ctx.font = "12px system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("Click to play again", W / 2, H / 2 + 18);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className={styles.gameShell} data-game="breakout" style={{ "--accent": "#ff375f" } as React.CSSProperties}>
      <div className={styles.gameBar}>
        <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to arcade">
          <ArrowLeft size={15} />
        </button>
        <span className={styles.gameTitleIcon}>
          <Glyph id="atom" size={15} />
        </span>
        <span className={styles.gameTitle}>Breakout — DX-Ball</span>
        <span className={styles.gameScore}>Score {score}</span>
        <span className={styles.gameScore}>Lives {lives}</span>
      </div>
      <div className={styles.gameBreakoutWrap}>
        <canvas
          ref={canvasRef}
          className={styles.gameBreakoutCanvas}
          width={520}
          height={380}
          aria-label="Breakout game"
        />
      </div>
      <p className={styles.gameHint}>
        <Keyboard size={12} /> Move with ←/→ or your mouse · click to serve
      </p>
    </div>
  );
}

/** Offline Dino — the chrome://dino runner (daedalOS ships it in its browser). */
function GameDino({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [state, setState] = useState<"ready" | "running" | "over">("ready");
  const scoreRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setBest(Number(window.localStorage.getItem("arcade-dino-best") ?? 0));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 520;
    const H = 180;
    const GROUND = H - 28;
    canvas.width = W;
    canvas.height = H;

    const dino = { x: 44, y: GROUND - 24, w: 22, h: 24, vy: 0 };
    const obstacles: { x: number; w: number; h: number; type: 0 | 1 }[] = [];
    let speed = 4.2;
    let frames = 0;
    let nextSpawn = 70;
    let raf = 0;
    let last = 0;

    const jump = () => {
      if (stateRef.current === "ready") {
        setState("running");
      }
      if (stateRef.current === "over") {
        scoreRef.current = 0;
        setScore(0);
        obstacles.length = 0;
        speed = 4.2;
        nextSpawn = 70;
        dino.y = GROUND - 24;
        dino.vy = 0;
        setState("running");
      }
      if (stateRef.current === "running" && dino.y >= GROUND - 24) {
        dino.vy = -8.6;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    const onClick = () => jump();
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("pointerdown", onClick);

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 16) return;
      const dt = Math.min(3, (t - last) / 16);
      last = t;
      frames += 1;

      // clear + sky
      ctx.fillStyle = "#f7f7f2";
      ctx.fillRect(0, 0, W, H);
      // clouds
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      for (let i = 0; i < 3; i++) {
        const cx = ((frames * 0.6 + i * 180) % (W + 60)) - 30;
        ctx.beginPath();
        ctx.ellipse(cx, 30 + i * 22, 22, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // ground
      ctx.fillStyle = "#3c3c43";
      ctx.fillRect(0, GROUND, W, 3);
      ctx.fillStyle = "rgba(60,60,67,0.4)";
      for (let i = 0; i < W / 24; i++) {
        const gx = ((i * 24 - (frames * speed) % 24) + W) % W;
        ctx.fillRect(gx, GROUND + 7, 12, 2);
      }

      if (stateRef.current === "running") {
        speed = Math.min(9, speed + 0.003 * dt);
        scoreRef.current += Math.floor(dt);
        setScore(scoreRef.current);

        // gravity
        dino.vy += 0.55 * dt;
        dino.y += dino.vy * dt;
        if (dino.y >= GROUND - 24) {
          dino.y = GROUND - 24;
          dino.vy = 0;
        }

        // spawn obstacles
        nextSpawn -= dt;
        if (nextSpawn <= 0) {
          const type: 0 | 1 = Math.random() < 0.82 ? 0 : 1; // 1 = flying
          obstacles.push({
            x: W + 10,
            w: type === 0 ? 14 + Math.random() * 8 : 30,
            h: type === 0 ? 26 : 16,
            type,
          });
          nextSpawn = 55 + Math.random() * 90;
        }

        // move + collide
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const o = obstacles[i];
          o.x -= speed * dt;
          const oy = o.type === 0 ? GROUND - o.h : GROUND - 40;
          const hit =
            dino.x + dino.w > o.x + 3 &&
            dino.x < o.x + o.w - 3 &&
            dino.y + dino.h > oy + 3 &&
            dino.y < oy + o.h - 3;
          if (hit) {
            setState("over");
            const b = Math.max(scoreRef.current, best);
            setBest(b);
            window.localStorage.setItem("arcade-dino-best", String(b));
          }
          if (o.x + o.w < 0) obstacles.splice(i, 1);
        }
      }

      // draw dino (little T-rex made of rects)
      ctx.fillStyle = "#3c3c43";
      ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
      ctx.fillRect(dino.x + dino.w - 4, dino.y - 8, 4, 8); // head
      ctx.fillRect(dino.x + dino.w + 2, dino.y - 4, 4, 4); // snout
      ctx.fillStyle = "#fff";
      ctx.fillRect(dino.x + dino.w - 1, dino.y - 6, 2, 3); // eye
      // legs
      ctx.fillStyle = "#3c3c43";
      const run = frames % 8 < 4;
      ctx.fillRect(dino.x + 3, dino.y + dino.h, 4, run ? 4 : 8);
      ctx.fillRect(dino.x + 12, dino.y + dino.h, 4, run ? 8 : 4);

      // draw obstacles
      for (const o of obstacles) {
        const oy = o.type === 0 ? GROUND - o.h : GROUND - 40;
        ctx.fillStyle = "#3c3c43";
        ctx.fillRect(o.x, oy, o.w, o.h);
        if (o.type === 0) ctx.fillRect(o.x + 2, oy + o.h, 3, 6);
      }

      // overlays
      if (stateRef.current === "ready") {
        ctx.fillStyle = "rgba(247,247,242,0.82)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#3c3c43";
        ctx.font = "600 17px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Press space to run", W / 2, H / 2 - 4);
      } else if (stateRef.current === "over") {
        ctx.fillStyle = "rgba(247,247,242,0.85)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#3c3c43";
        ctx.font = "600 18px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💥 Game over — press space to retry", W / 2, H / 2 - 4);
      }

      // score (top right, like the real dino game)
      ctx.fillStyle = "#3c3c43";
      ctx.font = "12px monospace";
      ctx.textAlign = "right";
      ctx.fillText(String(scoreRef.current).padStart(5, "0"), W - 12, 18);
      if (best > 0) ctx.fillText(`HI ${String(best).padStart(5, "0")}`, W - 12, 34);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onClick);
    };
  }, [best]);

  return (
    <div className={styles.gameShell} data-game="dino" style={{ "--accent": "#8e8e93" } as React.CSSProperties}>
      <div className={styles.gameBar}>
        <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to arcade">
          <ArrowLeft size={15} />
        </button>
        <span className={styles.gameTitleIcon}>
          <Glyph id="bug" size={15} />
        </span>
        <span className={styles.gameTitle}>Offline Dino</span>
        <span className={styles.gameScore}>Score {score}</span>
        {best > 0 && <span className={styles.gameScore}>Best {best}</span>}
      </div>
      <div className={styles.gameBreakoutWrap}>
        <canvas
          ref={canvasRef}
          className={styles.gameDinoCanvas}
          width={520}
          height={180}
          aria-label="Dino runner game"
        />
      </div>
      <p className={styles.gameHint}>
        <Keyboard size={12} /> Space or ↑ to jump · click also works · it speeds up
      </p>
    </div>
  );
}

interface GamesAppProps {
  /** Auto-start a specific game (e.g. chess when a .pgn is opened from Finder). */
  initialGame?: GameId;
  /** PGN file name to review in chess (loaded from Finder storage). */
  pgnName?: string;
  /** PGN source text (falls back to a storage lookup by name). */
  pgnContent?: string;
}

/** Games launcher — pick a mini game. */
export default function GamesApp({ initialGame, pgnName, pgnContent }: GamesAppProps) {
  const [active, setActive] = useState<GameId | null>(initialGame ?? null);
  const [webPlay, setWebPlay] = useState<(typeof LIVE_PLAYS)[number] | null>(null);

  if (webPlay) return <WebPlay url={webPlay.url} title={webPlay.title} icon={webPlay.icon} onExit={() => setWebPlay(null)} />;
  if (active === "2048") return <Game2048 onExit={() => setActive(null)} />;
  if (active === "memory") return <GameMemory onExit={() => setActive(null)} />;
  if (active === "snake") return <GameSnake onExit={() => setActive(null)} />;
  if (active === "pong") return <GamePong onExit={() => setActive(null)} />;
  if (active === "chess")
    return (
      <ChessGame onExit={() => setActive(null)} pgnName={pgnName} pgnContent={pgnContent} />
    );
  if (active === "minesweeper") return <MinesweeperGame onExit={() => setActive(null)} />;
  if (active === "tetris") return <TetrisGame onExit={() => setActive(null)} />;
  if (active === "breakout") return <GameBreakout onExit={() => setActive(null)} />;
  if (active === "dino") return <GameDino onExit={() => setActive(null)} />;
  if (active === "pinball") return <SpaceCadetGame onExit={() => setActive(null)} />;
  if (active === "quake3") return <Quake3Game onExit={() => setActive(null)} />;
  if (active === "piano")
    return (
      <WebPlay url="https://online-piano-two.vercel.app" title="Online Piano" icon="piano" onExit={() => setActive(null)} />
    );

  return (
    <div className={styles.gameShell} data-game="launcher">
      <header className={styles.arcadeHeader}>
        <span className={styles.arcadeMark}>
          <Play size={18} fill="currentColor" />
        </span>
        <div>
          <h3 className={styles.gameLauncherTitle}>Mini Arcade</h3>
          <p className={styles.gameLauncherSub}>Small games, systems-themed — built for the machine.</p>
        </div>
      </header>

      <div className={styles.gameLauncherGrid}>
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={styles.gameCard}
            style={{ "--accent": g.accent } as React.CSSProperties}
            onClick={() => setActive(g.id)}
          >
            <span className={styles.gameCardIcon}>
              <Glyph id={g.icon} size={24} />
            </span>
            <strong className={styles.gameCardTitle}>{g.title}</strong>
            <span className={styles.gameCardDesc}>{g.desc}</span>
            <span className={styles.gameCardFoot}>
              <span className={styles.gameCardKeys}>{g.keys}</span>
              <span className={styles.gameCardPlay}>
                Play <ArrowRight size={12} />
              </span>
            </span>
          </button>
        ))}
      </div>

      <header className={styles.arcadeHeader} style={{ marginTop: 26 }}>
        <span className={styles.arcadeMark}>
          <Glyph id="gamepad" size={16} />
        </span>
        <div>
          <h3 className={styles.gameLauncherTitle}>Full Games — WASM</h3>
          <p className={styles.gameLauncherSub}>
            Ported straight from the daedalOS machine — real compiled games,
            not remakes. Download once, then they boot instantly.
          </p>
        </div>
      </header>

      <div className={styles.gameLauncherGrid}>
        {FULL_GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={styles.gameCard}
            style={{ "--accent": g.accent } as React.CSSProperties}
            onClick={() => setActive(g.id)}
          >
            <span className={styles.gameCardIcon}>
              <Glyph id={g.icon} size={24} />
            </span>
            <strong className={styles.gameCardTitle}>{g.title}</strong>
            <span className={styles.gameCardDesc}>{g.desc}</span>
            <span className={styles.gameCardFoot}>
              <span className={styles.gameCardKeys}>{g.keys}</span>
              <span className={styles.gameCardPlay}>
                Play <ArrowRight size={12} />
              </span>
            </span>
          </button>
        ))}
      </div>

      <header className={styles.arcadeHeader} style={{ marginTop: 26 }}>
        <span className={styles.arcadeMark}>
          <Glyph id="globe" size={16} />
        </span>
        <div>
          <h3 className={styles.gameLauncherTitle}>Live Projects</h3>
          <p className={styles.gameLauncherSub}>My real, deployed projects — playable right here, no new tab needed.</p>
        </div>
      </header>

      <div className={styles.gameLauncherGrid}>
        {LIVE_PLAYS.map((g) => (
          <button
            key={g.url}
            type="button"
            className={styles.gameCard}
            style={{ "--accent": "#64d2ff" } as React.CSSProperties}
            onClick={() => setWebPlay(g)}
          >
            <span className={styles.gameCardIcon}>
              <Glyph id={g.icon} size={24} />
            </span>
            <strong className={styles.gameCardTitle}>{g.title}</strong>
            <span className={styles.gameCardDesc}>{g.desc}</span>
            <span className={styles.gameCardFoot}>
              <span className={styles.gameCardKeys}>Embedded</span>
              <span className={styles.gameCardPlay}>
                Launch <ArrowRight size={12} />
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
