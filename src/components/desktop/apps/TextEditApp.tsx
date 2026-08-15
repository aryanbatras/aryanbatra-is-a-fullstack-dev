"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, FilePlus2, Plus, Save } from "lucide-react";
import MarkdownPreview from "@/components/desktop/MarkdownPreview";
import { README_TEXT, RESUME } from "@/constants/desktop";
import { highlightLine, langFromName, type HighlightLang } from "@/utils/syntaxHighlight";
import { readFiles, saveFileContent } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

interface Doc {
  name: string;
  content: string;
  /** Whether the content came from the built-in set (vs user-created). */
  builtin: boolean;
}

const DOCS_KEY = "aryanos.textedit.docs";

/** Files that ship with the machine — editable, but reset on "New". */
const BUILTIN_DOCS: Doc[] = [
  {
    name: "README.txt",
    content: README_TEXT,
    builtin: true,
  },
  {
    name: "About Me.txt",
    content: RESUME.summary,
    builtin: true,
  },
  {
    name: "notes.md",
    content: `# Working Notes

Notes I keep while building this machine.

## The scroll-scrub film

The showreel is encoded **all-intra** — every single frame is a keyframe — so
scrubbing via \`currentTime\` decodes exactly one frame per seek. No buffering,
no black frames, no flicker. The chapters are stitched into one file, so the
transitions are seamless by construction.

## Design rules

1. One accent colour max.
2. Motion explains hierarchy.
3. Black and white first; colour only when it earns its place.
4. Every animation answers to the scroll, not the clock.

## Build

- \`npm run dev\` — local dev server
- \`npm run build\` — production build
- \`scripts/build-showreel.sh\` — re-encodes the films as all-intra + 60fps
`,
    builtin: true,
  },
  {
    name: "sample.ts",
    content: `// A tiny taste of the stack — TypeScript, obviously.
interface Engineer {
  name: string;
  focus: string[];
}

const aryan: Engineer = {
  name: "Aryan Batra",
  focus: ["backend infrastructure", "distributed systems", "3D graphics"],
};

function build<T>(input: T): T {
  // Ship it.
  return input;
}

export const machine = build(aryan);
`,
    builtin: true,
  },
];

