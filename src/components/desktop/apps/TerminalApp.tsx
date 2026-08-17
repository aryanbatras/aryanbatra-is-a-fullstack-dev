import { useEffect, useRef, useState } from "react";
import { DESKTOP_APPS, TERMINAL_COMMANDS } from "@/constants/desktop";
import { spawnSheep } from "@/utils/sheep";
import { getPyodide, runPython } from "@/utils/pyodide";
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
  monaco: "monaco",
  code: "monaco",
  tinymce: "tinymce",
  irc: "irc",
  tic80: "tic80",
  classicube: "classicube",
  boxedwine: "boxedwine",
  wine: "boxedwine",
  v86: "v86",
  vm: "v86",
  messenger: "messenger",
  nostr: "messenger",
};

interface Line {
  text: string;
  prompt?: boolean;
  error?: boolean;
}

/* ----- macOS Tahoe Terminal refresh: 24-bit ANSI colour rendering. ----- */

interface AnsiSpan {
  text: string;
  fg?: string;
  bg?: string;
  bold?: boolean;
  underline?: boolean;
}

const ANSI_RE =
  /\u001b\[(\d+(?:;\d+)*)m/g;

/** Parse an ANSI SGR stream into plain spans with inline styles (24-bit). */
function parseAnsi(text: string): AnsiSpan[] {
  const out: AnsiSpan[] = [];
  let last = 0;
  let fg: string | undefined;
  let bg: string | undefined;
  let bold = false;
  let underline = false;
  let m: RegExpExecArray | null;
  let current = "";
  const flush = () => {
    if (current) {
      out.push({ text: current, fg, bg, bold, underline });
      current = "";
    }
  };
  const reset = () => {
    flush();
    fg = undefined;
    bg = undefined;
    bold = false;
    underline = false;
  };
  ANSI_RE.lastIndex = 0;
  while ((m = ANSI_RE.exec(text)) !== null) {
    current += text.slice(last, m.index);
    const codes = m[1].split(";").map(Number);
    for (let i = 0; i < codes.length; i++) {
      const c = codes[i];
      if (c === 0) {
        reset();
      } else if (c === 1) {
        flush();
        bold = true;
      } else if (c === 4) {
        flush();
        underline = true;
      } else if (c === 22) {
        flush();
        bold = false;
      } else if (c === 24) {
        flush();
        underline = false;
      } else if (c >= 30 && c <= 37) {
        flush();
        fg = ["#1a1a1a", "#cc0000", "#4e9a06", "#c4a000", "#3465a4", "#75507b", "#06989a", "#d3d7cf"][c - 30];
      } else if (c >= 90 && c <= 97) {
        flush();
        fg = ["#555753", "#ef2929", "#8ae234", "#fce94f", "#729fcf", "#ad7fa8", "#34e2e2", "#eeeeec"][c - 90];
      } else if (c === 38 || c === 48) {
        // 38;5;n (256-colour) or 38;2;r;g;b (24-bit true colour).
        const isFg = c === 38;
        const next = codes[i + 1];
        if (next === 5 && codes[i + 2] !== undefined) {
          const n = codes[i + 2];
          const hex = n < 16 ? ANSI_REBASED[n] : n < 232 ? cubeToHex(n) : grayToHex(n);
          flush();
          if (isFg) fg = hex;
          else bg = hex;
          i += 2;
        } else if (next === 2 && codes[i + 4] !== undefined) {
          const hex = `#${codes[i + 2].toString(16).padStart(2, "0")}${codes[i + 3]
            .toString(16)
            .padStart(2, "0")}${codes[i + 4].toString(16).padStart(2, "0")}`;
          flush();
          if (isFg) fg = hex;
          else bg = hex;
          i += 4;
        }
      } else if (c === 39) {
        flush();
        fg = undefined;
      } else if (c === 49) {
        flush();
        bg = undefined;
      }
    }
    last = ANSI_RE.lastIndex;
  }
  current += text.slice(last);
  flush();
  return out;
}

const ANSI_REBASED: string[] = [
  "#000000", "#cc0000", "#4e9a06", "#c4a000", "#3465a4", "#75507b", "#06989a", "#d3d7cf",
  "#555753", "#ef2929", "#8ae234", "#fce94f", "#729fcf", "#ad7fa8", "#34e2e2", "#eeeeec",
];

function cubeToHex(n: number): string {
  const cube = n - 16;
  const r = Math.floor(cube / 36);
  const g = Math.floor((cube % 36) / 6);
  const b = cube % 6;
  const val = (v: number) => [0, 95, 135, 175, 215, 255][v];
  return `#${val(r).toString(16).padStart(2, "0")}${val(g).toString(16).padStart(2, "0")}${val(b)
    .toString(16)
    .padStart(2, "0")}`;
}

function grayToHex(n: number): string {
  const v = 8 + (n - 232) * 10;
  return `#${v.toString(16).padStart(2, "0")}${v.toString(16).padStart(2, "0")}${v.toString(16).padStart(2, "0")}`;
}

/** Render a possibly-ANSI string as coloured <span>s. */
function AnsiText({ text }: { text: string }) {
  if (!text.includes("\u001b")) return <>{text}</>;
  const spans = parseAnsi(text);
  return (
    <>
      {spans.map((s, i) => (
        <span
          key={i}
          style={{
            color: s.fg,
            backgroundColor: s.bg,
            fontWeight: s.bold ? 700 : undefined,
            textDecoration: s.underline ? "underline" : undefined,
          }}
        >
          {s.text}
        </span>
      ))}
    </>
  );
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
    // Tahoe Terminal: green-on-black rain, 24-bit colour.
    const chars = "アイウエオカキクケコサシスセソ01ABCDEF";
    const rows = Array.from({ length: 10 }, () =>
      Array.from({ length: 34 }, () => {
        const c = chars[Math.floor(Math.random() * chars.length)];
        const bright = Math.random() < 0.18;
        return (Math.random() < 0.12 ? " " : c)
          .replace(/./, (ch) =>
            ch === " " ? " " : `\u001b[38;2;${bright ? "0;255;90" : "0;170;60"}m${ch}`,
          );
      }).join(""),
    );
    push({ text: rows.join("\n") });
  };

  const cmdBanner = (text: string) => {
    if (!text) {
      push({ text: "usage: banner <text>", error: true });
      return;
    }
    // Tahoe Terminal: a cyan 24-bit banner.
    const inner = ` ${text} `;
    const border = "─".repeat(inner.length);
    const line = (s: string) => `\u001b[38;2;102;217;255m${s}\u001b[0m`;
    push({ text: `${line(`┌${border}┐`)}\n${line(`│${inner}│`)}\n${line(`└${border}┘`)}` });
  };

  const cmdSudo = () => {
    push({ text: "aryan is not in the sudoers file. This incident will be reported.", error: true });
  };

  /** Real Python 3 (Pyodide) — served locally, ported from daedalOS. */
  const pythonBooted = useRef(false);
  const cmdPython = async (code: string) => {
    if (!pythonBooted.current) {
      push({ text: "python: booting Pyodide (a real CPython 3 interpreter in the browser)…" });
      try {
        await getPyodide();
        pythonBooted.current = true;
      } catch {
        push({ text: "python: failed to boot Pyodide.", error: true });
        return;
      }
    }
    if (!code) {
      push({
        text:
          "usage: python <code> — e.g. python 2+2, python 'print(1+1)', python version",
      });
      return;
    }
    await runPython(code, (out) => push({ text: out }));
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
    // eSheep — daedalOS's desktop pet (also in the Run dialog / context menu).
    if (name === "sheep" || name === "esheep") {
      setLines(next);
      spawnSheep(true)
        .then(() =>
          push({ text: "A sheep has joined your desktop. Right-click the desktop for more." }),
        )
        .catch(() => push({ text: "eSheep failed to load.", error: true }));
      return;
    }
    // Python 3 (Pyodide) — a real interpreter, ported from daedalOS.
    if (name === "python" || name === "python3" || name === "py") {
      setLines(next);
      cmdPython(headCmd.split(/\s+/).slice(1).join(" "));
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
            <AnsiText text={l.text} />
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
