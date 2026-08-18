"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Terminal Emulator — full terminal using xterm.js.
 * Fake filesystem with commands like ls, cd, cat, mkdir, etc.
 * CDN: @xterm/xterm@5.5.0 via jsDelivr
 */

type TerminalInstance = {
  open: (container: HTMLElement) => void;
  write: (data: string) => void;
  onData: (callback: (data: string) => void) => { dispose: () => void };
  resize: (cols: number, rows: number) => void;
  loadAddon: (addon: any) => void;
  dispose: () => void;
};

declare global {
  interface Window {
    Terminal?: new (options?: Record<string, unknown>) => TerminalInstance;
  }
}

interface FileSystemNode {
  type: "file" | "directory";
  content?: string;
  children?: Record<string, FileSystemNode>;
}

const INITIAL_FS: Record<string, FileSystemNode> = {
  home: {
    type: "directory",
    children: {
      user: {
        type: "directory",
        children: {
          documents: {
            type: "directory",
            children: {
              "readme.txt": { type: "file", content: "Welcome to Aryan OS Terminal!\nType 'help' to see available commands." },
              "notes.md": { type: "file", content: "# Notes\n\n- Learn WASM\n- Build cool stuff\n- Ship fast" },
            },
          },
          projects: {
            type: "directory",
            children: {
              "app.js": { type: "file", content: "console.log('Hello from Aryan OS!');" },
              "style.css": { type: "file", content: "body { font-family: monospace; }" },
            },
          },
          ".bashrc": { type: "file", content: "# Aryan OS Terminal\nexport PS1='\\u@aryan-os:\\w$ '" },
        },
      },
    },
  },
  etc: {
    type: "directory",
    children: {
      "hostname": { type: "file", content: "aryan-os" },
      "motd": { type: "file", content: "Welcome to Aryan OS Terminal Emulator" },
    },
  },
  tmp: { type: "directory", children: {} },
};