function loadDocs(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DOCS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveDocs(docs: Record<string, string>) {
  try {
    window.localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  } catch {
    // Best effort — quota exceeded just means no persistence.
  }
}

interface TextEditAppProps {
  /** Open a specific document by name (from Finder or Terminal). */
  initialDoc?: string;
  /** Content to seed a new document (Finder "New Text Document"). */
  initialContent?: string;
}

export default function TextEditApp({ initialDoc, initialContent }: TextEditAppProps) {
  // name -> { builtin, content } — saved contents overlay the built-ins.
  const [openTabs, setOpenTabs] = useState<Doc[]>(() => {
    const saved = loadDocs();
    const custom = readFiles();
    const byName = new Map<string, Doc>();
    BUILTIN_DOCS.forEach((d) => byName.set(d.name, d));
    custom.forEach((f) => {
      if (f.kind !== "Plain Text" && f.kind !== "Markdown") return;
      byName.set(f.name, { name: f.name, content: f.content, builtin: false });
    });
    Object.entries(saved).forEach(([name, content]) => {
      const existing = byName.get(name);
      byName.set(name, { name, content, builtin: existing?.builtin ?? false });
    });
    const tabs = [...byName.values()];
    // Seed a brand-new doc if requested (Finder "New Text Document").
    if (initialDoc && !byName.has(initialDoc)) {
      tabs.unshift({ name: initialDoc, content: initialContent ?? "", builtin: false });
    }
    return tabs;
  });
  const [activeName, setActiveName] = useState<string>(() => initialDoc ?? "README.txt");
  const [preview, setPreview] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = openTabs.find((d) => d.name === activeName) ?? openTabs[0];

  const setContent = (content: string) => {
    setOpenTabs((tabs) =>
      tabs.map((d) => (d.name === active?.name ? { ...d, content } : d)),
    );
  };

  const save = () => {
    if (!active) return;
    const all = loadDocs();
    all[active.name] = active.content;
    saveDocs(all);
    // If this doc is also a Finder file, keep Finder in sync.
    saveFileContent(active.name, active.content);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const newDoc = () => {
    const name = `Untitled ${openTabs.filter((d) => d.name.startsWith("Untitled")).length + 1}.txt`;
    const doc: Doc = { name, content: "", builtin: false };
    setOpenTabs((tabs) => [...tabs, doc]);
    setActiveName(name);
    setPreview(false);
    window.setTimeout(() => taRef.current?.focus(), 30);
  };

  // Cursor position for the status bar.
  const [pos, setPos] = useState({ line: 1, col: 1 });
  const onCursor = (ta: HTMLTextAreaElement) => {
    const upTo = ta.value.slice(0, ta.selectionStart);
    const line = upTo.split("\n").length;
    const col = upTo.length - upTo.lastIndexOf("\n");
    setPos({ line, col });
  };

  const lang: HighlightLang = useMemo(
    () => (active ? langFromName(active.name) : "plaintext"),
    [active],
  );

  // Keep the highlighted <pre> scrolled in sync with the textarea.
  const onScroll = () => {
    if (scrollRef.current) {
      const pre = scrollRef.current.querySelector<HTMLElement>(`.${styles.texteditPre}`);
      if (pre) {
        pre.scrollTop = scrollRef.current.scrollTop;
        pre.scrollLeft = scrollRef.current.scrollLeft;
      }
    }
  };

  if (!active) {
    return (
      <div className={styles.textedit}>
        <div className={styles.texteditEmpty}>No document open.</div>
      </div>
    );
  }

  const lineCount = active.content.split("\n").length;

  return (
    <div className={styles.textedit}>
      {/* toolbar */}
      <div className={styles.texteditToolbar}>
        <div className={styles.texteditTabs}>
          {openTabs.map((d) => (
            <button
              key={d.name}
              type="button"
              className={`${styles.texteditTab} ${
                d.name === active.name ? styles.texteditTabActive : ""
              }`}
              onClick={() => {
                setActiveName(d.name);
                setPreview(false);
              }}
            >
              {d.name}
            </button>
          ))}
          <button
            type="button"
            className={styles.texteditTabNew}
            onClick={newDoc}
            aria-label="New document"
          >
            <Plus size={12} />
          </button>
        </div>
        <div className={styles.texteditToolbarRight}>
          {lang === "markdown" && (
            <button
              type="button"
              className={`${styles.texteditBtn} ${preview ? styles.texteditBtnActive : ""}`}
              onClick={() => setPreview((p) => !p)}
            >
              <Eye size={13} /> {preview ? "Edit" : "Preview"}
            </button>
          )}
          <button type="button" className={styles.texteditBtn} onClick={save}>
            <Save size={13} /> Save
          </button>
          {savedFlash && <span className={styles.texteditSaved}>Saved ✓</span>}
        </div>
      </div>

      {/* body */}
      {preview ? (
        <div className={styles.texteditPreviewScroll}>
          <MarkdownPreview text={active.content} />
        </div>
      ) : (
        <div className={styles.texteditBody} ref={scrollRef} onScroll={onScroll}>
          <pre className={styles.texteditPre} aria-hidden="true">
            {active.content.split("\n").map((line, i) => (
              <div key={i} className={styles.texteditLine}>
                <span className={styles.texteditGutter}>{i + 1}</span>
                <code className={styles.texteditCode}>
                  {highlightLine(lang, line, `${i}`)}
                  {"\n"}
                </code>
              </div>
            ))}
          </pre>
          <textarea
            ref={taRef}
            className={styles.texteditArea}
            value={active.content}
            onChange={(e) => {
              setContent(e.target.value);
              onCursor(e.target);
            }}
            onKeyUp={(e) => onCursor(e.currentTarget)}
            onClick={(e) => onCursor(e.currentTarget)}
            onSelect={(e) => onCursor(e.currentTarget)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={`Editing ${active.name}`}
          />
        </div>
      )}

      {/* status bar */}
      <div className={styles.texteditStatus}>
        <span>
          {lineCount} lines · {pos.line}:{pos.col}
        </span>
        <span className={styles.texteditStatusLang}>
          {lang === "markdown" ? "Markdown" : lang === "plaintext" ? "Plain Text" : lang}
          {" · UTF-8"}
        </span>
        <span className={styles.texteditStatusSpacer} />
        <span className={styles.texteditStatusRight}>
          <FilePlus2 size={11} /> {active.builtin ? "Built-in document" : "Your document"}
        </span>
      </div>
    </div>
  );
}


