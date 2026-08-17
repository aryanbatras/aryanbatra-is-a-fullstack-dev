"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import ChessGame from "@/components/desktop/apps/ChessGame";
import Quake3Game from "@/components/desktop/apps/Quake3Game";
import SpaceCadetGame from "@/components/desktop/apps/SpaceCadetGame";
import ClassiCubeGame from "@/components/desktop/apps/ClassiCubeGame";
import Tic80Game from "@/components/desktop/apps/Tic80Game";
import DxBallGame from "@/components/desktop/apps/DxBallGame";
import Glyph from "@/components/desktop/Glyph";
import styles from "@/styles/components/desktop/apps.module.css";

type GameId = "chess" | "pinball" | "quake3" | "classicube" | "tic80" | "dxball" | "piano";

interface GameMeta {
  id: GameId;
  icon: string;
  title: string;
  desc: string;
  accent: string;
  keys: string;
}

/** The full WASM games, ported from the daedalOS machine — real compiled
 *  games, not remakes. Download once, then they boot instantly. */
const FULL_GAMES: GameMeta[] = [
  {
    id: "chess",
    icon: "dices",
    title: "Chess — AI / 2P / Watch",
    desc: "Play the real Stockfish engine at any skill, a friend on the same board, or watch CPU vs CPU.",
    accent: "#5b8cff",
    keys: "Click to move",
  },
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
  {
    id: "classicube",
    icon: "gamepad",
    title: "ClassiCube",
    desc: "Minecraft Classic-compatible client — dig, build and wander a singleplayer world.",
    accent: "#5ad96c",
    keys: "WASD + mouse",
  },
  {
    id: "tic80",
    icon: "emulator",
    title: "TIC-80",
    desc: "The fantasy computer — a tiny retro console for playing (and making) Lua games.",
    accent: "#ffec27",
    keys: "Arrow keys + Z/X",
  },
  {
    id: "dxball",
    icon: "pinball",
    title: "DX-Ball",
    desc: "The classic break-out block breaker — 60 levels of bouncing balls and brick walls.",
    accent: "#ff9f0a",
    keys: "Mouse + click",
  },
];

/** Live project sites that allow embedding — playable right inside the app. */
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

/** A live project site in its OWN maximized window (macOS Tahoe style). */
export function WebPlayGame({ url, onExit }: { url?: string; onExit: () => void }) {
  const u = url || "https://online-piano-two.vercel.app";
  return (
    <div className={styles.gameShell} data-game="webplay">
      <div className={styles.gameWebFrame}>
        <iframe
          src={u}
          title="Project"
          className={styles.gameWebIframe}
          loading="lazy"
          allow="autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}

/** A live site embedded directly — the browser within the arcade. */
function WebPlay({ url, title, icon, onExit }: { url: string; title: string; icon: string; onExit: () => void }) {
  return (
    <div className={styles.gameShell} data-game="webplay">
      <div className={styles.gameBar}>
        <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to games">
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

interface GamesAppProps {
  /** Auto-start a specific game (e.g. chess when a .pgn is opened from Finder). */
  initialGame?: GameId;
  /** PGN file name to review in chess (loaded from Finder storage). */
  pgnName?: string;
  /** PGN source text (falls back to a storage lookup by name). */
  pgnContent?: string;
  /** macOS Tahoe: picking a game opens it in its OWN maximized window with
   *  the standard titlebar (3 traffic lights) — never inline in the launcher. */
  onLaunchGame: (gameId: GameId, title: string, url?: string) => void;
}

/** Games — a curated set of real, playable titles: WASM ports and live
 *  projects. No throwaway canvas remakes. Each game opens in its own
 *  maximized window (onLaunchGame), so play fills the screen. */
export default function GamesApp({ initialGame, pgnName, pgnContent, onLaunchGame }: GamesAppProps) {
  const [active, setActive] = useState<GameId | null>(initialGame ?? null);
  const [webPlay, setWebPlay] = useState<(typeof LIVE_PLAYS)[number] | null>(null);

  const launch = (id: GameId, title: string, url?: string) => {
    setActive(null);
    setWebPlay(null);
    onLaunchGame(id, title, url);
  };

  if (webPlay) return <WebPlay url={webPlay.url} title={webPlay.title} icon={webPlay.icon} onExit={() => setWebPlay(null)} />;
  if (active === "chess")
    return (
      <ChessGame onExit={() => setActive(null)} pgnName={pgnName} pgnContent={pgnContent} />
    );
  if (active === "pinball") return <SpaceCadetGame onExit={() => setActive(null)} />;
  if (active === "quake3") return <Quake3Game onExit={() => setActive(null)} />;
  if (active === "classicube") return <ClassiCubeGame onExit={() => setActive(null)} />;
  if (active === "tic80") return <Tic80Game onExit={() => setActive(null)} />;
  if (active === "dxball") return <DxBallGame onExit={() => setActive(null)} />;
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
          <h3 className={styles.gameLauncherTitle}>Games</h3>
          <p className={styles.gameLauncherSub}>
            Real compiled games — WASM ports of the classics, plus my live projects.
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

      <header className={styles.arcadeHeader} style={{ marginTop: 26 }}>
        <span className={styles.arcadeMark}>
          <Glyph id="globe" size={16} />
        </span>
        <div>
          <h3 className={styles.gameLauncherTitle}>Live Projects</h3>
          <p className={styles.gameLauncherSub}>My real, deployed projects — playable right here.</p>
        </div>
      </header>

      <div className={styles.gameLauncherGrid}>
        {LIVE_PLAYS.map((g) => (
          <button
            key={g.url}
            type="button"
            className={styles.gameCard}
            style={{ "--accent": "#64d2ff" } as React.CSSProperties}
            onClick={() => launch("piano", g.title, g.url)}
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
