import { useEffect, useRef, useState } from "react";
import { ClipboardList, Search, SlidersHorizontal, Copy, Trash2 } from "lucide-react";
import { DESKTOP_APPS, SPOTLIGHT_ITEMS } from "@/constants/desktop";
import AppIcon from "@/components/desktop/AppIcon";
import Glyph from "@/components/desktop/Glyph";
import { clearClipHistory, readClipHistory, type ClipEntry } from "@/utils/clipboardHistory";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface SpotlightProps {
  onPick: (action: string) => void;
  onClose: () => void;
}

/** macOS Tahoe Spotlight browse modes — Apps / Files / Actions / Clipboard. */
type BrowseMode = "apps" | "files" | "actions" | "clipboard";

const BROWSE_MODES: { id: BrowseMode; label: string; key: string; icon: React.ReactNode }[] = [
  { id: "apps", label: "Apps", key: "⌘1", icon: <Glyph id="grid" size={13} /> },
  { id: "files", label: "Files", key: "⌘2", icon: <Glyph id="file-text" size={13} /> },
  { id: "actions", label: "Actions", key: "⌘3", icon: <SlidersHorizontal size={13} /> },
  { id: "clipboard", label: "Clipboard", key: "⌘4", icon: <ClipboardList size={13} /> },
];

