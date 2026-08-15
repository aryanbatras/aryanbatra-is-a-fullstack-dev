import { useEffect, useRef, useState } from "react";
import { DESKTOP_APPS, TERMINAL_COMMANDS } from "@/constants/desktop";
import { WEATHER_DESC } from "@/hooks/useLiveWeather";
import useSystemInfo from "@/hooks/useSystemInfo";
import styles from "@/styles/components/desktop/apps.module.css";

const PROMPT = "aryan@macbook ~ %";

/** App aliases so `open` feels natural: browser → website, safari → website… */
const APP_ALIASES: Record<string, string> = {
  browser: "website",
  safari: "website",
  portfolio: "website",
  textedit: "textedit",
  text: "textedit",
  finder: "finder",
  settings: "settings",
  systemsettings: "settings",
  notes: "notes",
  photos: "photos",
  videos: "videos",
  maps: "maps",
  games: "games",
  arcade: "games",
  paint: "paint",
  terminal: "terminal",
  about: "about",
  resume: "resume",
  projects: "projects",
  chess: "games",
  minesweeper: "games",
  tetris: "games",
};

interface Line {
  text: string;
  prompt?: boolean;
  error?: boolean;
}

interface TerminalAppProps {
  /** Launch a desktop app (used by `open` / `edit`). */
  onOpenApp?: (appId: string, src?: string, name?: string, url?: string) => void;
}

