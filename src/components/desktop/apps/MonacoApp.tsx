"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import loader from "@monaco-editor/loader";
import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode2,
  FileJson,
  FileImage,
  ChevronRight,
  ChevronDown,
  Search,
  Settings,
  TerminalSquare,
  X,
  Plus,
  Save,
} from "lucide-react";
import { readFiles, saveFileContent } from "@/utils/finderStorage";
import { getPyodide, runPython } from "@/utils/pyodide";
import CDN from "@/constants/cdn";
import styles from "@/styles/components/desktop/apps.module.css";

/** Extension -> Monaco language id. */
const EXT_TO_LANG: Record<string, string> = {
  js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "javascript",
  ts: "typescript", mts: "typescript", cts: "typescript", tsx: "typescript",
  json: "json", html: "html", htm: "html", css: "css", scss: "scss",
  less: "less", md: "markdown", java: "java", py: "python", sh: "shell",
  bash: "shell", zsh: "shell", c: "c", h: "c", cpp: "cpp", cc: "cpp",
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

/* ---- Built-in virtual files for the explorer ---- */
interface VirtualFile {
  name: string;
  language: string;
  content: string;
}

const VIRTUAL_FILES: VirtualFile[] = [
  { name: "main.ts", language: "typescript", content: `// Aryan OS — TypeScript Playground\nconst greeting: string = "Hello from Aryan OS!";\nconsole.log(greeting);\n\ninterface Project {\n  name: string;\n  tech: string[];\n  description: string;\n}\n\nconst projects: Project[] = [\n  {\n    name: "Browser AI",\n    tech: ["Next.js", "ONNX Runtime"],\n    description: "AI that runs on your machine"\n  },\n  {\n    name: "StartX",\n    tech: ["Next.js", "Groq AI", "Turso DB"],\n    description: "AI startup validation platform"\n  }\n];\n\nprojects.forEach(p => {\n  console.log(\`\${p.name}: \${p.description}\`);\n});` },
  { name: "app.py", language: "python", content: `# Aryan OS — Python Playground\nimport sys\nprint(f"Python {sys.version}")\nprint("Hello from Aryan OS!")\n\n# List comprehension\ncubes = [x**3 for x in range(10)]\nprint(f"Cubes: {cubes}")\n\n# Dictionary\ntech_stack = {\n    "backend": "Spring Boot",\n    "frontend": "React + Next.js",\n    "database": "PostgreSQL"\n}\nfor k, v in tech_stack.items():\n    print(f"  {k}: {v}")` },
  { name: "styles.css", language: "css", content: `/* Aryan OS — CSS Playground */\n:root {\n  --accent: #007acc;\n  --bg: #1e1e1e;\n  --text: #e8e8e8;\n}\n\nbody {\n  margin: 0;\n  font-family: 'SF Pro', system-ui, sans-serif;\n  background: var(--bg);\n  color: var(--text);\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 2rem;\n}` },
  { name: "data.json", language: "json", content: `{\n  "name": "Aryan Batra",\n  "title": "Software Engineer",\n  "skills": ["Java", "TypeScript", "Python", "React", "Next.js"],\n  "projects": 18,\n  "github": "https://github.com/aryanbatras"\n}` },
  { name: "README.md", language: "markdown", content: `# Aryan OS\n\nA macOS-style desktop operating system built with React.\n\n## Features\n\n- **Terminal** — Real Python 3 (Pyodide), JavaScript, pip install\n- **Monaco** — VS Code editor with file explorer\n- **Finder** — File browser with drag & drop\n- **40+ Apps** — From games to productivity tools\n\n## Tech Stack\n\n| Layer | Technology |\n|-------|------------|\n| Framework | Next.js 16 |\n| UI | React 19 |\n| Styling | Tailwind CSS 4 |\n| Animation | Framer Motion, GSAP |\n| 3D | Three.js, R3F |\n| Editor | Monaco (VS Code) |\n| Python | Pyodide (CPython 3) |` },
  { name: "server.js", language: "javascript", content: `// Aryan OS — Node.js Playground\nconst express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Hello from Aryan OS!' });\n});\n\napp.listen(3000, () => {\n  console.log('Server running on port 3000');\n});` },
];

/* ---- Explorer tree node ---- */
interface TreeNode {
  name: string;
  type: "file" | "folder";
  children?: TreeNode[];
  file?: VirtualFile;
}

const FILE_TREE: TreeNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      { name: "main.ts", type: "file", file: VIRTUAL_FILES[0] },
      { name: "app.py", type: "file", file: VIRTUAL_FILES[1] },
      { name: "server.js", type: "file", file: VIRTUAL_FILES[5] },
    ],
  },
  {
    name: "styles",
    type: "folder",
    children: [
      { name: "styles.css", type: "file", file: VIRTUAL_FILES[2] },
    ],
  },
  { name: "data.json", type: "file", file: VIRTUAL_FILES[3] },
  { name: "README.md", type: "file", file: VIRTUAL_FILES[4] },
];