/** macOS Tahoe Spotlight: ⌘K / ⌘Space launcher with browse modes + history. */
export default function Spotlight({ onPick, onClose }: SpotlightProps) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [mode, setMode] = useState<BrowseMode | null>(null);
  const [showModes, setShowModes] = useState(false);
  const [clip, setClip] = useState<ClipEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load clipboard history when the panel opens, and refresh it every time
  // the Clipboard browse mode is entered (new ⌘C events may have landed).
  useEffect(() => {
    setClip(readClipHistory());
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (mode === "clipboard") setClip(readClipHistory());
  }, [mode]);

  const results = SPOTLIGHT_ITEMS.filter(
    (item) =>
      !query.trim() ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 14);

  const topHit = results[0];
  const rest = results.slice(1);
  const apps = rest.filter((r) => r.action.startsWith("app:"));
  const files = rest.filter((r) => r.id.startsWith("file-"));
  const actions = rest.filter(
    (r) => !r.action.startsWith("app:") && !r.id.startsWith("file-"),
  );

  interface FlatEntry {
    section: string;
    item: (typeof SPOTLIGHT_ITEMS)[number];
  }

  // Search results grouped (Top Hit / Applications / Files / Actions), or a
  // single browse mode when one is selected.
  const flat: FlatEntry[] = [];
  if (mode === "apps") {
    SPOTLIGHT_ITEMS.filter((r) => r.action.startsWith("app:"))
      .filter((r) => !query.trim() || r.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 30)
      .forEach((item) => flat.push({ section: "Applications", item }));
  } else if (mode === "files") {
    SPOTLIGHT_ITEMS.filter((r) => r.id.startsWith("file-"))
      .filter((r) => !query.trim() || r.title.toLowerCase().includes(query.toLowerCase()))
      .forEach((item) => flat.push({ section: "Files", item }));
  } else if (mode === "actions") {
    SPOTLIGHT_ITEMS.filter((r) => !r.action.startsWith("app:") && !r.id.startsWith("file-"))
      .filter((r) => !query.trim() || r.title.toLowerCase().includes(query.toLowerCase()))
      .forEach((item) => flat.push({ section: "Actions", item }));
  } else {
    if (topHit) flat.push({ section: "Top Hit", item: topHit });
    apps.forEach((item) => flat.push({ section: "Applications", item }));
    files.forEach((item) => flat.push({ section: "Files", item }));
    actions.forEach((item) => flat.push({ section: "Actions", item }));
  }

  useEffect(() => {
    setActiveIdx(0);
  }, [query, mode]);

  const pick = (action: string) => {
    onPick(action);
    onClose();
  };

  const copyClip = async (entry: ClipEntry) => {
    try {
      await navigator.clipboard.writeText(entry.text);
    } catch {
      // Best effort — clipboard may be unavailable.
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Tahoe browse-mode shortcuts: ⌘1-4.
    if (e.metaKey && /^[1-4]$/.test(e.key)) {
      e.preventDefault();
      const m = BROWSE_MODES[Number(e.key) - 1].id;
      setMode(m);
      setQuery("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (mode === "clipboard") return;
      setActiveIdx((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (mode === "clipboard") return;
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (mode === "clipboard") {
        const entry = clip[activeIdx];
        if (entry) void copyClip(entry);
        return;
      }
      const entry = flat[activeIdx];
      if (entry) pick(entry.item.action);
    } else if (e.key === "Escape") {
      if (mode) setMode(null);
      else onClose();
    }
  };

  // Clipboard panel — the practical Tahoe addition.
  const filteredClip =
    mode === "clipboard"
      ? clip.filter(
          (c) =>
            !query.trim() ||
            c.text.toLowerCase().includes(query.toLowerCase()),
        )
      : [];

  return (
    <div className={styles.spotlightBackdrop} onClick={onClose}>
      <div
        className={styles.spotlight}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Spotlight"
      >
        <div className={styles.spotlightInput}>
          <Search size={22} strokeWidth={1.8} className={styles.spotlightSearchIcon} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setShowModes(true)}
            onMouseEnter={() => setShowModes(true)}
            onMouseLeave={() => setShowModes(false)}
            placeholder={
              mode === "clipboard"
                ? "Search Clipboard"
                : mode
                  ? `Browse ${BROWSE_MODES.find((b) => b.id === mode)?.label}`
                  : "Spotlight Search"
            }
            spellCheck={false}
            autoComplete="off"
          />
          {/* Browse-mode chips (macOS shows them when you hover the field). */}
          {(showModes || mode) && (
            <div className={styles.spotlightModes}>
              {BROWSE_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`${styles.spotlightMode} ${
                    mode === m.id ? styles.spotlightModeActive : ""
                  }`}
                  title={m.key}
                  onClick={() => {
                    setMode(m.id);
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {mode === "clipboard" ? (
          <div className={styles.spotlightResults}>
            {filteredClip.length === 0 && (
              <div className={styles.spotlightEmpty}>
                {clip.length === 0
                  ? "Nothing copied yet — ⌘C something and it shows up here."
                  : `No clipboard matches “${query}”`}
              </div>
            )}
            {filteredClip.map((entry, i) => (
              <button
                key={entry.id}
                type="button"
                className={`${styles.spotlightItem} ${
                  i === activeIdx ? styles.spotlightItemActive : ""
                }`}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => void copyClip(entry)}
                onDoubleClick={() => void copyClip(entry)}
                title="Click to copy · ⌘V to paste"
              >
                <span className={styles.spotlightGlyph}>
                  <Copy size={14} />
                </span>
                <span className={styles.spotlightText}>
                  <strong className={styles.spotlightClipText}>
                    {entry.text}
                  </strong>
                  <small>
                    {new Date(entry.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </span>
                <button
                  type="button"
                  className={styles.spotlightClipDelete}
                  aria-label="Remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = clip.filter((c) => c.id !== entry.id);
                    setClip(next);
                    try {
                      window.localStorage.setItem(
                        "aryanos.clipboard",
                        JSON.stringify(next),
                      );
                    } catch {
                      // ignore
                    }
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </button>
            ))}
            {clip.length > 0 && (
              <button
                type="button"
                className={styles.spotlightClearClip}
                onClick={() => {
                  clearClipHistory();
                  setClip([]);
                }}
              >
                Clear Clipboard History
              </button>
            )}
          </div>
        ) : flat.length > 0 ? (
          <div className={styles.spotlightResults}>
            {flat.map(({ section, item }, i) => {
              const showHeader = i === 0 || flat[i - 1].section !== section;
              return (
                <div key={item.id}>
                  {showHeader && (
                    <div className={styles.spotlightSection}>{section}</div>
                  )}
                  <button
                    type="button"
                    className={`${styles.spotlightItem} ${
                      i === activeIdx ? styles.spotlightItemActive : ""
                    }`}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => pick(item.action)}
                  >
                    {item.action.startsWith("app:") ? (
                      <AppIcon
                        app={DESKTOP_APPS.find((a) => a.id === item.action.slice(4))!}
                        size={34}
                      />
                    ) : (
                      <span className={styles.spotlightGlyph}>
                        <Glyph id={item.icon} size={18} />
                      </span>
                    )}
                    <span className={styles.spotlightText}>
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </span>
                    <span className={styles.spotlightEnter}>⏎</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.spotlightEmpty}>No results for “{query}”</div>
        )}
      </div>
    </div>
  );
}
