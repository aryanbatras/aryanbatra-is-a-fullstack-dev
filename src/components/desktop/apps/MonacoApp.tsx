"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import loader from "@monaco-editor/loader";
import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";
import {
  Folder, FolderOpen, FileText, FileCode2, FileJson, FileImage,
  ChevronRight, ChevronDown, Search, Settings, TerminalSquare,
  X, Plus, Save, Command, GitBranch, AlertTriangle, Info,
} from "lucide-react";
import { readFiles, saveFileContent } from "@/utils/finderStorage";
import { getPyodide, runPython } from "@/utils/pyodide";
import CDN from "@/constants/cdn";
import styles from "@/styles/components/desktop/apps.module.css";

/* ─── Language mapping ────────────────────────────────────────── */
const EXT_TO_LANG: Record<string, string> = {
  js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "javascript",
  ts: "typescript", mts: "typescript", cts: "typescript", tsx: "typescript",
  json: "json", html: "html", htm: "html", css: "css", scss: "scss",
  less: "less", md: "markdown", java: "java", py: "python", sh: "shell",
  bash: "shell", c: "c", h: "c", cpp: "cpp", cc: "cpp",
  hpp: "cpp", cs: "csharp", go: "go", rs: "rust", php: "php", rb: "ruby",
  sql: "sql", xml: "xml", yml: "yaml", yaml: "yaml", toml: "ini", ini: "ini",
  txt: "plaintext",
};
function languageOf(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_LANG[ext] ?? "plaintext";
}
function iconForFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["json"].includes(ext)) return <FileJson size={14} />;
  if (["js", "ts", "tsx", "jsx", "py", "go", "rs", "java", "c", "cpp", "sh"].includes(ext))
    return <FileCode2 size={14} />;
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext))
    return <FileImage size={14} />;
  return <FileText size={14} />;
}

/* ─── Virtual files ───────────────────────────────────────────── */
interface VirtualFile { name: string; language: string; content: string; }

