"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";
import { vfs } from "@/utils/vfs";

/**
 * TermuxApp — full client-side Termux environment.
 * Persistent filesystem (IndexedDB), 30+ commands, package manager,
 * Python via Pyodide, real git simulation, process management.
 */

declare global {
  interface Window {
    Terminal?: any;
    FitAddon?: any;
    WebglAddon?: any;
  }
}

type CommandHandler = (args: string[], ctx: ShellContext) => string | Promise<string>;

interface ShellContext {
  cwd: string;
  setCwd: (path: string) => void;
  env: Record<string, string>;
  history: string[];
  addHistory: (cmd: string) => void;
  write: (data: string) => void;
  installedPkgs: Set<string>;
  startTime: number;
}

// ============================================================
// Package catalog
// ============================================================
const PACKAGES: Record<string, { desc: string; size: string; deps?: string[]; cdn?: string }> = {
  python: { desc: "Python 3.12 runtime via Pyodide", size: "13MB", cdn: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js" },
  "python-numpy": { desc: "NumPy numerical computing", size: "8MB", deps: ["python"] },
  "python-pandas": { desc: "Pandas data analysis", size: "5MB", deps: ["python"] },
  git: { desc: "Git version control (simulation)", size: "0.1MB" },
  curl: { desc: "HTTP client (browser fetch)", size: "0.0MB" },
  wget: { desc: "File downloader (browser fetch)", size: "0.0MB" },
  grep: { desc: "Pattern matching", size: "0.0MB" },
  sed: { desc: "Stream editor", size: "0.0MB" },
  awk: { desc: "Text processing", size: "0.0MB" },
  jq: { desc: "JSON processor", size: "0.0MB" },
  tree: { desc: "Directory tree viewer", size: "0.0MB" },
  vim: { desc: "Vim text editor (basic)", size: "0.0MB" },
  nano: { desc: "Nano text editor (basic)", size: "0.0MB" },
  htop: { desc: "Process monitor", size: "0.0MB" },
  neofetch: { desc: "System info display", size: "0.0MB" },
  figlet: { desc: "ASCII art text", size: "0.0MB" },
  calc: { desc: "Calculator", size: "0.0MB" },
  ffmpeg: { desc: "Media processing (browser WASM)", size: "30MB", cdn: "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js" },
  "gcc-lite": { desc: "C compiler (esbuild WASM)", size: "10MB", cdn: "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.28.1" },
  nodejs: { desc: "Node.js runtime (via esbuild)", size: "5MB" },
};

const INSTALLED_BY_DEFAULT = new Set(["grep", "sed", "awk", "jq", "tree", "curl", "wget"]);

// ============================================================
// Utility: color helpers
// ============================================================
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

// ============================================================
// File globbing (simple)
// ============================================================
function simpleGlob(pattern: string, dir: string, ctx: ShellContext): string[] {
  // Very simplified: handles *, ?, and literal
  // For now just return pattern as-is
  return [pattern];
}

// ============================================================
// Commands
// ============================================================
const COMMANDS: Record<string, CommandHandler> = {
  help: (_args, _ctx) => `
${C.bold}Browser Termux${C.reset} — Pure client-side Linux terminal

${C.bold}File System:${C.reset}
  ls [-la] [path]      List directory contents
  cd [path]            Change directory
  pwd                  Print working directory
  cat <file>           Display file contents
  head [-n N] <file>   Show first N lines
  tail [-n N] <file>   Show last N lines
  wc <file>            Word, line, char count
  touch <file>         Create empty file
  mkdir [-p] <dir>     Create directory
  rm [-rf] <path>      Remove file/directory
  cp <src> <dest>      Copy file
  mv <src> <dest>      Move/rename file
  find [path] [-name]  Find files
  tree [path]          Display directory tree
  chmod <mode> <file>  Change permissions
  du [-sh] [path]      Disk usage
  df                   Filesystem stats
  ln <src> <dest>      Create symlink

${C.bold}Text Processing:${C.reset}
  grep [-rn] <pat> [f] Search pattern in files
  sed <expr> <file>    Stream editor
  awk <script> <file>  Text processing
  sort [file]          Sort lines
  uniq [file]          Remove duplicates
  cut -d<char> -f<N>   Cut columns
  tr <from> <to>       Translate characters
  echo <text>          Print text
  printf <fmt> [args]  Formatted output

${C.bold}System:${C.reset}
  uname [-a]           System information
  whoami               Current user
  hostname             System hostname
  uptime               System uptime
  date                 Current date/time
  ps                   List processes
  kill <pid>           Kill process
  env                  Show environment
  export KEY=VAL       Set environment variable
  history              Command history
  clear                Clear screen
  neofetch             System info display

${C.bold}Packages:${C.reset}
  pkg list             List available packages
  pkg list-installed   List installed packages
  pkg install <name>   Install package
  pkg remove <name>    Remove package
  pkg search <query>   Search packages
  pkg update           Update package list

${C.bold}Network:${C.reset}
  curl <url>           HTTP request
  wget <url>           Download file
  ping <host>          Simulated ping

${C.bold}Utilities:${C.reset}
  calc <expr>          Calculator
  figlet <text>        ASCII art
  base64 <text>        Base64 encode
  md5 <text>           MD5 hash
  json <file>          Pretty-print JSON
  date +%<fmt>         Formatted date

${C.bold}Runtime:${C.reset}
  python [script.py]   Run Python (if installed)
  python3 [script.py]  Alias for python
  node <file.js>       Evaluate JavaScript
  sql                  Interactive SQL shell (PGlite)
`,

  // --- File System ---
  ls: async (args, ctx) => {
    const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
    const showLong = args.includes("-l") || args.includes("-la") || args.includes("-al");
    const pathArg = args.find(a => !a.startsWith("-")) ?? ".";
    const target = pathArg === "." ? ctx.cwd : pathArg.startsWith("/") ? pathArg : `${ctx.cwd}/${pathArg}`.replace(/\/+/g, "/");

    if (!(await vfs.exists(target))) return `${C.red}ls: cannot access '${pathArg}': No such file or directory${C.reset}`;
    if (await vfs.isDir(target)) {
      let entries = await vfs.readdir(target);
      if (showAll) entries = [".", "..", ...entries];
      if (showLong) {
        const lines = [`total ${entries.length}`];
        for (const e of entries) {
          if (e === "." || e === "..") {
            lines.push(`${C.cyan}drwxr-xr-x${C.reset}  2 user  user  4096  ${C.dim}${new Date().toLocaleDateString()}${C.reset}  ${C.bold}${C.blue}${e}${C.reset}`);
            continue;
          }
          const childPath = `${target === "/" ? "" : target}/${e}`.replace(/\/+/g, "/");
          const st = await vfs.stat(childPath);
          if (!st) continue;
          const isDir = st.type === "directory";
          const perms = isDir ? "drwxr-xr-x" : (st.permissions === 0o755 ? "-rwxr-xr-x" : "-rw-r--r--");
          const color = isDir ? `${C.bold}${C.blue}` : (st.permissions === 0o755 ? C.green : C.white);
          const size = st.size > 1024 ? `${(st.size / 1024).toFixed(1)}K` : `${st.size}`;
          lines.push(`${C.cyan}${perms}${C.reset}  1 user  user  ${size.padStart(6)}  ${C.dim}${new Date(st.modifiedAt).toLocaleDateString()}${C.reset}  ${color}${e}${C.reset}`);
        }
        return lines.join("\n");
      }
      return entries.map(e => {
        if (e === "." || e === "..") return `${C.bold}${C.blue}${e}${C.reset}`;
        const childPath = `${target === "/" ? "" : target}/${e}`.replace(/\/+/g, "/");
        return vfs.isDir(childPath).then(d => d ? `${C.bold}${C.blue}${e}${C.reset}` : e);
      }).reduce(async (prevP, currP) => {
        const prev = await prevP;
        const curr = await currP;
        return prev + "  " + curr;
      }, Promise.resolve(""));
    }
    // Single file
    const st = await vfs.stat(target);
    return st ? `${st.size} bytes` : `${C.red}ls: cannot access '${pathArg}': No such file${C.reset}`;
  },

  cd: async (args, ctx) => {
    const target = args[0] || "/home/user";
    let resolved: string;
    if (target === "~" || target === "") resolved = "/home/user";
    else if (target === "-") resolved = ctx.env.OLDPWD || ctx.cwd;
    else if (target.startsWith("/")) resolved = target;
    else resolved = `${ctx.cwd}/${target}`.replace(/\/+/g, "/");

    // Normalize path
    const parts = resolved.split("/").filter(Boolean);
    const normalized: string[] = [];
    for (const p of parts) {
      if (p === "..") normalized.pop();
      else if (p !== ".") normalized.push(p);
    }
    resolved = "/" + normalized.join("/");

    if (await vfs.isDir(resolved)) {
      ctx.env.OLDPWD = ctx.cwd;
      ctx.setCwd(resolved);
      return "";
    }
    return `${C.red}cd: no such file or directory: ${target}${C.reset}`;
  },

  pwd: (args, ctx) => ctx.cwd,

  cat: async (args, ctx) => {
    if (!args[0]) return `${C.red}cat: missing file operand${C.reset}`;
    const lines: string[] = [];
    for (const arg of args) {
      if (arg.startsWith(">")) continue;
      const path = arg.startsWith("/") ? arg : `${ctx.cwd}/${arg}`.replace(/\/+/g, "/");
      const content = await vfs.readFile(path);
      if (content === null) {
        lines.push(`${C.red}cat: ${arg}: No such file or directory${C.reset}`);
      } else {
        lines.push(content);
      }
    }
    return lines.join("\n");
  },

  head: async (args, ctx) => {
    let n = 10;
    const files: string[] = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-n" && args[i + 1]) { n = parseInt(args[i + 1]); i++; }
      else files.push(args[i]);
    }
    if (!files[0]) return `${C.red}head: missing file operand${C.reset}`;
    const path = files[0].startsWith("/") ? files[0] : `${ctx.cwd}/${files[0]}`.replace(/\/+/g, "/");
    const content = await vfs.readFile(path);
    if (content === null) return `${C.red}head: ${files[0]}: No such file${C.reset}`;
    return content.split("\n").slice(0, n).join("\n");
  },

  tail: async (args, ctx) => {
    let n = 10;
    const files: string[] = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-n" && args[i + 1]) { n = parseInt(args[i + 1]); i++; }
      else files.push(args[i]);
    }
    if (!files[0]) return `${C.red}tail: missing file operand${C.reset}`;
    const path = files[0].startsWith("/") ? files[0] : `${ctx.cwd}/${files[0]}`.replace(/\/+/g, "/");
    const content = await vfs.readFile(path);
    if (content === null) return `${C.red}tail: ${files[0]}: No such file${C.reset}`;
    return content.split("\n").slice(-n).join("\n");
  },

  wc: async (args, ctx) => {
    if (!args[0]) return `${C.red}wc: missing file operand${C.reset}`;
    const path = args[0].startsWith("/") ? args[0] : `${ctx.cwd}/${args[0]}`.replace(/\/+/g, "/");
    const content = await vfs.readFile(path);
    if (content === null) return `${C.red}wc: ${args[0]}: No such file${C.reset}`;
    const lines = content.split("\n").length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    return `  ${lines}  ${words}  ${chars} ${args[0]}`;
  },

  touch: async (args, ctx) => {
    if (!args[0]) return `${C.red}touch: missing file operand${C.reset}`;
    for (const arg of args) {
      if (arg.startsWith("-")) continue;
      const path = arg.startsWith("/") ? arg : `${ctx.cwd}/${arg}`.replace(/\/+/g, "/");
      if (!(await vfs.exists(path))) {
        await vfs.writeFile(path, "");
      }
    }
    return "";
  },

  mkdir: async (args, ctx) => {
    const recursive = args.includes("-p");
    const dirs = args.filter(a => !a.startsWith("-"));
    if (!dirs[0]) return `${C.red}mkdir: missing operand${C.reset}`;
    for (const d of dirs) {
      const path = d.startsWith("/") ? d : `${ctx.cwd}/${d}`.replace(/\/+/g, "/");
      if (recursive) {
        const parts = path.split("/").filter(Boolean);
        let current = "";
        for (const part of parts) {
          current += "/" + part;
          if (!(await vfs.exists(current))) {
            await vfs.mkdir(current);
          }
        }
      } else {
        await vfs.mkdir(path);
      }
    }
    return "";
  },

  rm: async (args, ctx) => {
    const recursive = args.includes("-r") || args.includes("-rf") || args.includes("-fr");
    const force = args.includes("-f");
    const files = args.filter(a => !a.startsWith("-"));
    if (!files[0]) return `${C.red}rm: missing operand${C.reset}`;
    for (const f of files) {
      const path = f.startsWith("/") ? f : `${ctx.cwd}/${f}`.replace(/\/+/g, "/");
      if (!(await vfs.exists(path))) {
        if (!force) return `${C.red}rm: ${f}: No such file or directory${C.reset}`;
        continue;
      }
      const ok = await vfs.rm(path, recursive);
      if (!ok) return `${C.red}rm: ${f}: is a directory (use -r)${C.reset}`;
    }
    return "";
  },

  cp: async (args, ctx) => {
    if (args.length < 2) return `${C.red}cp: missing file operand${C.reset}`;
    const src = args[0].startsWith("/") ? args[0] : `${ctx.cwd}/${args[0]}`.replace(/\/+/g, "/");
    const dest = args[1].startsWith("/") ? args[1] : `${ctx.cwd}/${args[1]}`.replace(/\/+/g, "/");
    const ok = await vfs.cp(src, dest);
    return ok ? "" : `${C.red}cp: ${args[0]}: No such file${C.reset}`;
  },

  mv: async (args, ctx) => {
    if (args.length < 2) return `${C.red}mv: missing file operand${C.reset}`;
    const src = args[0].startsWith("/") ? args[0] : `${ctx.cwd}/${args[0]}`.replace(/\/+/g, "/");
    const dest = args[1].startsWith("/") ? args[1] : `${ctx.cwd}/${args[1]}`.replace(/\/+/g, "/");
    const ok = await vfs.mv(src, dest);
    return ok ? "" : `${C.red}mv: ${args[0]}: No such file${C.reset}`;
  },

  chmod: async (args, ctx) => {
    if (args.length < 2) return `${C.red}chmod: missing operand${C.reset}`;
    const mode = parseInt(args[0], 8);
    const path = args[1].startsWith("/") ? args[1] : `${ctx.cwd}/${args[1]}`.replace(/\/+/g, "/");
    await vfs.chmod(path, mode);
    return "";
  },

  du: async (args, ctx) => {
    const target = args.find(a => !a.startsWith("-")) ?? ".";
    const path = target === "." ? ctx.cwd : target.startsWith("/") ? target : `${ctx.cwd}/${target}`.replace(/\/+/g, "/");
    const size = await vfs.diskUsage(path);
    const human = args.includes("-h") || args.includes("-sh");
    if (human) {
      if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}M\t${target}`;
      if (size > 1024) return `${(size / 1024).toFixed(1)}K\t${target}`;
    }
    return `${Math.ceil(size / 1024)}\t${target}`;
  },

  df: async (_args, _ctx) => {
    const used = await vfs.diskUsage("/");
    const usedKB = Math.ceil(used / 1024);
    return `Filesystem      Size  Used  Avail Use% Mounted on
virtual-fs      60G   ${usedKB}K   60G   1% /`;
  },

  find: async (args, ctx) => {
    const startPath = args[0]?.startsWith("-") ? ctx.cwd : (args[0] ?? ctx.cwd);
    const nameIdx = args.indexOf("-name");
    const pattern = nameIdx >= 0 ? args[nameIdx + 1] : null;

    const results: string[] = [];
    const walk = async (dir: string) => {
      const entries = await vfs.readdir(dir);
      for (const e of entries) {
        const full = `${dir === "/" ? "" : dir}/${e}`.replace(/\/+/g, "/");
        if (!pattern || e.includes(pattern.replace(/\*/g, ""))) results.push(full);
        if (await vfs.isDir(full)) await walk(full);
      }
    };
    await walk(startPath);
    return results.join("\n") || `${C.dim}(no results)${C.reset}`;
  },

  tree: async (args, ctx) => {
    const target = args[0] ?? ctx.cwd;
    const path = target.startsWith("/") ? target : `${ctx.cwd}/${target}`.replace(/\/+/g, "/");
    const lines: string[] = [`${C.bold}${C.blue}${target}${C.reset}`];
    let fileCount = 0, dirCount = 0;

    const walk = async (dir: string, prefix: string) => {
      const entries = await vfs.readdir(dir);
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const isLast = i === entries.length - 1;
        const connector = isLast ? "└── " : "├── ";
        const childPath = `${dir === "/" ? "" : dir}/${e}`.replace(/\/+/g, "/");
        const isDir = await vfs.isDir(childPath);
        if (isDir) {
          dirCount++;
          lines.push(`${prefix}${connector}${C.bold}${C.blue}${e}${C.reset}`);
          await walk(childPath, prefix + (isLast ? "    " : "│   "));
        } else {
          fileCount++;
          lines.push(`${prefix}${connector}${e}`);
        }
      }
    };
    await walk(path, "");
    lines.push(`\n${C.dim}${dirCount} directories, ${fileCount} files${C.reset}`);
    return lines.join("\n");
  },

  ln: async (args, ctx) => {
    if (args.length < 2) return `${C.red}ln: missing operand${C.reset}`;
    const src = args[0].startsWith("/") ? args[0] : `${ctx.cwd}/${args[0]}`.replace(/\/+/g, "/");
    const dest = args[1].startsWith("/") ? args[1] : `${ctx.cwd}/${args[1]}`.replace(/\/+/g, "/");
    const content = await vfs.readFile(src);
    if (content === null) return `${C.red}ln: ${args[0]}: No such file${C.reset}`;
    await vfs.writeFile(dest, content);
    return "";
  },

  // --- Text Processing ---
  grep: async (args, ctx) => {
    const recursive = args.includes("-r") || args.includes("-rn");
    const lineNum = args.includes("-n") || args.includes("-rn");
    const flags = args.filter(a => a.startsWith("-"));
    const nonFlags = args.filter(a => !a.startsWith("-"));
    const pattern = nonFlags[0];
    const files = nonFlags.slice(1);
    if (!pattern) return `${C.red}grep: missing pattern${C.reset}`;

    const results: string[] = [];
    const regex = new RegExp(pattern, "gi");

    const searchFile = async (path: string, relPath: string) => {
      const content = await vfs.readFile(path);
      if (!content) return;
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          regex.lastIndex = 0;
          const prefix = lineNum ? `${C.green}${relPath}:${i + 1}${C.reset}:` : (files.length > 1 ? `${C.green}${relPath}${C.reset}:` : "");
          results.push(`${prefix}${lines[i].replace(new RegExp(pattern, "gi"), (m) => `${C.red}${C.bold}${m}${C.reset}`)}`);
        }
      }
    };

    if (recursive && files.length === 0) {
      const walk = async (dir: string) => {
        const entries = await vfs.readdir(dir);
        for (const e of entries) {
          const full = `${dir === "/" ? "" : dir}/${e}`.replace(/\/+/g, "/");
          if (await vfs.isDir(full)) await walk(full);
          else await searchFile(full, full);
        }
      };
      await walk(ctx.cwd);
    } else {
      for (const f of files) {
        const path = f.startsWith("/") ? f : `${ctx.cwd}/${f}`.replace(/\/+/g, "/");
        await searchFile(path, f);
      }
    }
    return results.join("\n") || `${C.dim}(no matches)${C.reset}`;
  },

  sed: async (args, ctx) => {
    if (args.length < 2) return `${C.red}sed: usage: sed 's/pattern/replacement/' file${C.reset}`;
    const expr = args[0];
    const filePath = args[1].startsWith("/") ? args[1] : `${ctx.cwd}/${args[1]}`.replace(/\/+/g, "/");
    const content = await vfs.readFile(filePath);
    if (content === null) return `${C.red}sed: ${args[1]}: No such file${C.reset}`;

    const match = expr.match(/^s\/(.*)\/(.*)\/([g]*)$/);
    if (!match) return `${C.red}sed: invalid expression: ${expr}${C.reset}`;
    const [, search, replace, flags] = match;
    const regex = new RegExp(search, flags.includes("g") ? "g" : "");
    const result = content.replace(regex, replace);
    return result;
  },

  sort: async (args, ctx) => {
    const reverse = args.includes("-r");
    const file = args.find(a => !a.startsWith("-"));
    let lines: string[];
    if (file) {
      const path = file.startsWith("/") ? file : `${ctx.cwd}/${file}`.replace(/\/+/g, "/");
      const content = await vfs.readFile(path);
      if (!content) return `${C.red}sort: ${file}: No such file${C.reset}`;
      lines = content.split("\n");
    } else {
      return `${C.red}sort: missing file${C.reset}`;
    }
    lines.sort();
    if (reverse) lines.reverse();
    return lines.join("\n");
  },

  uniq: async (args, ctx) => {
    const file = args.find(a => !a.startsWith("-"));
    if (!file) return `${C.red}uniq: missing file${C.reset}`;
    const path = file.startsWith("/") ? file : `${ctx.cwd}/${file}`.replace(/\/+/g, "/");
    const content = await vfs.readFile(path);
    if (!content) return `${C.red}uniq: ${file}: No such file${C.reset}`;
    const lines = content.split("\n");
    const unique = lines.filter((l, i) => i === 0 || l !== lines[i - 1]);
    return unique.join("\n");
  },

  cut: async (args, ctx) => {
    const dIdx = args.indexOf("-d");
    const fIdx = args.indexOf("-f");
    const delim = dIdx >= 0 ? args[dIdx + 1] : "\t";
    const field = fIdx >= 0 ? parseInt(args[fIdx + 1]) : 1;
    const file = args.find(a => !a.startsWith("-") && a !== delim && a !== String(field) && args.indexOf(a) !== dIdx + 1 && args.indexOf(a) !== fIdx + 1);
    if (!file) return `${C.red}cut: missing file${C.reset}`;
    const path = file.startsWith("/") ? file : `${ctx.cwd}/${file}`.replace(/\/+/g, "/");
    const content = await vfs.readFile(path);
    if (!content) return `${C.red}cut: ${file}: No such file${C.reset}`;
    return content.split("\n").map(line => {
      const fields = line.split(delim);
      return fields[field - 1] ?? "";
    }).join("\n");
  },

  tr: async (args, ctx) => {
    if (args.length < 2) return `${C.red}tr: usage: tr <from> <to> < file${C.reset}`;
    // Read from stdin (piped) - simplified: just read from a file if last arg is a file
    const from = args[0], to = args[1];
    let input = "";
    for (let i = 2; i < args.length; i++) {
      const path = args[i].startsWith("/") ? args[i] : `${ctx.cwd}/${args[i]}`.replace(/\/+/g, "/");
      const content = await vfs.readFile(path);
      if (content) input += content;
    }
    let result = "";
    for (const ch of input) {
      const idx = from.indexOf(ch);
      result += idx >= 0 && idx < to.length ? to[idx] : ch;
    }
    return result;
  },

  echo: (args, _ctx) => args.join(" ").replace(/^["']|["']$/g, ""),

  printf: (args, _ctx) => {
    if (!args[0]) return "";
    let fmt = args[0].replace(/^["']|["']$/g, "");
    for (let i = 1; i < args.length; i++) {
      fmt = fmt.replace(/%s/, args[i]);
    }
    return fmt;
  },

  // --- System ---
  uname: (args, ctx) => {
    if (args.includes("-a")) return "Linux web-termux 6.4.16-client #1 SMP WebAssembly wasm32 unknown";
    if (args.includes("-r")) return "6.4.16-client";
    return "Linux";
  },

  whoami: () => "user",

  hostname: () => "web-termux",

  uptime: (args, ctx) => {
    const elapsed = Math.floor((Date.now() - ctx.startTime) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const upStr = h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m} min`;
    return ` ${new Date().toLocaleTimeString()} up ${upStr},  1 user,  load average: 0.00, 0.01, 0.05`;
  },

  date: (args) => {
    const now = new Date();
    if (args[0]?.startsWith("+")) {
      const fmt = args[0].slice(1);
      return fmt
        .replace(/%Y/g, now.getFullYear().toString())
        .replace(/%m/g, (now.getMonth() + 1).toString().padStart(2, "0"))
        .replace(/%d/g, now.getDate().toString().padStart(2, "0"))
        .replace(/%H/g, now.getHours().toString().padStart(2, "0"))
        .replace(/%M/g, now.getMinutes().toString().padStart(2, "0"))
        .replace(/%S/g, now.getSeconds().toString().padStart(2, "0"))
        .replace(/%s/g, Math.floor(now.getTime() / 1000).toString());
    }
    return now.toString();
  },

  ps: (args, ctx) => {
    const pid = Math.floor(Math.random() * 1000) + 1;
    const lines = [
      "  PID TTY          TIME CMD",
      `    1 pts/0    00:00:00 bash`,
      `  ${pid} pts/0    00:00:00 termux-sh`,
      `  ${pid + 1} pts/0    00:00:00 ps`,
    ];
    return lines.join("\n");
  },

  kill: (_args, _ctx) => `${C.red}kill: operation not permitted${C.reset} ${C.dim}(sandboxed)${C.reset}`,

  env: (args, ctx) => Object.entries(ctx.env).map(([k, v]) => `${k}=${v}`).join("\n"),

  export: (args, ctx) => {
    for (const arg of args) {
      const eq = arg.indexOf("=");
      if (eq > 0) {
        ctx.env[arg.slice(0, eq)] = arg.slice(eq + 1);
      }
    }
    return "";
  },

  history: (args, ctx) => ctx.history.map((h, i) => `  ${String(i + 1).padStart(4)}  ${h}`).join("\n"),

  clear: (_args, _ctx) => "\x1b[2J\x1b[H",

  neofetch: (args, ctx) => {
    const elapsed = Math.floor((Date.now() - ctx.startTime) / 1000);
    return `
${C.cyan}${C.bold}        .-/+oossssoo+/-.        ${C.reset}  ${C.bold}user${C.reset}@${C.bold}web-termux${C.reset}
${C.cyan}${C.bold}    \`:+ssssssssssssssssss+:\`    ${C.reset}  ${C.dim}──────────────${C.reset}
${C.cyan}${C.bold}  -+ssssssssssssssssssyyssss+-  ${C.reset}  ${C.bold}OS:${C.reset} Browser Termux 1.0 (WASM)
${C.cyan}${C.bold} .ossssssssssssssssssd${C.white}MMMNy${C.cyan}${C.bold}ssso. ${C.reset}  ${C.bold}Host:${C.reset} ${navigator.userAgent.split("(")[1]?.split(")")[0] ?? "Browser"}
${C.cyan}${C.bold}/sssssssssss${C.white}hdmmNNmmyNMMMMh${C.cyan}${C.bold}ssss/ ${C.reset}  ${C.bold}Kernel:${C.reset} 6.4.16-client (WASM)
${C.cyan}${C.bold}+sssssssss${C.white}hm${C.cyan}${C.bold}yd${C.white}MMMMMMMNddddy${C.cyan}${C.bold}ssss+ ${C.reset}  ${C.bold}Uptime:${C.reset} ${elapsed}s
${C.cyan}${C.bold}/ssssssss${C.white}hNMMM${C.cyan}${C.bold}yh${C.white}hyyyyhmNMMMNh${C.cyan}${C.bold}ssss/ ${C.reset}  ${C.bold}Shell:${C.reset} termux-sh 1.0
${C.cyan}${C.bold}.ssssssss${C.white}dMMMNh${C.cyan}${C.bold}ssssssssss${C.white}hNMMMd${C.cyan}${C.bold}ssss. ${C.reset}  ${C.bold}Terminal:${C.reset} xterm.js 5.5.0
${C.cyan}${C.bold} +ssss${C.white}hhhyNMMNy${C.cyan}${C.bold}ssssssssss${C.white}yNMMMy${C.cyan}${C.bold}sss+ ${C.reset}  ${C.bold}CPU:${C.reset} WebAssembly JIT
${C.cyan}${C.bold}  .ssssssss${C.white}dMMMNhs${C.cyan}${C.bold}ssssssssss${C.white}hmmmh${C.cyan}${C.bold}ssss. ${C.reset}  ${C.bold}Memory:${C.reset} ${(performance as any).memory?.usedJSHeapSize ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) : 0}MB / ${(performance as any).memory?.jsHeapSizeLimit ? Math.round((performance as any).memory.jsHeapSizeLimit / 1048576) : 2048}MB
${C.cyan}${C.bold}    /sssshhhyNMMNyssssssssssss${C.white}yNMMMy${C.cyan}${C.bold}sss\\ ${C.reset}
${C.cyan}${C.bold}     .ossssssssdMMMNhssssssss${C.white}hNMMMd${C.cyan}${C.bold}ssss. ${C.reset}  ${C.bold}Packages:${C.reset} ${ctx.installedPkgs.size} (apt)
${C.cyan}${C.bold}       /sssssssssssssssssss${C.white}hdMMMNh${C.cyan}${C.bold}ssss/  ${C.reset}  ${C.bold}Disk:${C.reset} 82MB / 60GB
${C.cyan}${C.bold}        -+sssssssssssssssss${C.white}yyy${C.cyan}${C.bold}ssss+-   ${C.reset}
${C.cyan}${C.bold}          \`:+ssssssssssssss+:\`      ${C.reset}  ${C.red}███${C.reset}${C.green}███${C.reset}${C.yellow}███${C.reset}${C.blue}███${C.reset}${C.magenta}███${C.reset}${C.cyan}███${C.reset}
${C.cyan}${C.bold}              .-/+oossssoo+/.       ${C.reset}`;
  },

  // --- Packages ---
  pkg: async (args, ctx) => {
    const sub = args[0];
    if (sub === "list" || sub === "ls") {
      return Object.entries(PACKAGES).map(([name, pkg]) => {
        const installed = ctx.installedPkgs.has(name);
        return `${installed ? `${C.green}i${C.reset}` : `${C.dim} ${C.reset}`} ${C.bold}${name.padEnd(18)}${C.reset} ${pkg.size.padStart(6)}  ${C.dim}${pkg.desc}${C.reset}`;
      }).join("\n");
    }
    if (sub === "list-installed" || sub === "li") {
      const installed = [...ctx.installedPkgs];
      if (installed.length === 0) return `${C.dim}No packages installed${C.reset}`;
      return installed.map(n => `${C.green}i${C.reset} ${C.bold}${n}${C.reset}`).join("\n");
    }
    if (sub === "install" || sub === "i") {
      const pkgName = args[1];
      if (!pkgName) return `${C.red}pkg install: missing package name${C.reset}`;
      if (PACKAGES[pkgName]) {
        const pkg = PACKAGES[pkgName];
        // Install dependencies first
        if (pkg.deps) {
          for (const dep of pkg.deps) {
            if (!ctx.installedPkgs.has(dep)) {
              ctx.installedPkgs.add(dep);
            }
          }
        }
        ctx.installedPkgs.add(pkgName);
        return `${C.green}Fetching ${pkgName}...${C.reset}\n${C.green}Unpacking ${pkgName}...${C.reset}\n${C.green}Setting up ${pkgName} (${pkg.size})...${C.reset}\n${C.green}✓ ${pkgName} installed successfully${C.reset}`;
      }
      return `${C.red}E: Unable to locate package ${pkgName}${C.reset}`;
    }
    if (sub === "remove" || sub === "rm") {
      const pkgName = args[1];
      if (!pkgName) return `${C.red}pkg remove: missing package name${C.reset}`;
      if (!ctx.installedPkgs.has(pkgName)) return `${C.red}Package ${pkgName} is not installed${C.reset}`;
      ctx.installedPkgs.delete(pkgName);
      return `${C.green}✓ ${pkgName} removed${C.reset}`;
    }
    if (sub === "search" || sub === "s") {
      const query = args[1];
      if (!query) return `${C.red}pkg search: missing query${C.reset}`;
      const results = Object.entries(PACKAGES).filter(([n, p]) => n.includes(query) || p.desc.includes(query));
      if (results.length === 0) return `${C.red}No packages found matching '${query}'${C.reset}`;
      return results.map(([n, p]) => `${C.bold}${n}${C.reset} - ${p.desc}`).join("\n");
    }
    if (sub === "update") {
      return `${C.green}Testing mirrors...${C.reset}\n${C.green}All packages are up to date.${C.reset}`;
    }
    return `Usage: pkg {list|install|remove|search|update} [package]`;
  },

  // --- Network ---
  curl: async (args, ctx) => {
    const url = args.find(a => !a.startsWith("-"));
    if (!url) return `${C.red}curl: missing URL${C.reset}`;
    try {
      const resp = await fetch(url);
      const text = await resp.text();
      return text.slice(0, 5000); // Limit output
    } catch (e) {
      return `${C.red}curl: (${e}) Failed to connect${C.reset}`;
    }
  },

  wget: async (args, ctx) => {
    const url = args.find(a => !a.startsWith("-"));
    if (!url) return `${C.red}wget: missing URL${C.reset}`;
    try {
      const resp = await fetch(url);
      const text = await resp.text();
      const filename = url.split("/").pop() ?? "index.html";
      await vfs.writeFile(`${ctx.cwd}/${filename}`, text);
      return `${C.green}Saving '${filename}'${C.reset}\n${filename} - saved [${text.length} bytes]`;
    } catch (e) {
      return `${C.red}wget: unable to resolve host${C.reset}`;
    }
  },

  ping: (args) => {
    const host = args[0] ?? "localhost";
    const lines = [`PING ${host} (127.0.0.1) 56(84) bytes of data.`];
    for (let i = 0; i < 4; i++) {
      const time = (Math.random() * 5 + 0.5).toFixed(3);
      lines.push(`64 bytes from ${host} (127.0.0.1): icmp_seq=${i + 1} ttl=64 time=${time} ms`);
    }
    lines.push(`\n--- ${host} ping statistics ---`);
    lines.push(`4 packets transmitted, 4 received, 0% packet loss`);
    return lines.join("\n");
  },

  // --- Utilities ---
  calc: (args) => {
    try {
      const expr = args.join("").replace(/[^0-9+\-*/().%\s]/g, "");
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${expr})`)();
      return String(result);
    } catch {
      return `${C.red}calc: invalid expression${C.reset}`;
    }
  },

  figlet: (args) => {
    const text = args.join(" ") || "Hello";
    // Simple ASCII art
    const font: Record<string, string[]> = {
      A: ["  █  ", " █ █ ", "█████", "█   █", "█   █"],
      B: ["████ ", "█   █", "████ ", "█   █", "████ "],
      C: [" ████", "█    ", "█    ", "█    ", " ████"],
      D: ["████ ", "█   █", "█   █", "█   █", "████ "],
      E: ["█████", "█    ", "███  ", "█    ", "█████"],
      F: ["█████", "█    ", "███  ", "█    ", "█    "],
      G: [" ████", "█    ", "█  ██", "█   █", " ████"],
      H: ["█   █", "█   █", "█████", "█   █", "█   █"],
      I: ["█████", "  █  ", "  █  ", "  █  ", "█████"],
      J: ["    █", "    █", "    █", "█   █", " ███ "],
      K: ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
      L: ["█    ", "█    ", "█    ", "█    ", "█████"],
      M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
      N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
      O: [" ███ ", "█   █", "█   █", "█   █", " ███ "],
      P: ["████ ", "█   █", "████ ", "█    ", "█    "],
      Q: [" ███ ", "█   █", "█ █ █", "█  █ ", " ██ █"],
      R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
      S: [" ████", "█    ", " ███ ", "    █", "████ "],
      T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
      U: ["█   █", "█   █", "█   █", "█   █", " ███ "],
      V: ["█   █", "█   █", "█   █", " █ █ ", "  █  "],
      W: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
      X: ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
      Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
      Z: ["█████", "   █ ", "  █  ", " █   ", "█████"],
      " ": ["     ", "     ", "     ", "     ", "     "],
    };
    const lines = ["", "", "", "", ""];
    for (const ch of text.toUpperCase()) {
      const glyph = font[ch] ?? font[" "];
      for (let i = 0; i < 5; i++) lines[i] += glyph[i] + " ";
    }
    return `${C.cyan}${lines.join("\n")}${C.reset}`;
  },

  base64: (args) => {
    if (!args[0]) return `${C.red}base64: missing input${C.reset}`;
    return btoa(args.join(" "));
  },

  md5: async (args) => {
    if (!args[0]) return `${C.red}md5: missing input${C.reset}`;
    const msgBuffer = new TextEncoder().encode(args.join(" "));
    const hashBuffer = await crypto.subtle.digest("MD5" as any, msgBuffer).catch(() => crypto.subtle.digest("SHA-256", msgBuffer));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  },

  json: async (args, ctx) => {
    const file = args[0];
    if (!file) return `${C.red}json: missing file${C.reset}`;
    const path = file.startsWith("/") ? file : `${ctx.cwd}/${file}`.replace(/\/+/g, "/");
    const content = await vfs.readFile(path);
    if (!content) return `${C.red}json: ${file}: No such file${C.reset}`;
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return `${C.red}json: invalid JSON in ${file}${C.reset}`;
    }
  },

  // --- Runtime ---
  python: async (args, ctx) => {
    if (!ctx.installedPkgs.has("python")) return `${C.red}Python is not installed. Run: pkg install python${C.reset}`;

    // If a file argument is given, read and execute it
    if (args[0] && !args[0].startsWith("-")) {
      const path = args[0].startsWith("/") ? args[0] : `${ctx.cwd}/${args[0]}`.replace(/\/+/g, "/");
      const code = await vfs.readFile(path);
      if (!code) return `${C.red}python: ${args[0]}: No such file${C.reset}`;
      return await runPython(code);
    }

    // Inline code with -c
    const cIdx = args.indexOf("-c");
    if (cIdx >= 0 && args[cIdx + 1]) {
      return await runPython(args.slice(cIdx + 1).join(" "));
    }

    return `${C.cyan}Python 3.12.0 (Pyodide)${C.reset}\nType code or use 'python <file>'`;
  },

  python3: (args, ctx) => COMMANDS.python!(args, ctx),

  node: async (args, ctx) => {
    if (!args[0]) return `${C.red}node: missing file${C.reset}`;
    const path = args[0].startsWith("/") ? args[0] : `${ctx.cwd}/${args[0]}`.replace(/\/+/g, "/");
    const code = await vfs.readFile(path);
    if (!code) return `${C.red}node: ${args[0]}: No such file${C.reset}`;
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("console", code);
      const logs: string[] = [];
      fn({ log: (...a: any[]) => logs.push(a.map(String).join(" ")), error: (...a: any[]) => logs.push(`${C.red}${a.map(String).join(" ")}${C.reset}`) });
      return logs.join("\n") || `${C.dim}(no output)${C.reset}`;
    } catch (e) {
      return `${C.red}${(e as Error).message}${C.reset}`;
    }
  },

  sql: async (_args, _ctx) => {
    return `${C.cyan}SQL shell available via the PGlite app.${C.reset}\nOpen the Postgres app from the desktop for interactive SQL.`;
  },
};

// ============================================================
// Python runner (lazy-load Pyodide)
// ============================================================
async function runPython(code: string): Promise<string> {
  try {
    if (!window.pyodide) {
      // Load Pyodide
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";
      await new Promise<void>((res, rej) => {
        script.onload = () => res();
        script.onerror = () => rej(new Error("Failed to load Pyodide"));
        document.head.appendChild(script);
      });
      window.pyodide = await window.loadPyodide!({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full" });
    }

    await window.pyodide.runPythonAsync(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
    `);

    await window.pyodide.runPythonAsync(code);

    const stdout = await window.pyodide.runPythonAsync("sys.stdout.getvalue()");
    const stderr = await window.pyodide.runPythonAsync("sys.stderr.getvalue()");

    let output = stdout || "";
    if (stderr) output += `\n${C.red}${stderr}${C.reset}`;
    return output || `${C.dim}(no output)${C.reset}`;
  } catch (e) {
    return `${C.red}${(e as Error).message}${C.reset}`;
  }
}

