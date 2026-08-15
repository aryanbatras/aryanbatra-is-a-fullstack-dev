"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/desktop/apps.module.css";

type GameId = "2048" | "memory" | "snake" | "pong" | "piano";

const GAMES: { id: GameId; emoji: string; title: string; desc: string }[] = [
  {
    id: "2048",
    emoji: "🔢",
    title: "2048 — Systems Edition",
    desc: "Merge the bits until you build a 64-bit register. Arrow keys / swipe to move.",
  },
  {
    id: "memory",
    emoji: "🧠",
    title: "Memory Match",
    desc: "Flip the stack of tech icons and find every pair. Fewer moves = sharper cache.",
  },
  {
    id: "snake",
    emoji: "🐍",
    title: "Heap Worm — Snake",
    desc: "Gobble the bytes, don't overwrite your own stack. Arrow keys to steer.",
  },
  {
    id: "pong",
    emoji: "🏓",
    title: "Binary Pong",
    desc: "First to 7. W/S or ↑/↓ against a CPU that never sleeps.",
  },
  {
    id: "piano",
    emoji: "🎹",
    title: "Online Piano",
    desc: "A real, playable piano — my live project, right in the arcade. Click keys or use your keyboard.",
  },
];

/** Live project sites that allow embedding — playable right inside the arcade. */
const LIVE_PLAYS: { url: string; emoji: string; title: string; desc: string }[] = [
  {
    url: "https://online-piano-two.vercel.app",
    emoji: "🎹",
    title: "Online Piano",
    desc: "My FFmpeg-compressed piano samples, playable with keyboard or clicks.",
  },
  {
    url: "https://browser-ai-dun.vercel.app",
    emoji: "🤖",
    title: "Browser AI",
    desc: "Object detection, background removal and PDF summaries — all on-device.",
  },
  {
    url: "https://weekend-movers.vercel.app",
    emoji: "🚚",
    title: "Weekend Movers",
    desc: "The GSAP + AI-generated redesign, live.",
  },
];

/** A live site embedded directly — the browser within the arcade. */
function WebPlay({ url, title, onExit }: { url: string; title: string; onExit: () => void }) {
  return (
    <div className={styles.gameShell} data-game="webplay">
      <div className={styles.gameBar}>
        <span className={styles.gameTitle}>{title}</span>
        <a
          className={styles.gameBtn}
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "none" }}
        >
          Open full ↗
        </a>
        <button type="button" className={styles.gameBtn} onClick={onExit}>
          ← Arcade
        </button>
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
  const empty = () =>
    Array.from({ length: 16 }, () => 0) as number[];
  const [grid, setGrid] = useState<number[]>(empty);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const scoreRef = useRef(0);

  const addRandom = (g: number[]): number[] => {
    const zeros = g
      .map((v, i) => (v === 0 ? i : -1))
      .filter((i) => i >= 0);
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

  const move = (dir: "left" | "right" | "up" | "down") => {
    if (over || won) return;
    // Slide a line toward index 0 with merging; used for left/top.
    const forward = (line: number[]): [number[], number] => slideRow(line);
    // Slide toward the last index (right/bottom).
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
    if (withTile.includes(2048)) setWon(true);
    if (!withTile.includes(0) && !canMerge(withTile)) setOver(true);
  };

  const canMerge = (g: number[]) => {
    for (let i = 0; i < 16; i++) {
      const right = i % 4 < 3 && g[i] === g[i + 1];
      const down = i < 12 && g[i] === g[i + 4];
      if (right || down) return true;
    }
    return false;
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
  }, [grid, over, won]);

  const colors: Record<number, string> = {
    0: "rgba(255,255,255,0.04)",
    2: "rgba(238,228,218,0.55)",
    4: "rgba(237,224,200,0.55)",
    8: "#f2b179",
    16: "#f59563",
    32: "#f67c5f",
    64: "#f65e3b",
    128: "#edcf72",
    256: "#edcc61",
    512: "#edc850",
    1024: "#edc53f",
    2048: "#edc22e",
  };

  return (
    <div className={styles.gameShell} data-game="2048">
      <div className={styles.gameBar}>
        <span className={styles.gameTitle}>2048 — Systems Edition</span>
        <span className={styles.gameScore}>Score {score}</span>
        <button type="button" className={styles.gameBtn} onClick={newGame}>
          New Game
        </button>
        <button type="button" className={styles.gameBtn} onClick={onExit}>
          ← Games
        </button>
      </div>
      <div className={styles.game2048Board}>
        {grid.map((v, i) => (
          <div
            key={i}
            className={styles.game2048Cell}
            style={{
              background: colors[v] ?? "#edc22e",
              color: v >= 8 ? "#fff" : v === 0 ? "transparent" : "#776e65",
            }}
          >
            {v || ""}
          </div>
        ))}
      </div>
      {(over || won) && (
        <div className={styles.gameOverlay}>
          <strong>{won ? "You built a 64-bit register! 🎉" : "Stack overflow — no moves left."}</strong>
          <button type="button" className={styles.gameBtn} onClick={newGame}>
            Play again
          </button>
        </div>
      )}
      <p className={styles.gameHint}>Arrow keys to move · merges double the bits</p>
    </div>
  );
}

const PAIRS = ["☕", "🐍", "⚛️", "🦀", "🐳", "🔥"];