const VIRTUAL_FILES: VirtualFile[] = [
  { name: "main.ts", language: "typescript", content: `// Aryan OS — TypeScript Playground\nconst greeting: string = "Hello from Aryan OS!";\nconsole.log(greeting);\n\ninterface Project {\n  name: string;\n  tech: string[];\n  description: string;\n}\n\nconst projects: Project[] = [\n  {\n    name: "Browser AI",\n    tech: ["Next.js", "ONNX Runtime"],\n    description: "AI that runs on your machine"\n  },\n  {\n    name: "StartX",\n    tech: ["Next.js", "Groq AI", "Turso DB"],\n    description: "AI startup validation platform"\n  }\n];\n\nprojects.forEach(p => {\n  console.log(\`\${p.name}: \${p.description}\`);\n});` },
  { name: "app.py", language: "python", content: `# Aryan OS — Python Playground\nimport sys\nprint(f"Python {sys.version}")\nprint("Hello from Aryan OS!")\n\n# List comprehension\ncubes = [x**3 for x in range(10)]\nprint(f"Cubes: {cubes}")\n\n# Dictionary\ntech_stack = {\n    "backend": "Spring Boot",\n    "frontend": "React + Next.js",\n    "database": "PostgreSQL"\n}\nfor k, v in tech_stack.items():\n    print(f"  {k}: {v}")` },
  { name: "styles.css", language: "css", content: `/* Aryan OS — CSS Playground */\n:root {\n  --accent: #007acc;\n  --bg: #1e1e1e;\n  --text: #e8e8e8;\n}\n\nbody {\n  margin: 0;\n  font-family: 'SF Pro', system-ui, sans-serif;\n  background: var(--bg);\n  color: var(--text);\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 2rem;\n}` },
  { name: "data.json", language: "json", content: `{\n  "name": "Aryan Batra",\n  "title": "Software Engineer",\n  "skills": ["Java", "TypeScript", "Python", "React", "Next.js"],\n  "projects": 18,\n  "github": "https://github.com/aryanbatras"\n}` },
  { name: "README.md", language: "markdown", content: `# Aryan OS\n\nA macOS-style desktop operating system built with React.\n\n## Features\n\n- **Terminal** — Real Python 3 (Pyodide), JavaScript, pip install\n- **Monaco** — VS Code editor with file explorer\n- **Finder** — File browser with drag & drop\n- **40+ Apps** — From games to productivity tools\n\n## Tech Stack\n\n| Layer | Technology |\n|-------|------------|\n| Framework | Next.js 16 |\n| UI | React 19 |\n| Styling | Tailwind CSS 4 |\n| Animation | Framer Motion, GSAP |\n| 3D | Three.js, R3F |\n| Editor | Monaco (VS Code) |\n| Python | Pyodide (CPython 3) |` },
  { name: "server.js", language: "javascript", content: `// Aryan OS — Node.js Playground\nconst express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Hello from Aryan OS!' });\n});\n\napp.listen(3000, () => {\n  console.log('Server running on port 3000');\n});` },
  { name: "index.html", language: "html", content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Aryan OS</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div class="container">\n    <h1>Welcome to Aryan OS</h1>\n    <p>A macOS-style desktop in the browser.</p>\n  </div>\n</body>\n</html>` },
  { name: "algorithm.ts", language: "typescript", content: `// Common algorithms implemented in TypeScript\n\nfunction binarySearch(arr: number[], target: number): number {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}\n\nfunction fibonacci(n: number): number {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}\n\nconsole.log(binarySearch([1, 3, 5, 7, 9], 5)); // 2\nconsole.log(fibonacci(10)); // 55` },
  { name: "api.py", language: "python", content: `# FastAPI-style endpoint simulation\nclass API:\n    def __init__(self):\n        self.routes = {}\n    \n    def get(self, path):\n        def decorator(func):\n            self.routes[('GET', path)] = func\n            return func\n        return decorator\n    \n    def post(self, path):\n        def decorator(func):\n            self.routes[('POST', path)] = func\n            return func\n        return decorator\n\napi = API()\n\n@api.get('/users')\ndef list_users():\n    return [{"id": 1, "name": "Aryan"}]\n\n@api.post('/users')\ndef create_user():\n    return {"id": 2, "name": "New User"}\n\nprint("Routes:", list(api.routes.keys()))` },
];

const FILE_TREE: { name: string; type: "file" | "folder"; children?: any[]; file?: VirtualFile }[] = [
  { name: "src", type: "folder", children: [
    { name: "main.ts", type: "file", file: VIRTUAL_FILES[0] },
    { name: "algorithm.ts", type: "file", file: VIRTUAL_FILES[7] },
    { name: "app.py", type: "file", file: VIRTUAL_FILES[1] },
    { name: "api.py", type: "file", file: VIRTUAL_FILES[8] },
    { name: "server.js", type: "file", file: VIRTUAL_FILES[5] },
  ]},
  { name: "styles", type: "folder", children: [
    { name: "styles.css", type: "file", file: VIRTUAL_FILES[2] },
  ]},
  { name: "public", type: "folder", children: [
    { name: "index.html", type: "file", file: VIRTUAL_FILES[6] },
  ]},
  { name: "data.json", type: "file", file: VIRTUAL_FILES[3] },
  { name: "README.md", type: "file", file: VIRTUAL_FILES[4] },
];

/* ─── Command Palette ─────────────────────────────────────────── */
interface CommandItem { id: string; label: string; category: string; shortcut?: string; action: () => void; }

/* ─── Tree Item ───────────────────────────────────────────────── */
function TreeItem({ node, depth, activeFile, onSelect }: {
  node: any; depth: number; activeFile: string | null; onSelect: (f: VirtualFile) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  if (node.type === "folder") {
    return (
      <div>
        <button type="button" className={styles.monacoTreeItem}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {expanded ? <FolderOpen size={14} /> : <Folder size={14} />}
          <span>{node.name}</span>
        </button>
        {expanded && node.children?.map((c: any) => (
          <TreeItem key={c.name} node={c} depth={depth + 1} activeFile={activeFile} onSelect={onSelect} />
        ))}
      </div>
    );
  }
  return (
    <button type="button"
      className={`${styles.monacoTreeItem} ${activeFile === node.name ? styles.monacoTreeItemActive : ""}`}
      style={{ paddingLeft: `${12 + depth * 16 + 18}px` }}
      onClick={() => node.file && onSelect(node.file)}>
      {iconForFile(node.name)} <span>{node.name}</span>
    </button>
  );
}

/* ─── Mini Terminal ───────────────────────────────────────────── */
function MiniTerminal() {
  const [lines, setLines] = useState(["Aryan OS Terminal — type 'help' or 'python'"]);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight }); }, [lines]);

  const run = async (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const next = [...lines, `aryan@macbook ~ % ${cmd}`];
    if (cmd === "clear") { setLines([]); setInput(""); return; }
    if (cmd === "help") { next.push("Commands: help, clear, python <code>, ls, whoami, date, echo <text>, node <js>"); setLines(next); setInput(""); return; }
    if (cmd === "ls") { next.push("src/  styles/  public/  data.json  README.md"); setLines(next); setInput(""); return; }
    if (cmd === "whoami") { next.push("aryan — software engineer"); setLines(next); setInput(""); return; }
    if (cmd === "date") { next.push(new Date().toString()); setLines(next); setInput(""); return; }
    if (cmd.startsWith("echo ")) { next.push(cmd.slice(5)); setLines(next); setInput(""); return; }
    if (cmd.startsWith("python ") || cmd.startsWith("py ")) {
      const code = cmd.split(/\s+/).slice(1).join(" ");
      next.push("python: running…"); setLines(next);
      await runPython(code, (out) => setLines((prev) => [...prev, out]));
      setInput(""); return;
    }
    if (cmd.startsWith("node ") || cmd.startsWith("js ")) {
      const code = cmd.split(/\s+/).slice(1).join(" ");
      try { const r = eval(code); next.push(r === undefined ? "undefined" : String(r)); }
      catch (e) { next.push(`node: ${(e as Error).message}`); }
      setLines(next); setInput(""); return;
    }
    next.push(`zsh: command not found: ${cmd.split(/\s+/)[0]}`);
    setLines(next); setInput("");
  };

  return (
    <div className={styles.monacoTerminal}>
      <div ref={bodyRef} className={styles.monacoTerminalBody}>
        {lines.map((l, i) => <div key={i} className={styles.monacoTermLine}>{l}</div>)}
        <div className={styles.monacoTermInput}>
          <span className={styles.monacoTermPrompt}>aryan@macbook ~ % </span>
          <input className={styles.monacoTermInputField} value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { run(input); setInput(""); } }}
            autoFocus spellCheck={false} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main MonacoApp ──────────────────────────────────────────── */