export default function TerminalApp({ onOpenApp }: TerminalAppProps) {
  // Real hardware — `uname` and `neofetch` report the visitor's actual machine.
  const sysInfo = useSystemInfo();
  const sys = {
    platform: sysInfo.platform,
    platformVersion: sysInfo.platformVersion,
    cpuCores: sysInfo.cpuCores,
    memoryGB: sysInfo.memoryGB,
    gpu: sysInfo.gpu,
    online: sysInfo.online,
    network: sysInfo.network,
    screen: { width: sysInfo.screen.width, height: sysInfo.screen.height },
  };

  const [lines, setLines] = useState<Line[]>([
    { text: "Aryan OS Terminal — type 'help' to get started." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  const push = (line: Line) => setLines((prev) => [...prev, line]);

  /* ------------------------- real command handlers ------------------------- */

  const cmdWeather = () => {
    push({ text: "weather: fetching live conditions for Jammu…" });
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=32.7266&longitude=74.857" +
      "&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto";
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        const c = d?.current;
        if (!c || typeof c.temperature_2m !== "number") {
          push({ text: "weather: no data — try again in a moment.", error: true });
          return;
        }
        const desc = WEATHER_DESC[c.weather_code] ?? { label: "Unknown", emoji: "" };
        push({
          text: [
            "weather: Jammu, India",
            `  ${desc.emoji} ${desc.label}`,
            `  ${Math.round(c.temperature_2m)}°C`,
            `  Humidity ${c.relative_humidity_2m ?? "—"}% · Wind ${c.wind_speed_10m ?? "—"} km/h`,
          ].join("\n"),
        });
      })
      .catch(() => push({ text: "weather: request failed (offline?).", error: true }));
  };

  const cmdOpen = (name: string) => {
    const key = name.toLowerCase().replace(/[\s.]/g, "");
    const alias = APP_ALIASES[key] ?? key;
    const app = DESKTOP_APPS.find((a) => a.id === alias || a.id === key);
    if (!app) {
      push({ text: `open: no app named “${name}” — try 'help'`, error: true });
      return;
    }
    onOpenApp?.(app.id);
    push({ text: `Opening ${app.title}…` });
  };

  const cmdEdit = (file: string) => {
    if (!file) {
      push({ text: "usage: edit <file> — e.g. edit notes.md", error: true });
      return;
    }
    onOpenApp?.("textedit", undefined, file);
    push({ text: `Opening ${file} in TextEdit…` });
  };

  const cmdMatrix = () => {
    const chars = "アイウエオカキクケコサシスセソ01ABCDEF";
    const rows = Array.from({ length: 10 }, () =>
      Array.from({ length: 34 }, () => {
        const c = chars[Math.floor(Math.random() * chars.length)];
        return Math.random() < 0.12 ? " " : c;
      }).join(""),
    );
    push({ text: rows.join("\n") });
  };

  const cmdBanner = (text: string) => {
    if (!text) {
      push({ text: "usage: banner <text>", error: true });
      return;
    }
    const inner = ` ${text} `;
    const border = "─".repeat(inner.length);
    push({ text: `┌${border}┐\n│${inner}│\n└${border}┘` });
  };

  const cmdSudo = () => {
    push({ text: "aryan is not in the sudoers file. This incident will be reported.", error: true });
  };

  /* ----------------------------- pipe support ----------------------------- */

  const applyPipes = (out: string, pipes: string[]): string | null => {
    let current = out;
    for (const p of pipes) {
      const parts = p.trim().split(/\s+/);
      const op = parts[0];
      if (op === "grep" && parts[1]) {
        current = current
          .split("\n")
          .filter((l) => l.toLowerCase().includes(parts.slice(1).join(" ").toLowerCase()))
          .join("\n");
      } else if (op === "head") {
        const n = parts[1]?.startsWith("-") ? Number(parts[1].slice(1)) : 5;
        current = current.split("\n").slice(0, Number.isFinite(n) ? n : 5).join("\n");
      } else if (op === "wc") {
        const count = current === "" ? 0 : current.split("\n").length;
        current = String(count);
      } else {
        return `pipe: unknown filter “${op}” — try grep, head or wc`;
      }
    }
    return current;
  };

  /* --------------------------------- run --------------------------------- */

  const run = (raw: string) => {
    const cmd = raw.trim();
    const next: Line[] = [...lines, { text: `${PROMPT} ${raw}`, prompt: true }];

    // Split off pipes: `projects | grep AI`
    const segments = cmd.split("|").map((s) => s.trim());
    const headCmd = segments[0];
    const pipes = segments.slice(1);

    if (headCmd === "") {
      setLines(next);
      return;
    }
    const name = headCmd.split(/\s+/)[0];

    // Shell-level commands (need access to the app launcher / async output).
    if (name === "weather") {
      setLines(next);
      cmdWeather();
      return;
    }
    if (name === "open") {
      setLines(next);
      cmdOpen(headCmd.split(/\s+/).slice(1).join(" "));
      return;
    }
    if (name === "edit") {
      setLines(next);
      cmdEdit(headCmd.split(/\s+/).slice(1).join(" "));
      return;
    }
    if (name === "matrix") {
      setLines(next);
      cmdMatrix();
      return;
    }
    if (name === "banner") {
      setLines(next);
      cmdBanner(headCmd.split(/\s+/).slice(1).join(" "));
      return;
    }
    if (name === "sudo") {
      setLines(next);
      cmdSudo();
      return;
    }

    // Regular commands (with pipe support).
    const found = TERMINAL_COMMANDS.find((c) => c.name === name);
    if (!found) {
      next.push({ text: `zsh: command not found: ${name} — try 'help'`, error: true });
    } else {
      const out = found.run(headCmd, sys);
      if (out === "__CLEAR__") {
        setLines([]);
        return;
      }
      if (pipes.length > 0) {
        const piped = applyPipes(out, pipes);
        next.push({ text: piped === null ? "" : piped, error: piped?.startsWith("pipe:") });
      } else {
        next.push({ text: out });
      }
    }
    setLines(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (!input.trim()) return;
      run(input);
      setHistory((h) => [...h, input]);
      setHistIndex(-1);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = histIndex === -1 ? history.length - 1 : Math.max(0, histIndex - 1);
      setHistIndex(idx);
      setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIndex === -1) return;
      const idx = histIndex + 1;
      if (idx >= history.length) {
        setHistIndex(-1);
        setInput("");
      } else {
        setHistIndex(idx);
        setInput(history[idx]);
      }
    } else if (e.key === "Tab") {
      // Tab autocompletes a command name (like zsh)
      e.preventDefault();
      const name = input.trim().split(/\s+/)[0].toLowerCase();
      if (!name) return;
      const matches = TERMINAL_COMMANDS.filter((c) =>
        c.name.startsWith(name),
      );
      if (matches.length === 1) setInput(`${matches[0].name} `);
    }
  };

  return (
    <div
      className={styles.terminal}
      data-shell="terminal"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={bodyRef} className={styles.terminalBody}>
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.prompt
                ? styles.termLinePrompt
                : l.error
                  ? styles.termError
                  : styles.termLine
            }
          >
            {l.text}
          </div>
        ))}
        <div className={styles.termInputLine}>
          <span className={styles.termPrompt}>{PROMPT}</span>
          <input
            ref={inputRef}
            className={styles.termInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
