import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { DESKTOP_APPS, SPOTLIGHT_ITEMS } from "@/constants/desktop";
import AppIcon from "@/components/desktop/AppIcon";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface SpotlightProps {
  onPick: (action: string) => void;
  onClose: () => void;
}

/** macOS Spotlight: ⌘K / ⌘Space launcher with fuzzy-ish search + keyboard nav. */
export default function Spotlight({ onPick, onClose }: SpotlightProps) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = SPOTLIGHT_ITEMS.filter(
    (item) =>
      !query.trim() ||
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 14);

  // macOS Tahoe groups results: Top Hit, then Applications / Files / Actions.
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
  const flat: FlatEntry[] = [];
  if (topHit) flat.push({ section: "Top Hit", item: topHit });
  apps.forEach((item) => flat.push({ section: "Applications", item }));
  files.forEach((item) => flat.push({ section: "Files", item }));
  actions.forEach((item) => flat.push({ section: "Actions", item }));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const pick = (action: string) => {
    onPick(action);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = flat[activeIdx];
      if (entry) pick(entry.item.action);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

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
            placeholder="Spotlight Search"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        {flat.length > 0 && (
          <div className={styles.spotlightResults}>
            {flat.map(({ section, item }, i) => {
              const showHeader =
                i === 0 || flat[i - 1].section !== section;
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
                      <span className={styles.spotlightGlyph}>{item.icon}</span>
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
        )}
        {flat.length === 0 && (
          <div className={styles.spotlightEmpty}>No results for “{query}”</div>
        )}
      </div>
    </div>
  );
}