/* ---- Mini terminal for the integrated panel ---- */
function MiniTerminal() {
  const [lines, setLines] = useState<string[]>(["Aryan OS Terminal — type 'help' or 'python'"]);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  const run = async (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const prompt = `aryan@macbook ~ % ${cmd}`;
    const next = [...lines, prompt];

    if (cmd === "clear") { setLines([]); setInput(""); return; }
    if (cmd === "help") {
      next.push("Commands: help, clear, python <code>, ls, whoami, date, echo <text>, node <js>");
      setLines(next); setInput(""); return;
    }
    if (cmd === "ls") { next.push("src/  styles/  data.json  README.md"); setLines(next); setInput(""); return; }
    if (cmd === "whoami") { next.push("aryan — software engineer"); setLines(next); setInput(""); return; }
    if (cmd === "date") { next.push(new Date().toString()); setLines(next); setInput(""); return; }
    if (cmd.startsWith("echo ")) { next.push(cmd.slice(5)); setLines(next); setInput(""); return; }

    if (cmd.startsWith("python ") || cmd.startsWith("py ")) {
      const code = cmd.split(/\s+/).slice(1).join(" ");
      next.push("python: running…");
      setLines(next);
      await runPython(code, (out) => setLines((prev) => [...prev, out]));
      setInput("");
      return;
    }

    if (cmd.startsWith("node ") || cmd.startsWith("js ")) {
      const code = cmd.split(/\s+/).slice(1).join(" ");
      try {
        const result = eval(code);
        next.push(result === undefined ? "undefined" : String(result));
      } catch (e) { next.push(`node: ${(e as Error).message}`); }
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
          <input
            className={styles.monacoTermInputField}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { run(input); setInput(""); } }}
            autoFocus
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

/* ---- Tree item renderer ---- */
function TreeItem({
  node,
  depth,
  activeFile,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activeFile: string | null;
  onSelect: (file: VirtualFile) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);

  if (node.type === "folder") {
    return (
      <div>
        <button
          type="button"
          className={styles.monacoTreeItem}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {expanded ? <FolderOpen size={14} /> : <Folder size={14} />}
          <span>{node.name}</span>
        </button>
        {expanded && node.children?.map((child) => (
          <TreeItem key={child.name} node={child} depth={depth + 1} activeFile={activeFile} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.monacoTreeItem} ${activeFile === node.name ? styles.monacoTreeItemActive : ""}`}
      style={{ paddingLeft: `${12 + depth * 16 + 18}px` }}
      onClick={() => node.file && onSelect(node.file)}
    >
      {iconForFile(node.name)}
      <span>{node.name}</span>
    </button>
  );
}

interface MonacoAppProps {
  file?: string;
  content?: string;
}

export default function MonacoApp({ file, content }: MonacoAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [monaco, setMonaco] = useState<typeof Monaco | null>(null);
  const [status, setStatus] = useState("Loading Monaco…");
  const [position, setPosition] = useState("Ln 1, Col 1");
  const [lineCount, setLineCount] = useState(1);
  const [langLabel, setLangLabel] = useState("");

  // Multi-file tabs
  const [openFiles, setOpenFiles] = useState<VirtualFile[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);

  const fileName = file ?? activeTab ?? "untitled.txt";
  const lang = useMemo(() => languageOf(fileName), [fileName]);

  // If a file is passed via props, open it directly
  useEffect(() => {
    if (file && content) {
      const vf: VirtualFile = { name: file, language: languageOf(file), content };
      setOpenFiles((prev) => {
        if (prev.some((f) => f.name === file)) return prev;
        return [...prev, vf];
      });
      setActiveTab(file);
    }
  }, [file, content]);

  // Boot Monaco
  useEffect(() => {
    let alive = true;
    loader.config({ paths: { vs: CDN.MONACO.vs } });
    loader.init().then((instance) => {
      if (alive) { setMonaco(instance); setStatus(""); }
    }).catch(() => {
      if (alive) setStatus("Failed to load Monaco");
    });
    return () => { alive = false; };
  }, []);

  // Create editor
  useEffect(() => {
    const container = containerRef.current;
    if (!monaco || !container) return;

    // Get initial content
    const virtualFile = VIRTUAL_FILES.find((f) => f.name === fileName);
    const storedFile = file ? readFiles().find((f) => f.name === file) : undefined;
    const initialContent = content ?? storedFile?.content ?? virtualFile?.content ?? "";

    const editor = monaco.editor.create(container, {
      value: initialContent,
      language: virtualFile?.language ?? lang,
      theme: "vs-dark",
      automaticLayout: true,
      fontSize: 13,
      fontFamily: "'SF Mono', 'JetBrains Mono', Menlo, monospace",
      fontLigatures: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      renderWhitespace: "none",
      smoothScrolling: true,
      cursorBlinking: "smooth",
      padding: { top: 8 },
      bracketPairColorization: { enabled: true },
      tabSize: 2,
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
      editor.getModel()?.dispose();
      editor.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco]);

  // Save
  const save = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !file) return;
    saveFileContent(file, editor.getValue());
    setStatus("Saved ✓");
    window.setTimeout(() => setStatus(""), 1600);
  }, [file]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  // Open file from explorer
  const openExplorerFile = (vf: VirtualFile) => {
    setOpenFiles((prev) => {
      if (prev.some((f) => f.name === vf.name)) return prev;
      return [...prev, vf];
    });
    setActiveTab(vf.name);
  };

  // Close tab
  const closeTab = (name: string) => {
    setOpenFiles((prev) => prev.filter((f) => f.name !== name));
    if (activeTab === name) {
      setOpenFiles((prev) => {
        const remaining = prev.filter((f) => f.name !== name);
        setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].name : null);
        return remaining;
      });
    }
  };

  return (
    <div className={styles.monacoVscode}>
      {/* Sidebar: Explorer | Search | Extensions */}
      <div className={styles.monacoSidebar}>
        <button type="button" className={`${styles.monacoSidebarIcon} ${explorerOpen ? styles.monacoSidebarIconActive : ""}`}
          onClick={() => setExplorerOpen(!explorerOpen)} title="Explorer">
          <Folder size={18} />
        </button>
        <button type="button" className={styles.monacoSidebarIcon} title="Search">
          <Search size={18} />
        </button>
        <button type="button" className={`${styles.monacoSidebarIcon} ${terminalOpen ? styles.monacoSidebarIconActive : ""}`}
          onClick={() => setTerminalOpen(!terminalOpen)} title="Terminal">
          <TerminalSquare size={18} />
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" className={styles.monacoSidebarIcon} title="Settings">
          <Settings size={18} />
        </button>
      </div>

      {/* File explorer panel */}
      {explorerOpen && (
        <div className={styles.monacoExplorer}>
          <div className={styles.monacoExplorerHeader}>EXPLORER</div>
          <div className={styles.monacoTree}>
            {FILE_TREE.map((node) => (
              <TreeItem key={node.name} node={node} depth={0} activeFile={activeTab} onSelect={openExplorerFile} />
            ))}
          </div>
        </div>
      )}

      {/* Main editor area */}
      <div className={styles.monacoMain}>
        {/* Tab bar */}
        <div className={styles.monacoTabBar}>
          {openFiles.map((f) => (
            <button
              key={f.name}
              type="button"
              className={`${styles.monacoTab} ${activeTab === f.name ? styles.monacoTabActive : ""}`}
              onClick={() => setActiveTab(f.name)}
            >
              {iconForFile(f.name)}
              <span>{f.name}</span>
              <button type="button" className={styles.monacoTabClose}
                onClick={(e) => { e.stopPropagation(); closeTab(f.name); }}>
                <X size={12} />
              </button>
            </button>
          ))}
          <button type="button" className={styles.monacoTabNew} title="New file">
            <Plus size={14} />
          </button>
        </div>

        {/* Editor */}
        <div ref={containerRef} className={styles.monacoBody} />

        {/* Status bar */}
        <div className={styles.monacoStatusbar}>
          <span>{langLabel || lang}</span>
          <span className={styles.monacoStatusbarSpacer} />
          <span>{status || `Ln ${lineCount}, ${position}`}</span>
          {!file && <span className={styles.monacoStatusbarRight}>New file</span>}
          {file && (
            <button type="button" onClick={save} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Save size={12} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Integrated terminal panel */}
      {terminalOpen && <MiniTerminal />}
    </div>
  );
}
