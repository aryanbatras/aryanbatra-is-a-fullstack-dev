"use client";

import { useEffect, useRef, useState } from "react";
import { DESKTOP_APPS } from "@/constants/desktop";
import { spawnSheep } from "@/utils/sheep";
import { sounds } from "@/utils/sounds";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

const RUN_HISTORY_KEY = "aryanos.run.history";

/** daedalOS's Run aliases — type `cmd`, `explorer`, `mspaint` and it opens. */
const APP_ALIASES: Record<string, string> = {
  cmd: "terminal",
  terminal: "terminal",
  code: "monaco",
  monaco: "monaco",
  explorer: "finder",
  finder: "finder",
  mspaint: "paint",
  winamp: "webamp",
  webamp: "webamp",
  music: "webamp",
  vlc: "videos",
  chrome: "website",
  safari: "website",
  browser: "website",
  games: "games",
  chess: "games",
  classicube: "classicube",
  tic80: "tic80",
  tinymce: "tinymce",
  irc: "irc",
  boxedwine: "boxedwine",
  wine: "boxedwine",
  v86: "v86",
  virtualx86: "v86",
  vm: "v86",
  messenger: "messenger",
  nostr: "messenger",
  settings: "settings",
  notes: "notes",
  photos: "photos",
  maps: "maps",
  preview: "resume",
  resume: "resume",
  readme: "readme",
  about: "about",
  textedit: "textedit",
};

function loadHistory(): string[] {
  try {
    const raw = window.localStorage.getItem(RUN_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 12) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]) {
  try {
    window.localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
  } catch {
    // Best effort
  }
}

interface RunDialogProps {
  onClose: () => void;
  onOpenApp: (appId: string) => void;
}

/**
 * Run… — type an app's name (or a daedalOS alias like `cmd` / `explorer`)
 * and the machine opens it. The dropdown keeps recent commands, just like
 * daedalOS's Run dialog.
 */
export default function RunDialog({ onClose, onOpenApp }: RunDialogProps) {
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = () => {
    const raw = value.trim();
    if (!raw) return;
    // daedalOS special case: `esheep` / `sheep` spawn a desktop pet.
    if (/^esheep|sheep$/i.test(raw)) {
      const next = [raw, ...history.filter((h) => h !== raw)];
      setHistory(next);
      saveHistory(next);
      sounds.pop();
      spawnSheep(true).catch(() => setError("eSheep failed to load."));
      onClose();
      return;
    }
    const match = resolveApp(raw);
    if (!match) {
      setError(`“${raw}” is not an app on this machine.`);
      sounds.error();
      return;
    }
    const next = [raw, ...history.filter((h) => h !== raw)];
    setHistory(next);
    saveHistory(next);
    sounds.pop();
    onOpenApp(match);
    onClose();
  };

  return (
    <div
      className={styles.runOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.runDialog} role="dialog" aria-label="Run">
        <div className={styles.runHeader}>
          <span className={styles.runIcon} aria-hidden>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M4 5h16v14H4zM6.5 7v10h11V7h-11zm2 2h7v6h-7V9z" />
            </svg>
          </span>
          <p className={styles.runMsg}>
            Type the name of an app, and Aryan OS will open it for you.
          </p>
        </div>
        <div className={styles.runRow}>
          <label className={styles.runLabel} htmlFor="run-input">
            Open:
          </label>
          <div className={styles.runInputWrap}>
            <input
              ref={inputRef}
              id="run-input"
              className={styles.runInput}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") run();
                if (e.key === "Escape") onClose();
              }}
              placeholder="e.g. Finder, cmd, esheep, mspaint…"
              autoComplete="off"
              spellCheck={false}
              aria-label="App to open"
            />
            {history.length > 0 && (
              <select
                className={styles.runHistory}
                aria-label="Recent commands"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setValue(e.target.value);
                    setError(null);
                    inputRef.current?.focus();
                  }
                }}
              >
                <option value="" />
                {history.map((h, i) => (
                  <option key={`${h}-${i}`} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        {error && <p className={styles.runError}>{error}</p>}
        <div className={styles.runButtons}>
          <button
            type="button"
            className={`${styles.runBtn} ${styles.runBtnPrimary}`}
            onClick={run}
            disabled={!value.trim()}
          >
            OK
          </button>
          <button type="button" className={styles.runBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/** Resolve a Run command to a DESKTOP_APPS id: alias, app id, or app title. */
function resolveApp(input: string): string | null {
  const q = input.trim().toLowerCase();
  if (!q) return null;
  if (APP_ALIASES[q]) return APP_ALIASES[q];
  const byId = DESKTOP_APPS.find((a) => a.id === q);
  if (byId) return byId.id;
  const byTitle = DESKTOP_APPS.find((a) => a.title.toLowerCase() === q);
  if (byTitle) return byTitle.id;
  const byTitlePart = DESKTOP_APPS.find((a) => a.title.toLowerCase().includes(q));
  if (byTitlePart) return byTitlePart.id;
  return null;
}
