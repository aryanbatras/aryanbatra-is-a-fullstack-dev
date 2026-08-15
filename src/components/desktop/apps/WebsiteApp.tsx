"use client";

import { useRef, useState } from "react";
import styles from "@/styles/components/desktop/apps.module.css";

const HOME = "/legacy";

const BOOKMARKS = [
  { label: "Portfolio", url: HOME, emoji: "🏠" },
  { label: "3D", url: "/3d", emoji: "🧊" },
  { label: "Piano", url: "https://online-piano-two.vercel.app", emoji: "🎹" },
  { label: "Browser AI", url: "https://browser-ai-dun.vercel.app", emoji: "🤖" },
  { label: "Weekend Movers", url: "https://weekend-movers.vercel.app", emoji: "🚚" },
  { label: "StartX", url: "https://startx-zeta.vercel.app", emoji: "🚀" },
  { label: "Book of Rose", url: "https://bookofrose.vercel.app", emoji: "🌹" },
  { label: "GitHub", url: "https://github.com/aryanbatras", emoji: "🐙" },
  { label: "LinkedIn", url: "https://linkedin.com/in/aryanbatra", emoji: "💼" },
  { label: "100xsystems", url: "https://100xsystems.dev", emoji: "📝" },
];

interface WebsiteAppProps {
  /** Where this browser window starts (a .url file was double-clicked). */
  initialUrl?: string;
}

