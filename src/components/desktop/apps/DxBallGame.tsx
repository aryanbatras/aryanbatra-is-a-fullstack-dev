"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

declare global {
  interface Window {
    DXBall?: {
      basePath: string;
      close: () => void;
      init: (
        loadedFunction: () => void,
        saveFunction: (name: string, score: string) => string,
      ) => void;
      intervals: number[];
      timeouts: number[];
      audioFiles: Record<string, HTMLAudioElement>;
      audioTracks: HTMLAudioElement[];
      saveRecords?: (name: string, score: string) => string;
      status: string;
    };
  }
}

const SAVE_KEY = "aryan.dxball.records";

interface DxBallGameProps {
  onExit: () => void;
  /** Full-window mode: standard macOS titlebar is the chrome. */
  fullWindow?: boolean;
}

/** DX-Ball — the classic block-breaker, ported straight from daedalOS. */
export default function DxBallGame({ onExit, fullWindow }: DxBallGameProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // daedalOS loads game.js directly and lets it attach window.DXBall.
    const script = document.createElement("script");
    script.src = "/aryan/apps/dxball/game.js";
    script.onload = () => {
      if (cancelled) return;
      // Top-10 high scores persisted to localStorage (our Finder equivalent).
      window.DXBall?.init(
        () => setLoading(false),
        (name, score) => {
          let records = "";
          try {
            records = localStorage.getItem(SAVE_KEY) || "";
          } catch {
            // ignore storage errors
          }
          const sorted = [...records.split("\r").filter(Boolean), `&${score}&${name}`]
            .map((line) => line.split("&"))
            .sort(([, a], [, b]) => Number(b) - Number(a))
            .slice(0, 10)
            .map(([, s, n], i) => `${i + 1}&${s}&${n}`)
            .join("\r");
          try {
            localStorage.setItem(SAVE_KEY, sorted);
          } catch {
            // ignore storage errors
          }
          return `${sorted}\r`;
        },
      );
    };
    script.onerror = () => setLoading(false);
    mountRef.current?.appendChild(script);

    return () => {
      cancelled = true;
      window.DXBall?.close();
      window.DXBall?.intervals.forEach((t) => window.clearInterval(t));
      window.DXBall?.timeouts.forEach((t) => window.clearTimeout(t));
      script.remove();
      // Clear the game's globals like daedalOS does, so remounts start clean.
      for (const g of [
        "DXBall", "audioName", "i", "source", "game", "soundon", "saveron",
        "myFonts", "font", "animframe", "color", "FontList", "lFile", "canvas",
        "ctx", "file", "c", "descender", "temp", "cl", "user", "paus", "paused",
        "naudio", "nflash", "audio", "balls", "bricks", "bullets", "bang",
        "flash", "records", "lightning", "shadow", "chcur", "highscore",
        "saver", "y", "x", "mouse", "paddle", "bonus", "requestAnimFrame",
        "curX", "j", "height", "xp", "yp", "vm",
      ]) {
        try {
          delete (window as unknown as Record<string, unknown>)[g];
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div className={`${styles.gameShell} ${fullWindow ? styles.gameFullWindow : ""}`} data-game="dxball">
      {!fullWindow && (
        <div className={styles.gameBar}>
          <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to games">
            <ArrowLeft size={14} />
          </button>
          <strong>DX-Ball</strong>
          <em className={styles.gameBarHint}>Mouse to move · click to launch</em>
        </div>
      )}
      <div className={styles.gameEmuFrame}>
        {loading && (
          <div className={styles.gameEmuLoading}>
            Booting DX-Ball…
            <em>Ported from the daedalOS machine</em>
          </div>
        )}
        <div ref={mountRef} className={styles.dxballMount}>
          <canvas id="dx-ball" />
        </div>
      </div>
    </div>
  );
}
