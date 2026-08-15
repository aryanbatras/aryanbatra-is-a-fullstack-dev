import { useEffect, useRef, useState } from "react";
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

  return (
    <div className={styles.notes}>
      <aside className={styles.notesList}>
        <div className={styles.notesHeader}>
          <strong>Notes</strong>
          <button type="button" className={styles.notesNew} onClick={newNote}>
            New Note
          </button>
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
