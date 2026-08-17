"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import loader from "@monaco-editor/loader";
import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";
import { readFiles, saveFileContent } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Monaco — the real Microsoft Monaco editor (the same engine VS Code is built
 * on), ported from daedalOS. The `vs` runtime is served locally from
 * /aryan/apps/monaco/vs so it works fully offline, files open by name from the
 * Finder file system, and ⌘S / Ctrl+S saves back to it. Status bar shows the
 * language, line count and cursor position like daedalOS's.
 */

/** Extension → Monaco language id. */
const EXT_TO_LANG: Record<string, string> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  mts: "typescript",
  cts: "typescript",
  tsx: "typescript",
  json: "json",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  less: "less",
  md: "markdown",
  java: "java",
  py: "python",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  go: "go",
  rs: "rust",
  php: "php",
  rb: "ruby",
  sql: "sql",
  xml: "xml",
  yml: "yaml",
  yaml: "yaml",
  toml: "ini",
  ini: "ini",
  cfg: "ini",
  txt: "plaintext",
};

function languageOf(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_LANG[ext] ?? "plaintext";
}

interface MonacoAppProps {
  /** File name in the Finder docs folder (e.g. "App.tsx"). */
  file?: string;
  /** Optional content for a new file. */
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

  // Resolve the file's current content by name (same as Vim/TextEdit).
  const initialContent =
    content ??
    (file ? readFiles().find((f) => f.name === file)?.content : undefined);
  const fileName = file ?? "untitled.txt";

  const lang = useMemo(() => languageOf(fileName), [fileName]);

  // Boot Monaco once — the loader points at the local vs runtime so the
  // editor works completely offline (daedalOS serves it locally too).
  useEffect(() => {
    let alive = true;
    loader.config({ paths: { vs: "/aryan/apps/monaco/vs" } });
    loader
      .init()
      .then((instance) => {
        if (alive) {
          setMonaco(instance);
          setStatus("");
        }
      })
      .catch(() => {
        if (alive) setStatus("Failed to load Monaco");
      });
    return () => {
      alive = false;
    };
  }, []);

  // Create the editor once Monaco is ready.
  useEffect(() => {
    const container = containerRef.current;
    if (!monaco || !container) return;

    const editor = monaco.editor.create(container, {
      value: initialContent ?? "",
      language: lang,
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

    // Live status bar updates.
    const updatePosition = () => {
      const sel = editor.getSelection();
      if (!sel) return;
      const { positionColumn: col, positionLineNumber: line } = sel;
      const text = editor.getModel()?.getValueInRange(sel) ?? "";
      setPosition(`Ln ${line}, Col ${col}${text ? ` (${text.length} sel)` : ""}`);
    };
    const updateLineCount = () =>
      setLineCount(editor.getModel()?.getLineCount() ?? 1);
    const model = editor.getModel();
    const langId = model?.getLanguageId() ?? "";
    if (langId) setLangLabel(langId);

    const d1 = editor.onDidChangeCursorPosition(updatePosition);
    const d2 = editor.onDidChangeModelContent(updateLineCount);
    editor.focus();

    return () => {
      d1.dispose();
      d2.dispose();
      editor.getModel()?.dispose();
      editor.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco]);

  // Save — ⌘S / Ctrl+S and the toolbar button (daedalOS getSaveFileInfo).
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
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  return (
    <div className={styles.monaco}>
      <div className={styles.monacoToolbar}>
        <span className={styles.monacoFile}>
          <span className={styles.monacoDot} aria-hidden="true" />
          {fileName}
        </span>
        <div className={styles.monacoToolbarRight}>
          <span className={styles.monacoLang}>{langLabel || lang}</span>
          <button type="button" className={styles.monacoSaveBtn} onClick={save}>
            Save
          </button>
          {status && <span className={styles.monacoStatus}>{status}</span>}
        </div>
      </div>
      <div ref={containerRef} className={styles.monacoBody} />
      <div className={styles.monacoStatusbar}>
        <span>Ln {lineCount} lines</span>
        <span className={styles.monacoStatusbarSpacer} />
        <span>{position}</span>
        <span className={styles.monacoStatusbarSpacer} />
        <span>{langLabel || lang} · UTF-8</span>
        {!file && (
          <span className={styles.monacoStatusbarRight}>New file — save not wired</span>
        )}
      </div>
    </div>
  );
}
