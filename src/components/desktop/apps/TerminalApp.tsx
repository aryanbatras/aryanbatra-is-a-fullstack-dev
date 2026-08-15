import { useEffect, useRef, useState } from "react";
import { TERMINAL_COMMANDS } from "@/constants/desktop";
import useSystemInfo from "@/hooks/useSystemInfo";
import styles from "@/styles/components/desktop/apps.module.css";

const PROMPT = "aryan@macbook ~ %";

export default function TerminalApp() {
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

  const [lines, setLines] = useState<{ text: string; prompt?: boolean; error?: boolean }[]>([
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

  const run = (raw: string) => {
    const cmd = raw.trim();
    const next: { text: string; prompt?: boolean; error?: boolean }[] = [
      ...lines,
      { text: `${PROMPT} ${raw}`, prompt: true },
    ];
    if (cmd === "") {
      setLines(next);
      return;
    }
    const name = cmd.split(/\s+/)[0];
    if (name === "history") {
      next.push({
        text: history.length
          ? history.map((h, i) => `  ${i + 1}  ${h}`).join("\n")
          : "No commands yet.",
      });
      setLines(next);
      return;
    }
    const found = TERMINAL_COMMANDS.find((c) => c.name === name);
    if (!found) {
      next.push({ text: `zsh: command not found: ${name} — try 'help'`, error: true });
    } else {
      const out = found.run(cmd, sys);
      if (out === "__CLEAR__") {
        setLines([]);
        return;
      }
      next.push({ text: out });
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
    <div className={styles.terminal} onClick={() => inputRef.current?.focus()}>
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