// ============================================================
// Main Component
// ============================================================
export default function TermuxApp({ onOpenApp }: { onOpenApp?: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<any>(null);
  const [status, setStatus] = useState("Initializing filesystem…");
  const cwdRef = useRef("/home/user");
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const installedPkgsRef = useRef(new Set(INSTALLED_BY_DEFAULT));
  const envRef = useRef<Record<string, string>>({
    HOME: "/home/user",
    USER: "user",
    SHELL: "/bin/bash",
    TERM: "xterm-256color",
    PATH: "/usr/bin:/bin",
    LANG: "en_US.UTF-8",
    EDITOR: "vim",
    PS1: "\\u@web-termux:\\w$ ",
  });
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // Init filesystem
        await vfs.init();
        await vfs.seedDefaults();

        // Load xterm.js
        const xtermScript = document.createElement("script");
        xtermScript.src = "https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.js";
        await new Promise<void>((res, rej) => {
          xtermScript.onload = () => res();
          xtermScript.onerror = () => rej(new Error("Failed to load xterm.js"));
          document.head.appendChild(xtermScript);
        });

        const fitScript = document.createElement("script");
        fitScript.src = "https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.js";
        await new Promise<void>((res, rej) => {
          fitScript.onload = () => res();
          fitScript.onerror = () => rej(new Error("Failed to load fit addon"));
          document.head.appendChild(fitScript);
        });

        if (!alive || !window.Terminal) return;

        const terminal = new window.Terminal({
          theme: {
            background: "#0d1117",
            foreground: "#c9d1d9",
            cursor: "#58a6ff",
            cursorAccent: "#0d1117",
            selectionBackground: "#264f78",
            black: "#0d1117",
            red: "#ff7b72",
            green: "#3fb950",
            yellow: "#d29922",
            blue: "#58a6ff",
            magenta: "#bc8cff",
            cyan: "#39c5cf",
            white: "#c9d1d9",
            brightBlack: "#484f58",
            brightRed: "#ffa198",
            brightGreen: "#56d364",
            brightYellow: "#e3b341",
            brightBlue: "#79c0ff",
            brightMagenta: "#d2a8ff",
            brightCyan: "#56d4dd",
            brightWhite: "#f0f6fc",
          },
          fontFamily: "'SF Mono', 'JetBrains Mono', Menlo, monospace",
          fontSize: 13,
          cursorBlink: true,
          cursorStyle: "bar",
          allowProposedApi: true,
        });

        terminalRef.current = terminal;

        if (containerRef.current) {
          terminal.open(containerRef.current);

          try {
            const FitAddon = window.FitAddon?.FitAddon;
            if (FitAddon) {
              const fitAddon = new FitAddon();
              terminal.loadAddon(fitAddon);
              fitAddon.fit();
            }
          } catch { /* fit not available */ }

          // Welcome
          const wl = (t: string) => terminal.write(t + "\r\n");
          wl(`${C.cyan}${C.bold}╔══════════════════════════════════════════════╗${C.reset}`);
          wl(`${C.cyan}${C.bold}║        Browser Termux v1.0 (WASM)           ║${C.reset}`);
          wl(`${C.cyan}${C.bold}║  Pure client-side Linux terminal            ║${C.reset}`);
          wl(`${C.cyan}${C.bold}║  Persistent filesystem · Python · 30+ cmds  ║${C.reset}`);
          wl(`${C.cyan}${C.bold}╚══════════════════════════════════════════════╝${C.reset}`);
          wl(`${C.dim}Type 'help' for commands, 'pkg list' for packages${C.reset}`);
          wl("");

          const prompt = () => {
            const dir = cwdRef.current === "/home/user" ? "~" : cwdRef.current.replace("/home/user", "~");
            return `\x1b[1;32muser@web-termux\x1b[0m:\x1b[1;34m${dir}\x1b[0m$ `;
          };

          terminal.write(prompt());

          let currentLine = "";

          terminal.onData((data: string) => {
            if (data === "\r") {
              terminal.write("\r\n");
              if (currentLine.trim()) {
                historyRef.current.push(currentLine.trim());
                historyIndexRef.current = historyRef.current.length;
                executeCommand(currentLine.trim(), terminal);
              }
              currentLine = "";
              terminal.write(prompt());
            } else if (data === "\x7f") {
              if (currentLine.length > 0) {
                currentLine = currentLine.slice(0, -1);
                terminal.write("\b \b");
              }
            } else if (data === "\x1b[A") {
              if (historyIndexRef.current > 0) {
                historyIndexRef.current--;
                const cmd = historyRef.current[historyIndexRef.current];
                terminal.write("\r\x1b[K");
                terminal.write(`${prompt()}${cmd}`);
                currentLine = cmd;
              }
            } else if (data === "\x1b[B") {
              if (historyIndexRef.current < historyRef.current.length - 1) {
                historyIndexRef.current++;
                const cmd = historyRef.current[historyIndexRef.current];
                terminal.write("\r\x1b[K");
                terminal.write(`${prompt()}${cmd}`);
                currentLine = cmd;
              } else {
                historyIndexRef.current = historyRef.current.length;
                terminal.write("\r\x1b[K");
                terminal.write(prompt());
                currentLine = "";
              }
            } else if (data === "\t") {
              // Tab completion
              const parts = currentLine.split(/\s+/);
              const last = parts[parts.length - 1] || "";
              // Try file completion
              const dirPath = last.includes("/") ? last.slice(0, last.lastIndexOf("/")) : cwdRef.current;
              const prefix = last.includes("/") ? last.slice(last.lastIndexOf("/") + 1) : last;
              vfs.readdir(dirPath).then(entries => {
                const matches = entries.filter(e => e.startsWith(prefix));
                if (matches.length === 1) {
                  const completion = matches[0];
                  const rest = last.includes("/") ? last.slice(0, last.lastIndexOf("/") + 1) : "";
                  parts[parts.length - 1] = rest + completion;
                  currentLine = parts.join(" ");
                  terminal.write("\r\x1b[K");
                  terminal.write(`${prompt()}${currentLine}`);
                }
              });
            } else if (data === "\x03") {
              // Ctrl+C
              terminal.write("^C\r\n");
              currentLine = "";
              terminal.write(prompt());
            } else if (data === "\x0c") {
              // Ctrl+L = clear
              terminal.write("\x1b[2J\x1b[H");
              terminal.write(prompt());
            } else if (data >= " ") {
              currentLine += data;
              terminal.write(data);
            }
          });

          setStatus("Ready");
        }
      } catch {
        if (alive) setStatus("Failed to load terminal");
      }
    };

    void load();
    return () => {
      alive = false;
      terminalRef.current?.dispose();
    };
  }, []);

  const executeCommand = useCallback(async (input: string, terminal: any) => {
    // Handle pipes (simplified)
    if (input.includes("|")) {
      const parts = input.split("|").map(p => p.trim());
      let prevOutput = "";
      for (const part of parts) {
        const args = parseArgs(part);
        const cmd = args[0];
        const handler = COMMANDS[cmd];
        if (handler) {
          prevOutput = await handler(args.slice(1), {
            cwd: cwdRef.current, setCwd: (p) => { cwdRef.current = p; },
            env: envRef.current, history: historyRef.current,
            addHistory: (c) => historyRef.current.push(c),
            write: (d) => terminal.write(d),
            installedPkgs: installedPkgsRef.current,
            startTime: startTimeRef.current,
          });
        }
      }
      if (prevOutput) terminal.write(prevOutput + "\r\n");
      return;
    }

    const args = parseArgs(input);
    const cmd = args[0];
    const handler = COMMANDS[cmd];

    if (handler) {
      const ctx = {
        cwd: cwdRef.current,
        setCwd: (p: string) => { cwdRef.current = p; },
        env: envRef.current,
        history: historyRef.current,
        addHistory: (c: string) => historyRef.current.push(c),
        write: (d: string) => terminal.write(d),
        installedPkgs: installedPkgsRef.current,
        startTime: startTimeRef.current,
      };
      const output = await handler(args.slice(1), ctx);
      if (output) terminal.write(output + "\r\n");
    } else {
      terminal.write(`${C.red}${cmd}: command not found${C.reset}\r\n`);
      terminal.write(`${C.dim}Type 'help' for available commands${C.reset}\r\n`);
    }
  }, []);

  return (
    <div className={styles.terminalEmulator}>
      <div className={styles.pgliteToolbar}>
        <TerminalIcon size={12} />
        <span className={styles.pgliteStatus}>web-termux — {status}</span>
      </div>
      <div ref={containerRef} className={styles.terminalEmulatorBody} />
    </div>
  );
}

// ============================================================
// Argument parser (handles quotes, escapes)
// ============================================================
function parseArgs(input: string): string[] {
  const args: string[] = [];
  let current = "";
  let inQuote: string | null = null;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuote) {
      if (ch === inQuote) { inQuote = null; }
      else { current += ch; }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === " ") {
      if (current) { args.push(current); current = ""; }
    } else if (ch === "\\") {
      current += input[++i] ?? "";
    } else {
      current += ch;
    }
  }
  if (current) args.push(current);
  return args;
}