/** Memory Match — flip tech-emoji cards and find all pairs. */
function GameMemory({ onExit }: { onExit: () => void }) {
  const [cards, setCards] = useState<string[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const lockRef = useRef(false);

  const newGame = () => {
    const deck = [...PAIRS, ...PAIRS];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setCards(deck);
    setOpen([]);
    setMatched(new Set());
    setMoves(0);
    lockRef.current = false;
  };

  useEffect(() => {
    newGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className={styles.gameShell} data-game="memory">
      <div className={styles.gameBar}>
        <span className={styles.gameTitle}>Memory Match</span>
        <span className={styles.gameScore}>Moves {moves}</span>
        <button type="button" className={styles.gameBtn} onClick={newGame}>
          Shuffle
        </button>
        <button type="button" className={styles.gameBtn} onClick={onExit}>
          ← Games
        </button>
      </div>
      <div className={styles.gameMemGrid}>
        {cards.map((c, i) => {
          const faceUp = open.includes(i) || matched.has(i);
          return (
            <button
              key={i}
              type="button"
              className={`${styles.gameMemCard} ${
                faceUp ? styles.gameMemCardUp : ""
              } ${matched.has(i) ? styles.gameMemCardMatched : ""}`}
              onClick={() => flip(i)}
              aria-label={faceUp ? c : "Hidden card"}
            >
              <span className={styles.gameMemFace}>{faceUp ? c : ""}</span>
            </button>
          );
        })}
      </div>
      {done && (
        <div className={styles.gameOverlay}>
          <strong>Cache cleared — all pairs found in {moves} moves! 🎉</strong>
          <button type="button" className={styles.gameBtn} onClick={newGame}>
            Play again
          </button>
        </div>
      )}
      <p className={styles.gameHint}>Find every pair of the stack</p>
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
    <div className={styles.gameShell} data-game="snake">
      <div className={styles.gameBar}>
        <span className={styles.gameTitle}>Heap Worm — Snake</span>
        <span className={styles.gameScore}>Bytes {score}</span>
        <button type="button" className={styles.gameBtn} onClick={newGame}>
          Restart
        </button>
        <button type="button" className={styles.gameBtn} onClick={onExit}>
          ← Games
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
      <p className={styles.gameHint}>Arrow keys to steer · bytes make you grow</p>
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
    <div className={styles.gameShell} data-game="pong">
      <div className={styles.gameBar}>
        <span className={styles.gameTitle}>Binary Pong</span>
        <span className={styles.gameScore}>
          You {score[0]} — {score[1]} CPU
        </span>
        <button type="button" className={styles.gameBtn} onClick={newGame}>
          Restart
        </button>
        <button type="button" className={styles.gameBtn} onClick={onExit}>
          ← Games
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
            {stateRef.current.score[0] >= 7 ? "You win — CPU core dumped! 🎉" : "CPU wins this core."}
          </strong>
          <button type="button" className={styles.gameBtn} onClick={newGame}>
            Play again
          </button>
        </div>
      )}
      <p className={styles.gameHint}>W/S or ↑/↓ to move · first to 7</p>
    </div>
  );
}

/** Games launcher — pick a mini game. */
export default function GamesApp() {
  const [active, setActive] = useState<GameId | null>(null);
  const [webPlay, setWebPlay] = useState<(typeof LIVE_PLAYS)[number] | null>(null);

  if (webPlay) return <WebPlay url={webPlay.url} title={webPlay.title} onExit={() => setWebPlay(null)} />;
  if (active === "2048") return <Game2048 onExit={() => setActive(null)} />;
  if (active === "memory") return <GameMemory onExit={() => setActive(null)} />;
  if (active === "snake") return <GameSnake onExit={() => setActive(null)} />;
  if (active === "pong") return <GamePong onExit={() => setActive(null)} />;
  if (active === "piano")
    return <WebPlay url="https://online-piano-two.vercel.app" title="Online Piano" onExit={() => setActive(null)} />;

  return (
    <div className={styles.gameShell} data-game="launcher">
      <h3 className={styles.gameLauncherTitle}>Mini Arcade</h3>
      <p className={styles.gameLauncherSub}>
        Small games, systems-themed — built for the machine.
      </p>
      <div className={styles.gameLauncherGrid}>
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={styles.gameCard}
            onClick={() => setActive(g.id)}
          >
            <span className={styles.gameCardEmoji}>{g.emoji}</span>
            <strong className={styles.gameCardTitle}>{g.title}</strong>
            <span className={styles.gameCardDesc}>{g.desc}</span>
            <span className={styles.gameCardPlay}>Play →</span>
          </button>
        ))}
      </div>

      <h3 className={styles.gameLauncherTitle} style={{ marginTop: 26 }}>
        Live Projects
      </h3>
      <p className={styles.gameLauncherSub}>
        My real, deployed projects — playable right here, no new tab needed.
      </p>
      <div className={styles.gameLauncherGrid}>
        {LIVE_PLAYS.map((g) => (
          <button
            key={g.url}
            type="button"
            className={styles.gameCard}
            onClick={() => setWebPlay(g)}
          >
            <span className={styles.gameCardEmoji}>{g.emoji}</span>
            <strong className={styles.gameCardTitle}>{g.title}</strong>
            <span className={styles.gameCardDesc}>{g.desc}</span>
            <span className={styles.gameCardPlay}>Launch →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