/** A browser inside the machine — the classic site is the home page. */
export default function WebsiteApp({ initialUrl }: WebsiteAppProps) {
  const start = initialUrl && initialUrl !== HOME ? initialUrl : HOME;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [url, setUrl] = useState(start);
  const [history, setHistory] = useState<string[]>([start]);
  const [hIndex, setHIndex] = useState(0);
  const [input, setInput] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [addrFocused, setAddrFocused] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const loadTimer = useRef<number | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoFwd, setCanGoFwd] = useState(false);

  const normalize = (raw: string): string => {
    let u = raw.trim();
    if (!u) return HOME;
    if (u.startsWith("/")) return u;
    if (!/^[a-z]+:\/\//i.test(u)) u = "https://" + u;
    return u;
  };

  const navigate = (raw: string) => {
    const u = normalize(raw);
    if (u === url) return;
    const next = history.slice(0, hIndex + 1);
    next.push(u);
    setHistory(next);
    setHIndex(next.length - 1);
    setUrl(u);
    setInput("");
    setBlocked(false);
    startLoadWatch();
  };

  const go = (dir: -1 | 1) => {
    const i = hIndex + dir;
    if (i < 0 || i >= history.length) return;
    setHIndex(i);
    setUrl(history[i]);
    setInput("");
    setBlocked(false);
    startLoadWatch();
  };

  const startLoadWatch = () => {
    if (loadTimer.current) window.clearTimeout(loadTimer.current);
    setBlocked(false);
    loadTimer.current = window.setTimeout(() => {
      // A cross-origin site that refuses to be embedded never fires `load`.
      // After a grace period with no load event, assume it's blocked.
      const f = frameRef.current;
      if (f && f.contentDocument === null && !f.src.startsWith(location.origin)) {
        setBlocked(true);
      }
    }, 8000);
  };

  const onLoaded = () => {
    if (loadTimer.current) window.clearTimeout(loadTimer.current);
    setBlocked(false);
    // Cross-origin frames can't be inspected, but our own navigation stack
    // knows where we can go back/forward.
    setCanGoBack(hIndex > 0);
    setCanGoFwd(hIndex < history.length - 1);
  };

  return (
    <div className={styles.website}>
      <div className={styles.websiteToolbar}>
        <div className={styles.websiteNavBtns}>
          <button
            type="button"
            className={styles.websiteNavBtn}
            aria-label="Back"
            onClick={() => go(-1)}
            style={{ opacity: canGoBack || hIndex > 0 ? 1 : 0.4 }}
          >
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
              <path d="M10.7 2.3 5.4 7.6a1 1 0 0 0 0 1.4l5.3 5.3a1 1 0 0 0 1.7-.7V3a1 1 0 0 0-1.7-.7Z" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.websiteNavBtn}
            aria-label="Forward"
            onClick={() => go(1)}
            style={{ opacity: canGoFwd || hIndex < history.length - 1 ? 1 : 0.4 }}
          >
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
              <path d="M5.3 2.3 10.6 7.6a1 1 0 0 1 0 1.4l-5.3 5.3A1 1 0 0 1 3.6 13V3a1 1 0 0 1 1.7-.7Z" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.websiteNavBtn}
            aria-label="Reload page"
            onClick={() => {
              setReloadKey((k) => k + 1);
              startLoadWatch();
            }}
          >
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1.8v3.2h-3.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.websiteNavBtn}
            aria-label="Go home"
            onClick={() => navigate(HOME)}
          >
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
              <path d="M8 2 2.5 6.9v6.3h3.6v-4h3.8v4h3.6V6.9L8 2Z" />
            </svg>
          </button>
        </div>
        <div
          className={`${styles.websiteAddr} ${addrFocused ? styles.websiteAddrFocused : ""}`}
          onClick={() => {
            setAddrFocused(true);
            const el = document.getElementById("website-addr") as HTMLInputElement | null;
            el?.focus();
            el?.select();
          }}
          onBlur={() => setAddrFocused(false)}
        >
          <span className={styles.websiteAddrLock}>
            <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
          </span>
          <input
            id="website-addr"
            className={styles.websiteAddrInput}
            value={addrFocused ? input : url}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
                navigate(input);
              }
            }}
            placeholder="Search or enter a URL…"
            readOnly={!addrFocused}
            aria-label="Address"
          />
          <span className={styles.websiteAddrShield} aria-hidden="true">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor">
              <path d="M8 1.5 13 3.5v3.2c0 3.4-2.2 6-5 7.3-2.8-1.3-5-3.9-5-7.3V3.5L8 1.5Zm0 2.2v8.1c1.7-1 3-2.9 3-5.2V4.8L8 3.7Z" />
            </svg>
          </span>
        </div>
        <div className={styles.websiteActions}>
          <button type="button" className={styles.websiteNavBtn} aria-label="Share">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
              <path d="M8 1.8 11 5l-.9.9L8.6 4.2v6.1h-1.2V4.2L5.9 5.9 5 5l3-3.2Zm-5 5h3.6v1.2H3.2v6h9.6v-6H9.4V6.8H13a.8.8 0 0 1 .8.8v6.6a.8.8 0 0 1-.8.8H3a.8.8 0 0 1-.8-.8V7.6A.8.8 0 0 1 3 6.8Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.websiteBookmarks}>
        {BOOKMARKS.map((b) => (
          <button
            key={b.url}
            type="button"
            className={`${styles.websiteBookmark} ${
              url === b.url ? styles.websiteBookmarkActive : ""
            }`}
            onClick={() => navigate(b.url)}
          >
            <span aria-hidden>{b.emoji}</span> {b.label}
          </button>
        ))}
      </div>

      <div className={styles.websiteFrameWrap}>
        {blocked && (
          <div className={styles.websiteBlocked}>
            <strong>This site refused to be embedded</strong>
            <p>
              {url} blocks being shown inside another page. Try the Portfolio
              home page, or open it in a new tab.
            </p>
            <div className={styles.websiteBlockedBtns}>
              <button
                type="button"
                className={styles.gameBtn}
                onClick={() => navigate(HOME)}
              >
                Go to Portfolio
              </button>
              <a
                className={styles.gameBtn}
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "none" }}
              >
                Open in new tab ↗
              </a>
              <button
                type="button"
                className={styles.gameBtn}
                onClick={() => setBlocked(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <iframe
          key={`${url}|${reloadKey}`}
          ref={frameRef}
          src={url}
          title="Aryan Batra — Browser"
          className={styles.websiteFrame}
          onLoad={onLoaded}
        />
      </div>
    </div>
  );
}
