import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { NOTES, type Note } from "@/constants/desktop";
import styles from "@/styles/components/desktop/apps.module.css";

const STORAGE_KEY = "aryan-os-notes";

function loadNotes(): Note[] {
  if (typeof window === "undefined") return NOTES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Note[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore corrupted storage */
  }
  return NOTES;
}

/** Notes with real editing: rename, rewrite, add — all persisted to localStorage. */
export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [active, setActive] = useState(0);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (notes.length === 0) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      } catch {
        /* storage unavailable */
      }
    }, 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [notes]);

  const note = notes[Math.min(active, notes.length - 1)];

  const update = (patch: Partial<Pick<Note, "title" | "body">>) => {
    setNotes((list) =>
      list.map((n, i) => (i === active ? { ...n, ...patch, date: "Today" } : n)),
    );
  };

  const newNote = () => {
    setNotes((list) => [
      { title: "New Note", date: "Today", body: "" },
      ...list,
    ]);
    setActive(0);
  };

  /* macOS Tahoe Notes: Markdown import/export (research: Notes gained
     Markdown in macOS 26). Export downloads the active note as a .md file;
     import reads an .md file into a fresh note. */
  const exportMd = () => {
    const md = `# ${note.title}\n\n${note.body.trim()}\n`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/[^\w\- ]+/g, "").trim() || "note"}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importMd = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const firstLine = text.split(/\r?\n/)[0] ?? "";
      const title = firstLine.replace(/^#\s*/, "").trim() || file.name.replace(/\.md$/i, "") || "Imported Note";
      const body = text.split(/\r?\n/).slice(firstLine.startsWith("#") ? 1 : 0).join("\n").trim();
      setNotes((list) => [{ title, date: "Today", body }, ...list]);
      setActive(0);
    };
    reader.readAsText(file);
  };

  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.notes}>
      <aside className={styles.notesList}>
        <div className={styles.notesHeader}>
          <strong>Notes</strong>
          <div className={styles.notesHeaderActions}>
            <button
              type="button"
              className={styles.notesNew}
              onClick={() => fileRef.current?.click()}
              title="Import Markdown…"
              aria-label="Import Markdown"
            >
              <Upload size={13} />
            </button>
            <button
              type="button"
              className={styles.notesNew}
              onClick={exportMd}
              title="Export as Markdown"
              aria-label="Export as Markdown"
            >
              <Download size={13} />
            </button>
            <button type="button" className={styles.notesNew} onClick={newNote}>
              New Note
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importMd(f);
              e.target.value = "";
            }}
          />
        </div>
        {notes.map((n, i) => (
          <button
            key={`${n.title}-${i}`}
            type="button"
            className={`${styles.noteItem} ${
              i === active ? styles.noteItemActive : ""
            }`}
            onClick={() => setActive(i)}
          >
            <strong>{n.title || "Untitled"}</strong>
            <span className={styles.noteDate}>{n.date}</span>
          </button>
        ))}
      </aside>
      <div className={styles.noteBody}>
        <input
          className={styles.noteTitleInput}
          value={note.title}
          onChange={(e) => update({ title: e.target.value })}
          aria-label="Note title"
          spellCheck={false}
        />
        <p className={styles.noteDate}>{note.date}</p>
        <textarea
          className={styles.noteEditor}
          value={note.body}
          onChange={(e) => update({ body: e.target.value })}
          placeholder="Start writing…"
          aria-label="Note body"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