interface MonacoAppProps { file?: string; content?: string; }

export default function MonacoApp({ file, content }: MonacoAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [monaco, setMonaco] = useState<typeof Monaco | null>(null);
  const [status, setStatus] = useState("Loading Monaco…");
  const [position, setPosition] = useState("Ln 1, Col 1");
  const [lineCount, setLineCount] = useState(1);
  const [langLabel, setLangLabel] = useState("");
  const [openFiles, setOpenFiles] = useState<VirtualFile[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ file: string; line: number; text: string }[]>([]);
  const [theme, setTheme] = useState<"vs-dark" | "vs" | "hc-black">("vs-dark");
  const [fontSize, setFontSize] = useState(13);
  const [wordWrap, setWordWrap] = useState<"off" | "on" | "wordWrapColumn">("off");
  const [minimap, setMinimap] = useState(true);
  const [showGoToLine, setShowGoToLine] = useState(false);
  const [goToLineValue, setGoToLineValue] = useState("");
  const commandInputRef = useRef<HTMLInputElement>(null);
  const goToLineRef = useRef<HTMLInputElement>(null);

  const fileName = file ?? activeTab ?? "untitled.txt";
  const lang = useMemo(() => languageOf(fileName), [fileName]);

  // If a file is passed via props, open it directly
  useEffect(() => {
    if (file && content) {
      const vf: VirtualFile = { name: file, language: languageOf(file), content };
      setOpenFiles((prev) => prev.some((f) => f.name === file) ? prev : [...prev, vf]);
      setActiveTab(file);
    }
  }, [file, content]);

  // Boot Monaco
  useEffect(() => {
    let alive = true;
    loader.config({ paths: { vs: CDN.MONACO.vs } });
    loader.init().then((instance) => { if (alive) { setMonaco(instance); setStatus(""); } })
      .catch(() => { if (alive) setStatus("Failed to load Monaco"); });
    return () => { alive = false; };
  }, []);

  // Create editor
  useEffect(() => {
    const container = containerRef.current;
    if (!monaco || !container) return;
    const virtualFile = VIRTUAL_FILES.find((f) => f.name === fileName);
    const storedFile = file ? readFiles().find((f) => f.name === file) : undefined;
    const initialContent = content ?? storedFile?.content ?? virtualFile?.content ?? "";

    const editor = monaco.editor.create(container, {
      value: initialContent,
      language: virtualFile?.language ?? lang,
      theme,
      automaticLayout: true,
      fontSize,
      fontFamily: "'SF Mono', 'JetBrains Mono', Menlo, monospace",
      fontLigatures: true,
      minimap: { enabled: minimap },
      scrollBeyondLastLine: false,
      renderWhitespace: "none",
      smoothScrolling: true,
      cursorBlinking: "smooth",
      padding: { top: 8 },
      bracketPairColorization: { enabled: true },
      tabSize: 2,
      wordWrap,
      lineNumbers: "on",
      renderLineHighlight: "all",
      suggest: { showKeywords: true, showSnippets: true },
      quickSuggestions: true,
    });
    editorRef.current = editor;

    const updatePosition = () => {
      const sel = editor.getSelection();
      if (!sel) return;
      const { positionColumn: col, positionLineNumber: line } = sel;
      const text = editor.getModel()?.getValueInRange(sel) ?? "";
      setPosition(`Ln ${line}, Col ${col}${text ? ` (${text.length} sel)` : ""}`);
    };
    const updateLineCount = () => setLineCount(editor.getModel()?.getLineCount() ?? 1);
    const model = editor.getModel();
    if (model?.getLanguageId()) setLangLabel(model.getLanguageId());
    const d1 = editor.onDidChangeCursorPosition(updatePosition);
    const d2 = editor.onDidChangeModelContent(updateLineCount);
    editor.focus();

    return () => {
      d1.dispose(); d2.dispose();
      editor.getModel()?.dispose(); editor.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco, theme, fontSize, wordWrap, minimap]);

  // Save
  const save = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !file) return;
    saveFileContent(file, editor.getValue());
    setStatus("Saved ✓");
    window.setTimeout(() => setStatus(""), 1600);
  }, [file]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
      if (mod && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); setShowCommandPalette((s) => !s); setCommandQuery(""); }
      if (mod && e.key.toLowerCase() === "p") { e.preventDefault(); setShowSearch((s) => !s); setSearchQuery(""); }
      if (mod && e.key.toLowerCase() === "g") { e.preventDefault(); setShowGoToLine((s) => !s); setGoToLineValue(""); }
      if (e.key === "Escape") { setShowCommandPalette(false); setShowSearch(false); setShowGoToLine(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  useEffect(() => {
    if (showCommandPalette) setTimeout(() => commandInputRef.current?.focus(), 50);
    if (showGoToLine) setTimeout(() => goToLineRef.current?.focus(), 50);
  }, [showCommandPalette, showGoToLine]);

  // Format document
  const formatDocument = useCallback(() => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  }, []);

  // Go to line
  const goToLine = useCallback((lineNum: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.revealLineInCenter(lineNum);
    editor.setPosition({ lineNumber: lineNum, column: 1 });
    editor.focus();
    setShowGoToLine(false);
  }, []);

  // File search
  const doFileSearch = useCallback((q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    const results: { file: string; line: number; text: string }[] = [];
    const allFiles = [...VIRTUAL_FILES, ...openFiles];
    for (const f of allFiles) {
      const lines = f.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(q.toLowerCase())) {
          results.push({ file: f.name, line: i + 1, text: lines[i].trim() });
          if (results.length >= 50) break;
        }
      }
      if (results.length >= 50) break;
    }
    setSearchResults(results);
  }, [openFiles]);

  // Command palette items
  const commands: CommandItem[] = useMemo(() => [
    { id: "format", label: "Format Document", category: "Editor", shortcut: "Shift+Alt+F", action: () => { formatDocument(); setShowCommandPalette(false); } },
    { id: "toggleWrap", label: "Toggle Word Wrap", category: "Editor", shortcut: "Alt+Z", action: () => { setWordWrap((w) => w === "off" ? "on" : "off"); setShowCommandPalette(false); } },
    { id: "toggleMinimap", label: "Toggle Minimap", category: "View", action: () => { setMinimap((m) => !m); setShowCommandPalette(false); } },
    { id: "toggleTerminal", label: "Toggle Terminal", category: "View", shortcut: "Ctrl+`", action: () => { setTerminalOpen((t) => !t); setShowCommandPalette(false); } },
    { id: "toggleExplorer", label: "Toggle Explorer", category: "View", action: () => { setExplorerOpen((e) => !e); setShowCommandPalette(false); } },
    { id: "goToLine", label: "Go to Line...", category: "Editor", shortcut: "Ctrl+G", action: () => { setShowGoToLine(true); setShowCommandPalette(false); } },
    { id: "find", label: "Find in Files", category: "Edit", shortcut: "Ctrl+F", action: () => { setShowSearch(true); setShowCommandPalette(false); } },
    { id: "save", label: "Save", category: "File", shortcut: "Ctrl+S", action: () => { save(); setShowCommandPalette(false); } },
    { id: "themeDark", label: "Color Theme: Dark (VS Code)", category: "Preferences", action: () => { setTheme("vs-dark"); setShowCommandPalette(false); } },
    { id: "themeLight", label: "Color Theme: Light", category: "Preferences", action: () => { setTheme("vs"); setShowCommandPalette(false); } },
    { id: "themeHC", label: "Color Theme: High Contrast", category: "Preferences", action: () => { setTheme("hc-black"); setShowCommandPalette(false); } },
    { id: "fontUp", label: "Increase Font Size", category: "View", action: () => { setFontSize((s) => s + 1); setShowCommandPalette(false); } },
    { id: "fontDown", label: "Decrease Font Size", category: "View", action: () => { setFontSize((s) => Math.max(8, s - 1)); setShowCommandPalette(false); } },
    { id: "newFile", label: "New File", category: "File", action: () => { setShowCommandPalette(false); } },
    { id: "openTerminal", label: "Open Integrated Terminal", category: "View", action: () => { setTerminalOpen(true); setShowCommandPalette(false); } },
    { id: "selectAll", label: "Select All", category: "Edit", shortcut: "Ctrl+A", action: () => { editorRef.current?.trigger("keyboard", "editor.action.selectAll", null); setShowCommandPalette(false); } },
    { id: "undo", label: "Undo", category: "Edit", shortcut: "Ctrl+Z", action: () => { editorRef.current?.trigger("keyboard", "undo", null); setShowCommandPalette(false); } },
    { id: "redo", label: "Redo", category: "Edit", shortcut: "Ctrl+Shift+Z", action: () => { editorRef.current?.trigger("keyboard", "redo", null); setShowCommandPalette(false); } },
    { id: "fold", label: "Fold All", category: "Editor", action: () => { editorRef.current?.trigger("keyboard", "editor.foldAll", null); setShowCommandPalette(false); } },
    { id: "unfold", label: "Unfold All", category: "Editor", action: () => { editorRef.current?.trigger("keyboard", "editor.unfoldAll", null); setShowCommandPalette(false); } },
  ], [formatDocument, save]);

  const filteredCommands = useMemo(() => {
    if (!commandQuery) return commands;
    const q = commandQuery.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [commandQuery, commands]);

  // Open file from explorer
  const openExplorerFile = (vf: VirtualFile) => {
    setOpenFiles((prev) => prev.some((f) => f.name === vf.name) ? prev : [...prev, vf]);
    setActiveTab(vf.name);
  };

  const closeTab = (name: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.name !== name);
      if (activeTab === name) setActiveTab(next.length > 0 ? next[next.length - 1].name : null);
      return next;
    });
  };

  const isDark = theme !== "vs";

  return (
    <div className={styles.monacoVscode} style={{ colorScheme: isDark ? "dark" : "light" }}>
      {/* Sidebar icons */}
      <div className={styles.monacoSidebar} style={{ background: isDark ? "#333" : "#2c2c2c" }}>
        <button type="button" className={`${styles.monacoSidebarIcon} ${explorerOpen ? styles.monacoSidebarIconActive : ""}`}
          onClick={() => setExplorerOpen(!explorerOpen)} title="Explorer">
          <Folder size={18} />
        </button>
        <button type="button" className={`${styles.monacoSidebarIcon} ${showSearch ? styles.monacoSidebarIconActive : ""}`}
          onClick={() => setShowSearch((s) => !s)} title="Search">
          <Search size={18} />
        </button>
        <button type="button" className={`${styles.monacoSidebarIcon} ${terminalOpen ? styles.monacoSidebarIconActive : ""}`}
          onClick={() => setTerminalOpen(!terminalOpen)} title="Terminal">
          <TerminalSquare size={18} />
        </button>
        <button type="button" className={`${styles.monacoSidebarIcon}`}
          onClick={() => setShowCommandPalette(true)} title="Command Palette">
          <Command size={18} />
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" className={styles.monacoSidebarIcon}
          onClick={() => setShowCommandPalette(true)} title="Settings">
          <Settings size={18} />
        </button>
      </div>

      {/* Explorer / Search panel */}
      {(explorerOpen || showSearch) && (
        <div className={styles.monacoExplorer} style={{ background: isDark ? "#252526" : "#f3f3f3" }}>
          {explorerOpen && !showSearch && (
            <>
              <div className={styles.monacoExplorerHeader} style={{ color: isDark ? "#bbb" : "#333" }}>EXPLORER</div>
              <div className={styles.monacoTree}>
                {FILE_TREE.map((node) => (
                  <TreeItem key={node.name} node={node} depth={0} activeFile={activeTab} onSelect={openExplorerFile} />
                ))}
              </div>
            </>
          )}
          {showSearch && (
            <>
              <div className={styles.monacoExplorerHeader} style={{ color: isDark ? "#bbb" : "#333" }}>SEARCH</div>
              <div style={{ padding: 8 }}>
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); doFileSearch(e.target.value); }}
                  placeholder="Search in files..."
                  style={{
                    width: "100%", padding: "5px 8px", border: `1px solid ${isDark ? "#555" : "#ccc"}`,
                    borderRadius: 4, background: isDark ? "#3c3c3c" : "#fff", color: isDark ? "#ddd" : "#333",
                    fontSize: 12, outline: "none",
                  }}
                  autoFocus
                />
              </div>
              {searchResults.length > 0 && (
                <div style={{ fontSize: 11, color: isDark ? "#888" : "#666", padding: "4px 8px" }}>
                  {searchResults.length} results
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {searchResults.map((r, i) => (
                  <button key={i} onClick={() => {
                    const vf = VIRTUAL_FILES.find((f) => f.name === r.file);
                    if (vf) openExplorerFile(vf);
                    setShowSearch(false);
                  }} style={{
                    display: "block", width: "100%", padding: "4px 8px", border: "none",
                    background: "transparent", textAlign: "left", cursor: "pointer",
                    fontSize: 12, color: isDark ? "#ccc" : "#333",
                  }}>
                    <span style={{ color: isDark ? "#569cd6" : "#007acc", fontWeight: 500 }}>{r.file}</span>
                    <span style={{ color: isDark ? "#888" : "#999" }}>:{r.line}</span>
                    <div style={{ fontSize: 11, color: isDark ? "#999" : "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.text}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Main editor area */}
      <div className={styles.monacoMain}>
        {/* Tab bar */}
        <div className={styles.monacoTabBar} style={{ background: isDark ? "#252526" : "#f3f3f3" }}>
          {openFiles.map((f) => (
            <button key={f.name} type="button"
              className={`${styles.monacoTab} ${activeTab === f.name ? styles.monacoTabActive : ""}`}
              onClick={() => setActiveTab(f.name)}>
              {iconForFile(f.name)} <span>{f.name}</span>
              <button type="button" className={styles.monacoTabClose}
                onClick={(e) => { e.stopPropagation(); closeTab(f.name); }}>
                <X size={12} />
              </button>
            </button>
          ))}
        </div>

        {/* Breadcrumb */}
        <div style={{
          padding: "2px 12px", fontSize: 12, color: isDark ? "#888" : "#666",
          background: isDark ? "#1e1e1e" : "#fff", borderBottom: `1px solid ${isDark ? "#333" : "#eee"}`,
        }}>
          {activeTab ? (
            <span>
              <span style={{ cursor: "pointer" }}>{activeTab}</span>
              <span style={{ margin: "0 4px", color: isDark ? "#555" : "#ccc" }}>›</span>
              <span style={{ color: isDark ? "#4ec9b0" : "#007acc" }}>{langLabel || lang}</span>
            </span>
          ) : (
            <span style={{ color: isDark ? "#555" : "#ccc" }}>No file open</span>
          )}
        </div>

        {/* Editor */}
        <div ref={containerRef} className={styles.monacoBody}
          style={{ background: isDark ? "#1e1e1e" : "#fff" }} />

        {/* Status bar */}
        <div className={styles.monacoStatusbar} style={{ background: isDark ? "#007acc" : "#007acc" }}>
          <span>{langLabel || lang}</span>
          <span className={styles.monacoStatusbarSpacer} />
          <span>{status || `Ln ${lineCount}, ${position}`}</span>
          {!file && <span className={styles.monacoStatusbarRight}>New file</span>}
          {file && (
            <button type="button" onClick={save}
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Save size={12} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Terminal panel */}
      {terminalOpen && <MiniTerminal />}

      {/* Command Palette overlay */}
      {showCommandPalette && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setShowCommandPalette(false)} />
          <div style={{
            position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
            width: 520, background: isDark ? "#252526" : "#fff",
            border: `1px solid ${isDark ? "#454545" : "#ddd"}`,
            borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 1000, overflow: "hidden",
          }}>
            <input
              ref={commandInputRef}
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
              placeholder="Type a command..."
              style={{
                width: "100%", padding: "12px 16px", border: "none", borderBottom: `1px solid ${isDark ? "#454545" : "#eee"}`,
                background: "transparent", color: isDark ? "#ddd" : "#333", fontSize: 14, outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredCommands.length > 0) filteredCommands[0].action();
                if (e.key === "Escape") setShowCommandPalette(false);
              }}
            />
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {filteredCommands.map((cmd) => (
                <button key={cmd.id} onClick={cmd.action} style={{
                  display: "flex", alignItems: "center", width: "100%", padding: "8px 16px",
                  border: "none", background: "transparent", cursor: "pointer",
                  color: isDark ? "#ddd" : "#333", fontSize: 13, textAlign: "left",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "#094771" : "#e8f0fe"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <span style={{ flex: 1 }}>{cmd.label}</span>
                  <span style={{ fontSize: 11, color: isDark ? "#888" : "#999", marginRight: 8 }}>{cmd.category}</span>
                  {cmd.shortcut && (
                    <span style={{
                      fontSize: 10, padding: "2px 6px", borderRadius: 3,
                      background: isDark ? "#333" : "#eee", color: isDark ? "#aaa" : "#666",
                    }}>{cmd.shortcut}</span>
                  )}
                </button>
              ))}
              {filteredCommands.length === 0 && (
                <div style={{ padding: "16px", textAlign: "center", color: isDark ? "#888" : "#999", fontSize: 13 }}>
                  No matching commands
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Go to Line overlay */}
      {showGoToLine && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setShowGoToLine(false)} />
          <div style={{
            position: "fixed", top: 120, left: "50%", transform: "translateX(-50%)",
            width: 280, background: isDark ? "#252526" : "#fff",
            border: `1px solid ${isDark ? "#454545" : "#ddd"}`,
            borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", padding: 16, zIndex: 1000,
          }}>
            <div style={{ fontSize: 13, color: isDark ? "#ddd" : "#333", marginBottom: 8, fontWeight: 500 }}>
              Go to Line (1–{lineCount})
            </div>
            <input
              ref={goToLineRef}
              type="number"
              min={1}
              max={lineCount}
              value={goToLineValue}
              onChange={(e) => setGoToLineValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { goToLine(parseInt(goToLineValue) || 1); setShowGoToLine(false); }
                if (e.key === "Escape") setShowGoToLine(false);
              }}
              style={{
                width: "100%", padding: "8px 12px", border: `1px solid ${isDark ? "#555" : "#ccc"}`,
                borderRadius: 4, background: isDark ? "#3c3c3c" : "#fff", color: isDark ? "#ddd" : "#333",
                fontSize: 14, outline: "none",
              }}
              autoFocus
            />
          </div>
        </>
      )}
    </div>
  );
}
