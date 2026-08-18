"use client";

import { useState } from "react";
import { ArrowRight, Gamepad2 } from "lucide-react";
import ChessGame from "@/components/desktop/apps/ChessGame";
import MinesweeperGame from "@/components/desktop/apps/MinesweeperGame";
import TetrisGame from "@/components/desktop/apps/TetrisGame";
import Tic80Game from "@/components/desktop/apps/Tic80Game";
import Glyph from "@/components/desktop/Glyph";
import styles from "@/styles/components/desktop/apps.module.css";

type GameId = "chess" | "minesweeper" | "tetris" | "tic80" | "piano" | "2048" | "snake" | "sudoku";

interface GameMeta {
  id: GameId;
  icon: string;
  title: string;
  desc: string;
  accent: string;
  keys: string;
  online?: boolean;
  url?: string;
}

const GAMES: GameMeta[] = [
  {
    id: "chess",
    icon: "dices",
    title: "Chess",
    desc: "Play against an AI opponent with adjustable difficulty levels.",
    accent: "#5b8cff",
    keys: "Click to move",
  },
  {
    id: "tetris",
    icon: "grid",
    title: "Tetris",
    desc: "The classic falling blocks puzzle game. Stack and clear lines.",
    accent: "#30d158",
    keys: "Arrow keys + Space",
  },
  {
    id: "minesweeper",
    icon: "bomb",
    title: "Minesweeper",
    desc: "Find all the mines without detonating any. Classic logic puzzle.",
    accent: "#ff453a",
    keys: "Click to reveal",
  },
  {
    id: "tic80",
    icon: "emulator",
    title: "TIC-80",
    desc: "Retro fantasy computer — play and create tiny Lua games.",
    accent: "#ffec27",
    keys: "Arrow keys + Z/X",
  },
  {
    id: "piano",
    icon: "music",
    title: "Piano",
    desc: "Play piano with your keyboard — full 88 keys, multiple instruments.",
    accent: "#bf5af2",
    keys: "A-L keys to play",
    online: true,
    url: "https://online-piano-two.vercel.app",
  },
  {
    id: "2048",
    icon: "grid",
    title: "2048",
    desc: "Slide tiles and combine numbers to reach 2048.",
    accent: "#ffd60a",
    keys: "Arrow keys",
    online: true,
    url: "https://play2048.co/",
  },
  {
    id: "snake",
    icon: "gamepad",
    title: "Snake",
    desc: "Guide the snake to eat food and grow longer. Don't hit the walls!",
    accent: "#30d158",
    keys: "Arrow keys",
    online: true,
    url: "https://www.google.com/logos/fnbx/snake/classic.html",
  },
  {
    id: "sudoku",
    icon: "grid",
    title: "Sudoku",
    desc: "Fill the 9×9 grid so each row, column, and box contains 1-9.",
    accent: "#0a84ff",
    keys: "Click to fill",
    online: true,
    url: "https://sudoku.com/",
  },
];

interface GamesAppProps {
  initialGame?: GameId;
  onLaunchGame: (gameId: GameId, title: string) => void;
}

export default function GamesApp({ initialGame, onLaunchGame }: GamesAppProps) {
  const [active, setActive] = useState<GameId | null>(initialGame ?? null);

  const launch = (id: GameId, title: string) => {
    setActive(null);
    onLaunchGame(id, title);
  };

  if (active === "chess")
    return <ChessGame onExit={() => setActive(null)} />;
  if (active === "minesweeper")
    return <MinesweeperGame onExit={() => setActive(null)} />;
  if (active === "tetris")
    return <TetrisGame onExit={() => setActive(null)} />;
  if (active === "tic80")
    return <Tic80Game onExit={() => setActive(null)} />;
  if (active && GAMES.find((g) => g.id === active && g.online && g.url)) {
    const game = GAMES.find((g) => g.id === active)!;
    return (
      <div className={styles.gameShell} data-game={active}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "#1a1a2e", flexShrink: 0 }}>
          <button
            onClick={() => setActive(null)}
            style={{ padding: "4px 12px", border: "1px solid #555", borderRadius: 4, background: "transparent", color: "#aaa", fontSize: 12, cursor: "pointer" }}
          >← Back</button>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{game.title}</span>
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <iframe
            src={game.url}
            title={game.title}
            style={{ width: "100%", height: "100%", border: "none" }}
            loading="lazy"
            allow="autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameShell} data-game="launcher">
      <header className={styles.arcadeHeader}>
        <span className={styles.arcadeMark}>
          <Gamepad2 size={18} />
        </span>
        <div>
          <h3 className={styles.gameLauncherTitle}>Games</h3>
          <p className={styles.gameLauncherSub}>
            Select a game to play
          </p>
        </div>
      </header>

      <div className={styles.gameLauncherGrid}>
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={styles.gameCard}
            style={{ "--accent": g.accent } as React.CSSProperties}
            onClick={() => launch(g.id, g.title)}
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
    </div>
  );
}