export default function TerminalEmulatorApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<TerminalInstance | null>(null);
  const fsRef = useRef<Record<string, FileSystemNode>>(JSON.parse(JSON.stringify(INITIAL_FS)));
  const cwdRef = useRef("/home/user");
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [status, setStatus] = useState("Loading xterm.js…");

  const resolvePath = (path: string): { parent: Record<string, FileSystemNode>; name: string } | null => {
    const parts = path.split("/").filter(Boolean);
    let current: Record<string, FileSystemNode> = fsRef.current;

    for (let i = 0; i < parts.length - 1; i++) {
      const node = current[parts[i]];
      if (!node || node.type !== "directory") return null;
      current = node.children ?? {};
    }

    return { parent: current, name: parts[parts.length - 1] ?? "" };
  };

  const getNode = (path: string): FileSystemNode | null => {
    const parts = path.split("/").filter(Boolean);
    let current: Record<string, FileSystemNode> = fsRef.current;

    for (const part of parts) {
      const node = current[part];
      if (!node) return null;
      if (node.type === "directory") {
        current = node.children ?? {};
      } else if (part === parts[parts.length - 1]) {
        return node;
      }
    }
    return { type: "directory", children: current };
  };

  const executeCommand = useCallback((input: string, terminal: TerminalInstance): string => {
    const trimmed = input.trim();
    if (!trimmed) return "";

    historyRef.current.push(trimmed);
    historyIndexRef.current = historyRef.current.length;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case "help":
        return `Available commands:
  ls [path]       List directory contents
  cd <path>       Change directory
  pwd             Print working directory
  cat <file>      Display file contents
  mkdir <name>    Create directory
  touch <name>    Create empty file
  rm <name>       Remove file
  echo <text>     Print text
  clear           Clear terminal
  history         Show command history
  whoami          Show current user
  hostname        Show hostname
  date            Show current date
  uptime          Show uptime
  neofetch        System information
  help            Show this help`;

      case "ls": {
        const target = args[0] ? (args[0].startsWith("/") ? args[0] : `${cwdRef.current}/${args[0]}`) : cwdRef.current;
        const node = getNode(target);
        if (!node || node.type !== "directory") return `ls: cannot access '${args[0] || target}': Not a directory`;
        const entries = Object.entries(node.children ?? {});
        return entries.map(([name, n]) => `${n.type === "directory" ? "\x1b[1;34m" : ""}${name}\x1b[0m`).join("  ");
      }

      case "cd": {
        if (!args[0] || args[0] === "~") {
          cwdRef.current = "/home/user";
          return "";
        }
        const newPath = args[0].startsWith("/") ? args[0] : `${cwdRef.current}/${args[0]}`;
        const node = getNode(newPath);
        if (!node || node.type !== "directory") return `cd: no such file or directory: ${args[0]}`;
        cwdRef.current = newPath.replace(/\/+/g, "/");
        return "";
      }

      case "pwd":
        return cwdRef.current;

      case "cat": {
        if (!args[0]) return "cat: missing file operand";
        const filePath = args[0].startsWith("/") ? args[0] : `${cwdRef.current}/${args[0]}`;
        const node = getNode(filePath);
        if (!node) return `cat: ${args[0]}: No such file or directory`;
        if (node.type === "directory") return `cat: ${args[0]}: Is a directory`;
        return node.content ?? "";
      }

      case "mkdir": {
        if (!args[0]) return "mkdir: missing operand";
        const dirPath = args[0].startsWith("/") ? args[0] : `${cwdRef.current}/${args[0]}`;
        const resolved = resolvePath(dirPath);
        if (!resolved) return `mkdir: cannot create directory '${args[0]}'`;
        resolved.parent[resolved.name] = { type: "directory", children: {} };
        return "";
      }

      case "touch": {
        if (!args[0]) return "touch: missing operand";
        const filePath = args[0].startsWith("/") ? args[0] : `${cwdRef.current}/${args[0]}`;
        const resolved = resolvePath(filePath);
        if (!resolved) return `touch: cannot create file '${args[0]}'`;
        if (!resolved.parent[resolved.name]) {
          resolved.parent[resolved.name] = { type: "file", content: "" };
        }
        return "";
      }

      case "rm": {
        if (!args[0]) return "rm: missing operand";
        const filePath = args[0].startsWith("/") ? args[0] : `${cwdRef.current}/${args[0]}`;
        const resolved = resolvePath(filePath);
        if (!resolved || !resolved.parent[resolved.name]) return `rm: cannot remove '${args[0]}': No such file or directory`;
        delete resolved.parent[resolved.name];
        return "";
      }

      case "echo":
        return args.join(" ");

      case "clear":
        terminal.write("\x1b[2J\x1b[H");
        return "";

      case "history":
        return historyRef.current.map((h, i) => `  ${i + 1}  ${h}`).join("\n");

      case "whoami":
        return "user";

      case "hostname":
        return "aryan-os";

      case "date":
        return new Date().toString();

      case "uptime":
        return `up ${Math.floor((Date.now() - (window as any).__startTime) / 1000)} seconds`;

      case "neofetch":
        return `
\x1b[1;36m    _   ___  ____
\x1b[1;36m   / | / / / / /
\x1b[1;36m  /  |/ / / / /
\x1b[1;36m / /|  / /_/ /
\x1b[1;36m/_/ |_/\\____/
\x1b[0m
\x1b[1;33mOS:\x1b[0m Aryan OS Terminal
\x1b[1;33mHost:\x1b[0m Browser
\x1b[1;33mKernel:\x1b[0m xterm.js ${"5.5.0"}
\x1b[1;33mShell:\x1b[0m FakeShell 1.0
\x1b[1;33mTerminal:\x1b[0m xterm.js
\x1b[1;33mCPU:\x1b[0m WebAssembly
\x1b[1;33mMemory:\x1b[0m Unlimited
\x1b[1;33mUptime:\x1b[0m ${Math.floor((Date.now() - (window as any).__startTime) / 1000)}s`;

      default:
        return `bash: ${cmd}: command not found`;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // Load xterm.js
        const xtermScript = document.createElement("script");
        xtermScript.src = "https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.js";
        await new Promise<void>((resolve, reject) => {
          xtermScript.onload = () => resolve();
          xtermScript.onerror = () => reject(new Error("Failed to load xterm.js"));
          document.head.appendChild(xtermScript);
        });

        // Load fit addon
        const fitScript = document.createElement("script");
        fitScript.src = "https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.js";
        await new Promise<void>((resolve, reject) => {
          fitScript.onload = () => resolve();
          fitScript.onerror = () => reject(new Error("Failed to load fit addon"));
          document.head.appendChild(fitScript);
        });

        if (!alive || !window.Terminal) return;

        const terminal = new window.Terminal({
          theme: {
            background: "#0d0d1a",
            foreground: "#e0e0e0",
            cursor: "#3b82f6",
            cursorAccent: "#0d0d1a",
            selectionBackground: "#3b82f644",
            black: "#1a1a2e",
            red: "#ff6b6b",
            green: "#10b981",
            yellow: "#fbbf24",
            blue: "#3b82f6",
            magenta: "#8b5cf6",
            cyan: "#06b6d4",
            white: "#e0e0e0",
          },
          fontFamily: "'SF Mono', 'JetBrains Mono', Menlo, monospace",
          fontSize: 13,
          cursorBlink: true,
          cursorStyle: "bar",
        });

        terminalRef.current = terminal;
        (window as any).__startTime = Date.now();

        if (containerRef.current) {
          terminal.open(containerRef.current);

          // Fit to container
          try {
            const FitAddonNS = (window as any).FitAddon;
            const fitAddon = FitAddonNS ? new FitAddonNS.FitAddon() : null;
            if (fitAddon) {
              terminal.loadAddon(fitAddon);
              fitAddon.fit();
            }
          } catch {
            // Fit addon not available
          }

          // Welcome message
          terminal.write("\x1b[1;36mAryan OS Terminal Emulator\x1b[0m\r\n");
          terminal.write("Type 'help' for available commands\r\n\r\n");
          terminal.write(`\x1b[1;33muser@aryan-os\x1b[0m:\x1b[1;34m${cwdRef.current}\x1b[0m$ `);

          // Handle input
          let currentLine = "";
          terminal.onData((data: string) => {
            if (data === "\r") {
              // Enter
              terminal.write("\r\n");
              if (currentLine.trim()) {
                const output = executeCommand(currentLine, terminal);
                if (output) terminal.write(output + "\r\n");
              }
              currentLine = "";
              terminal.write(`\x1b[1;33muser@aryan-os\x1b[0m:\x1b[1;34m${cwdRef.current}\x1b[0m$ `);
            } else if (data === "\x7f") {
              // Backspace
              if (currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1);
                terminal.write("\b \b");
              }
            } else if (data === "\x1b[A") {
              // Up arrow - history
              if (historyIndexRef.current > 0) {
                historyIndexRef.current--;
                const cmd = historyRef.current[historyIndexRef.current];
                terminal.write("\r\x1b[K");
                terminal.write(`\x1b[1;33muser@aryan-os\x1b[0m:\x1b[1;34m${cwdRef.current}\x1b[0m$ ${cmd}`);
                currentLine = cmd;
              }
            } else if (data === "\x1b[B") {
              // Down arrow - history
              if (historyIndexRef.current < historyRef.current.length - 1) {
                historyIndexRef.current++;
                const cmd = historyRef.current[historyIndexRef.current];
                terminal.write("\r\x1b[K");
                terminal.write(`\x1b[1;33muser@aryan-os\x1b[0m:\x1b[1;34m${cwdRef.current}\x1b[0m$ ${cmd}`);
                currentLine = cmd;
              } else {
                historyIndexRef.current = historyRef.current.length;
                terminal.write("\r\x1b[K");
                terminal.write(`\x1b[1;33muser@aryan-os\x1b[0m:\x1b[1;34m${cwdRef.current}\x1b[0m$ `);
                currentLine = "";
              }
            } else if (data === "\t") {
              // Tab completion
              const parts = currentLine.split(/\s+/);
              const last = parts[parts.length - 1] || "";
              const dirPath = cwdRef.current;
              const node = getNode(dirPath);
              if (node?.type === "directory" && node.children) {
                const matches = Object.keys(node.children).filter((n) => n.startsWith(last));
                if (matches.length === 1) {
                  parts[parts.length - 1] = matches[0];
                  currentLine = parts.join(" ");
                  terminal.write("\r\x1b[K");
                  terminal.write(`\x1b[1;33muser@aryan-os\x1b[0m:\x1b[1;34m${cwdRef.current}\x1b[0m$ ${currentLine}`);
                }
              }
            } else if (data >= " ") {
              // Printable character
              currentLine += data;
              terminal.write(data);
            }
          });
        }

        setStatus("Terminal ready");
      } catch {
        if (alive) setStatus("Failed to load xterm.js");
      }
    };

    void load();
    return () => {
      alive = false;
      terminalRef.current?.dispose();
    };
  }, [executeCommand]);

  return (
    <div className={styles.terminalEmulator}>
      <div className={styles.pgliteToolbar}>
        <TerminalIcon size={12} />
        <span className={styles.pgliteStatus}>{status}</span>
      </div>
      <div ref={containerRef} className={styles.terminalEmulatorBody} />
    </div>
  );
}
