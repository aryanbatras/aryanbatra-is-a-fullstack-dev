/**
 * Clipboard history — macOS Tahoe Spotlight's Clipboard browse mode (⌘4).
 * Copies and cuts are captured (max 50, trimmed to 8 KB each) and persisted
 * so the Spotlight clipboard panel can search and re-copy them.
 */

export interface ClipEntry {
  id: string;
  text: string;
  /** ISO timestamp of when it was copied. */
  at: string;
}

const CLIP_KEY = "aryanos.clipboard";
const MAX_ENTRIES = 50;
const MAX_LEN = 8000;

export function readClipHistory(): ClipEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CLIP_KEY);
    const list = raw ? (JSON.parse(raw) as ClipEntry[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeClip(list: ClipEntry[]) {
  try {
    window.localStorage.setItem(CLIP_KEY, JSON.stringify(list));
  } catch {
    // Quota — best effort.
  }
}

export function pushClip(text: string) {
  const t = (text || "").trim();
  if (!t) return;
  if (t.length > MAX_LEN) t.slice(0, MAX_LEN);
  const list = readClipHistory().filter((e) => e.text !== t);
  list.unshift({ id: `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, text: t, at: new Date().toISOString() });
  writeClip(list.slice(0, MAX_ENTRIES));
}

export function clearClipHistory() {
  writeClip([]);
}

export function removeClip(id: string) {
  writeClip(readClipHistory().filter((e) => e.id !== id));
}

/** Install the global copy/cut listener (call once from the desktop). */
export function installClipboardWatcher() {
  if (typeof window === "undefined") return () => undefined;
  const grab = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData("text/plain") ?? "";
    if (text.trim()) pushClip(text);
  };
  window.addEventListener("copy", grab);
  window.addEventListener("cut", grab);
  return () => {
    window.removeEventListener("copy", grab);
    window.removeEventListener("cut", grab);
  };
}
