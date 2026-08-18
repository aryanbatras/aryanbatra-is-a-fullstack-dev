"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Gamepad2 } from "lucide-react";
import ChessGame from "@/components/desktop/apps/ChessGame";
import Tic80Game from "@/components/desktop/apps/Tic80Game";
import DxBallGame from "@/components/desktop/apps/DxBallGame";
import Glyph from "@/components/desktop/Glyph";
import styles from "@/styles/components/desktop/apps.module.css";

type GameId = "chess" | "tic80" | "dxball" | "piano";

interface GameMeta {
  id: GameId;
  icon: string;
  title: string;
  desc: string;
  accent: string;
  keys: string;
}

const GAMES: GameMeta[] = [
  {
    id: "chess",
    icon: "dices",
    title: "Chess",
    desc: "AI opponent with adjustable difficulty. Click pieces to move.",
    accent: "#5b8cff",
    keys: "Click to move",
  },
  {
    id: "dxball",
    icon: "pinball",
    title: "DX-Ball",
    desc: "Classic breakout — break all the bricks with a bouncing ball.",
    accent: "#ff9f0a",
    keys: "Mouse to move paddle",
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
  if (active === "tic80")
    return <Tic80Game onExit={() => setActive(null)} />;
  if (active === "dxball")
    return <DxBallGame onExit={() => setActive(null)} />;
  if (active === "piano")
    return (
      <div className={styles.gameShell} data-game="piano">
        <div className={styles.gameWebFrame}>
          <iframe
            src="https://online-piano-two.vercel.app"
            title="Piano"
            className={styles.gameWebIframe}
            loading="lazy"
            allow="autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>
    );

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
