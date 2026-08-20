"use client";

import { useEffect, useRef, useState } from "react";
import Glyph from "@/components/desktop/Glyph";
import styles from "@/styles/components/desktop/apps.module.css";

/** Google's basic HTML mode — unlike the modern UI it sends no X-Frame-Options,
 *  so it actually embeds in an iframe (the daedalOS trick for running Google). */
const GOOGLE_HOME = "https://www.google.com/webhp?igu=1";
const GOOGLE_SEARCH = "https://www.google.com/search?igu=1&q=";

/** Safari's home page — Google, like every fresh Mac. The portfolio (and
 *  every other site) lives in the bookmarks bar and as .url files in Finder. */
const HOME = GOOGLE_HOME;

/** daedalOS proxy modes — re-serve pages so sites that block iframes work. */
type ProxyMode = "direct" | "ourproxy" | "corsproxy" | "allorigins" | "wayback" | `oldnet_${number}`;

const OLD_NET_YEARS = [
  1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
  2009, 2010, 2011, 2012,
];

/** theoldnet.com re-renders a page the way it looked in a given year. */
const OLD_NET_PROXY =
  "https://theoldnet.com/get?scripts=true&decode=true&year=<year>&url=";

/** Proxy menu is grouped — general proxies, then the Old Net time machine. */
const PROXY_GROUPS: { label: string; modes: ProxyMode[] }[] = [
  { label: "Proxy", modes: ["direct", "ourproxy", "corsproxy", "allorigins", "wayback"] },
  {
    label: "Old Net",
    modes: OLD_NET_YEARS.map((y) => `oldnet_${y}` as ProxyMode),
  },
];

const PROXY_LABEL: Record<ProxyMode, string> = {
  direct: "Direct",
  ourproxy: "Aryan Proxy",
  corsproxy: "CORS Proxy",
  allorigins: "AllOrigins",
  wayback: "Wayback Machine",
  ...Object.fromEntries(
    OLD_NET_YEARS.map((y) => [`oldnet_${y}`, `Old Net ${y}`]),
  ),
};

/** Wrap a URL in the selected proxy (daedalOS's PROXIES table). */
const proxify = async (url: string, mode: ProxyMode): Promise<string> => {
  if (mode === "direct") return url;
  if (mode === "ourproxy") {
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  }
  if (mode === "corsproxy") {
    return `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
  }
  if (mode === "allorigins") {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  }
  if (mode === "wayback") {
    try {
      const res = await fetch(
        `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
      );
      const data = (await res.json()) as {
        archived_snapshots?: { closest?: { url?: string } };
      };
      const snap = data?.archived_snapshots?.closest?.url;
      if (snap) return snap.replace(/^http:/, "https:");
    } catch {
      // Fall through to the raw URL
    }
    return url;
  }
  if (mode.startsWith("oldnet_")) {
    const year = mode.split("_")[1];
    return OLD_NET_PROXY.replace("<year>", year) + url;
  }
  return url;
};

/** Real favicon for a page — via Google's favicon service (works for any
 *  domain, unlike /favicon.ico which most modern sites dropped). */
const getFaviconUrl = (url: string): string | null => {
  if (!/^https?:\/\//i.test(url)) return null;
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  } catch {
    return null;
  }
};

/** Favicon with a graceful fallback to the themed glyph. */
function Favicon({
  url,
  fallback,
  size = 13,
}: {
  url: string;
  fallback: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const fav = getFaviconUrl(url);
  if (!fav || failed) return <Glyph id={fallback} size={size} />;
  return (
    <img
      src={fav}
      width={size}
      height={size}
      alt=""
      aria-hidden
      onError={() => setFailed(true)}
      style={{ borderRadius: 3, objectFit: "contain", flexShrink: 0 }}
    />
  );
}

/** daedalOS's IFRAME_CONFIG — sandbox lets pages run scripts/forms while
 *  keeping them out of the host, and no-referrer keeps the machine private. */
/** Known iframe-blocking domains — auto-route through our proxy. */
const BLOCKED_DOMAINS = [
  "github.com", "www.github.com",
  "linkedin.com", "www.linkedin.com",
  "twitter.com", "www.twitter.com", "x.com", "www.x.com",
  "instagram.com", "www.instagram.com",
  "facebook.com", "www.facebook.com",
  "reddit.com", "www.reddit.com",
  "medium.com", "www.medium.com",
  "stackoverflow.com", "www.stackoverflow.com",
  "youtube.com", "www.youtube.com",
  "tiktok.com", "www.tiktok.com",
  "threads.net", "www.threads.net",
  "open.spotify.com",
  "figma.com", "www.figma.com",
  "notion.so", "www.notion.so",
  "whatsapp.com", "web.whatsapp.com",
  "twitch.tv", "www.twitch.tv",
  "pinterest.com", "www.pinterest.com",
  "quora.com", "www.quora.com",
];

/** Check if a URL belongs to a known iframe-blocking domain. */
const isBlockedDomain = (url: string): boolean => {
  try {
    const host = new URL(url).hostname;
    return BLOCKED_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
};

const IFRAME_SANDBOX =
  "allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts";

const BOOKMARKS = [
  { label: "Google", url: GOOGLE_HOME, icon: "globe" },
  { label: "Portfolio", url: "/legacy", icon: "globe" },
  { label: "3D", url: "/3d", icon: "box" },
  { label: "Piano", url: "https://online-piano-two.vercel.app", icon: "piano" },
  { label: "Browser AI", url: "https://browser-ai-dun.vercel.app", icon: "bot" },
  { label: "Weekend Movers", url: "https://weekend-movers.vercel.app", icon: "truck" },
  { label: "StartX", url: "https://startx-zeta.vercel.app", icon: "rocket" },
  { label: "Book of Rose", url: "https://bookofrose.vercel.app", icon: "flower" },
  { label: "GitHub", url: "https://github.com/aryanbatras", icon: "github" },
  { label: "LinkedIn", url: "https://linkedin.com/in/aryanbatra", icon: "linkedin" },
  { label: "100xsystems", url: "https://100xsystems.dev", icon: "terminal" },
];

interface WebsiteAppProps {
  /** Where this browser window starts (a .url file was double-clicked). */
  initialUrl?: string;
  /** Close this browser window (Safari's tab ✕). */
  onClose?: () => void;
  /** Open a fresh browser window (Safari's ＋ tab button). */
  onNewTab?: () => void;
}

/**
 * A browser inside the machine. Same bones as daedalOS's Browser: Google's
 * basic HTML search works in an iframe, blocked sites can be re-served through
 * AllOrigins / Wayback / Old Net from the network menu, back/forward buttons
 * drop down their full histories, and bookmarks + pages show real favicons.
 */
export default function WebsiteApp({ initialUrl, onClose, onNewTab }: WebsiteAppProps) {
  const start = initialUrl && initialUrl !== HOME ? initialUrl : HOME;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [url, setUrl] = useState(start);
  const [frameSrc, setFrameSrc] = useState(start);
  const [history, setHistory] = useState<string[]>([start]);
  const [hIndex, setHIndex] = useState(0);
  const [input, setInput] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [addrFocused, setAddrFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proxyMode, setProxyMode] = useState<ProxyMode>("direct");
  const [blocked, setBlocked] = useState(false);
  const [proxyOpen, setProxyOpen] = useState(false);
  const [historyMenu, setHistoryMenu] = useState<"back" | "fwd" | null>(null);
  // Safari-style right-click menu for the page area.
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const loadTimer = useRef<number | null>(null);
  const proxyRef = useRef<ProxyMode>("direct");
  proxyRef.current = proxyMode;
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoFwd, setCanGoFwd] = useState(false);

  const clearLoadWatch = () => {
    if (loadTimer.current) window.clearTimeout(loadTimer.current);
    loadTimer.current = null;
  };

  /** Address input → URL or Google search (daedalOS getUrlOrSearch). */
  const normalize = (raw: string): string => {
    let u = raw.trim();
    if (!u) return HOME;
    if (u.startsWith("/")) return u;
    if (/^[a-z]+:\/\//i.test(u)) return u;
    const looksLikeDomain = /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(u) && !/\s/.test(u);
    if (!looksLikeDomain) return GOOGLE_SEARCH + encodeURIComponent(u);
    return "https://" + u;
  };

  const load = async (raw: string, intoHistory = true) => {
    const u = normalize(raw);
    // Auto-route known iframe-blocking domains through our server proxy
    const effectiveMode = (proxyRef.current === "direct" && isBlockedDomain(u))
      ? "ourproxy"
      : proxyRef.current;
    if (u === url) {
      setFrameSrc(await proxify(u, effectiveMode));
      return;
    }
    clearLoadWatch();
    setLoading(true);
    const next = intoHistory ? history.slice(0, hIndex + 1) : history;
    if (intoHistory) {
      next.push(u);
      setHIndex(next.length - 1);
    }
    setHistory(next);
    setUrl(u);
    setInput("");
    const proxied = await proxify(u, effectiveMode);
    if (next[next.length - 1] === u) setFrameSrc(proxied);
    // Safety: if a page never fires a load event, stop the spinner (the
    // "refused to embed" banner from before was a false positive — for
    // cross-origin iframes contentDocument is ALWAYS null).
    loadTimer.current = window.setTimeout(() => setLoading(false), 30000);
  };

  const go = (step: number) => {
    const i = Math.max(0, Math.min(hIndex + step, history.length - 1));
    if (i === hIndex) return;
    clearLoadWatch();
    setHIndex(i);
    const target = history[i];
    setUrl(target);
    setInput("");
    setLoading(true);
    proxify(target, proxyRef.current).then((proxied) => {
      if (history[i] === target) setFrameSrc(proxied);
    });
    loadTimer.current = window.setTimeout(() => setLoading(false), 30000);
  };

  /** Jump to an absolute history index (from the dropdown menus). */
  const jumpTo = (i: number) => {
    if (i < 0 || i >= history.length || i === hIndex) return;
    setHistoryMenu(null);
    go(i - hIndex);
  };

  const onLoaded = () => {
    clearLoadWatch();
    setLoading(false);
    setBlocked(false);
    setCanGoBack(hIndex > 0);
    setCanGoFwd(hIndex < history.length - 1);
    attachBridge();
    // If direct mode and a cross-origin page loaded, check if iframe content
    // is accessible (blocked sites will have an empty body).
    if (proxyRef.current === "direct") {
      window.setTimeout(() => {
        try {
          const doc = frameRef.current?.contentDocument;
          if (doc && doc.body && doc.body.children.length === 0) {
            setBlocked(true);
          }
        } catch {
          // Cross-origin — can't tell if blocked, assume OK.
        }
      }, 1500);
    }
  };

  // Same-origin pages (/legacy, /3d) don't bubble events to the parent
  // document — inject a listener into the iframe and route its right-clicks
  // to the Safari menu. Cross-origin pages keep their own page menu.
  const onFrameContext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({
      x: Math.min(e.clientX, window.innerWidth - 240),
      y: Math.min(e.clientY, window.innerHeight - 220),
    });
  };

  // Same-origin pages need a listener INSIDE the iframe (events don't cross
  // the frame boundary). Attach it on every load — the previous document is
  // replaced by the navigation, so its listener disappears on its own.
  const bridgeRef = useRef<((e: Event) => void) | null>(null);
  const attachBridge = () => {
    const iframe = frameRef.current;
    if (!iframe) return;
    let doc: Document | null = null;
    try {
      doc = iframe.contentDocument;
    } catch {
      // Cross-origin — can't touch the page; its own menu shows.
    }
    if (!doc) return;
    if (bridgeRef.current) {
      try {
        doc.removeEventListener("contextmenu", bridgeRef.current);
      } catch {
        // Old doc gone — fine.
      }
    }
    const onCtx = (e: Event) => {
      e.preventDefault();
      const m = e as MouseEvent;
      setCtxMenu({
        x: Math.min(m.clientX, window.innerWidth - 240),
        y: Math.min(m.clientY, window.innerHeight - 220),
      });
    };
    bridgeRef.current = onCtx;
    doc.addEventListener("contextmenu", onCtx);
  };

  const switchProxy = (m: ProxyMode) => {
    setProxyMode(m);
    setProxyOpen(false);
    setBlocked(false);
    // Re-serve the current page through the new proxy immediately.
    clearLoadWatch();
    setLoading(true);
    proxify(url, m).then(setFrameSrc);
  };

  useEffect(() => {
    setCanGoBack(hIndex > 0);
    setCanGoFwd(hIndex < history.length - 1);
  }, [hIndex, history.length]);

  useEffect(() => () => clearLoadWatch(), []);

  const isLocal = url.startsWith("/");

  // Safari tab title — a friendly name for the open page.
  const pageTitle = isLocal
    ? "Portfolio"
    : (() => {
        try {
          const host = new URL(url).hostname.replace(/^www\./, "");
          const known = BOOKMARKS.find((b) => b.url === url)?.label;
          return known ?? host;
        } catch {
          return url;
        }
      })();

  // Entries for the back / forward dropdowns (most recent first for back).
  const backEntries = history.slice(0, hIndex).reverse();
  const fwdEntries = history.slice(hIndex + 1);

  return (
    <div className={styles.website}>
      {/* Safari tab strip — the open page as a tab, with favicon + title. */}
      <div className={styles.safariTabs}>
        <div className={styles.safariTab}>
          {!isLocal && <Favicon url={url} fallback="globe" size={12} />}
          {isLocal && <Glyph id="globe" size={12} />}
          <span className={styles.safariTabTitle}>{pageTitle}</span>
          <button
            type="button"
            className={styles.safariTabClose}
            onClick={onClose}
            aria-label="Close tab"
            title="Close tab"
          >
            ×
          </button>
        </div>
        <button
          type="button"
          className={styles.safariTabNew}
          onClick={onNewTab}
          aria-label="New tab"
          title="New tab"
        >
          +
        </button>
      </div>
      <div className={styles.websiteToolbar}>
        <div className={styles.websiteNavBtns}>
          <div className={styles.websiteProxyWrap}>
            <button
              type="button"
              className={styles.websiteNavBtn}
              aria-label="Back"
              onClick={() => go(-1)}
              onContextMenu={(e) => {
                e.preventDefault();
                setHistoryMenu(historyMenu === "back" ? null : "back");
              }}
              style={{ opacity: canGoBack ? 1 : 0.4 }}
            >
              <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
                <path d="M10.7 2.3 5.4 7.6a1 1 0 0 0 0 1.4l5.3 5.3a1 1 0 0 0 1.7-.7V3a1 1 0 0 0-1.7-.7Z" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.websiteHistoryCaret}
              aria-label="Back history"
              onClick={() => setHistoryMenu(historyMenu === "back" ? null : "back")}
              style={{ opacity: canGoBack ? 1 : 0.3 }}
            >
              <svg viewBox="0 0 16 16" width="7" height="7" fill="currentColor" aria-hidden="true">
                <path d="M4 6h8l-4 5-4-5Z" />
              </svg>
            </button>
            {historyMenu === "back" && backEntries.length > 0 && (
              <div className={styles.websiteHistoryMenu}>
                {backEntries.map((entry, i) => (
                  <button
                    key={`${entry}|${i}`}
                    type="button"
                    className={styles.websiteHistoryItem}
                    onClick={() => jumpTo(hIndex - 1 - i)}
                  >
                    <Favicon url={entry} fallback="globe" size={12} />
                    <span className={styles.websiteHistoryLabel}>{entry}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.websiteProxyWrap}>
            <button
              type="button"
              className={styles.websiteNavBtn}
              aria-label="Forward"
              onClick={() => go(1)}
              onContextMenu={(e) => {
                e.preventDefault();
                setHistoryMenu(historyMenu === "fwd" ? null : "fwd");
              }}
              style={{ opacity: canGoFwd ? 1 : 0.4 }}
            >
              <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
                <path d="M5.3 2.3 10.6 7.6a1 1 0 0 1 0 1.4l-5.3 5.3A1 1 0 0 1 3.6 13V3a1 1 0 0 1 1.7-.7Z" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.websiteHistoryCaret}
              aria-label="Forward history"
              onClick={() => setHistoryMenu(historyMenu === "fwd" ? null : "fwd")}
              style={{ opacity: canGoFwd ? 1 : 0.3 }}
            >
              <svg viewBox="0 0 16 16" width="7" height="7" fill="currentColor" aria-hidden="true">
                <path d="M4 6h8l-4 5-4-5Z" />
              </svg>
            </button>
            {historyMenu === "fwd" && fwdEntries.length > 0 && (
              <div className={styles.websiteHistoryMenu}>
                {fwdEntries.map((entry, i) => (
                  <button
                    key={`${entry}|${i}`}
                    type="button"
                    className={styles.websiteHistoryItem}
                    onClick={() => jumpTo(hIndex + 1 + i)}
                  >
                    <Favicon url={entry} fallback="globe" size={12} />
                    <span className={styles.websiteHistoryLabel}>{entry}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.websiteNavBtn}
            aria-label="Reload page"
            onClick={() => {
              setReloadKey((k) => k + 1);
              load(url, false);
            }}
          >
            {loading ? (
              <span className={styles.gameSpin} style={{ display: "inline-block" }}>
                <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
                  <path d="M8 3a5 5 0 1 0 5 5h-1.4A3.6 3.6 0 1 1 8 4.4V3Z" />
                </svg>
              </span>
            ) : (
              <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1.8v3.2h-3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <button type="button" className={styles.websiteNavBtn} aria-label="Go home" onClick={() => load(HOME)}>
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
          {!isLocal && !addrFocused && (
            <span className={styles.websiteAddrFav}>
              <Favicon url={url} fallback="globe" size={13} />
            </span>
          )}
          {!isLocal && addrFocused && (
            <span className={styles.websiteAddrLock}>
              <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
              </svg>
            </span>
          )}
          {isLocal && (
            <span className={styles.websiteAddrLock}>
              <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
              </svg>
            </span>
          )}
          <input
            id="website-addr"
            className={styles.websiteAddrInput}
            value={addrFocused ? input : url}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
                load(input);
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
          {/* Network / proxy menu — the daedalOS trick for blocked sites. */}
          <div className={styles.websiteProxyWrap}>
            <button
              type="button"
              className={`${styles.websiteNavBtn} ${proxyMode !== "direct" ? styles.websiteProxyActive : ""}`}
              aria-label={`Proxy: ${PROXY_LABEL[proxyMode]}`}
              title={`Proxy: ${PROXY_LABEL[proxyMode]}`}
              onClick={() => setProxyOpen((o) => !o)}
            >
              <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor" aria-hidden="true">
                <circle cx="4" cy="4" r="2.2" />
                <circle cx="12" cy="4" r="2.2" />
                <circle cx="4" cy="12" r="2.2" />
                <circle cx="12" cy="12" r="2.2" />
                <path d="M6.2 4h3.6M4 6.2v3.6M12 6.2v3.6M6.2 12h3.6" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
            {proxyOpen && (
              <div className={styles.websiteProxyMenu}>
                {PROXY_GROUPS.map((group) => (
                  <div key={group.label} className={styles.websiteProxyGroup}>
                    <p className={styles.websiteProxyTitle}>{group.label}</p>
                    {group.modes.map((m) => (
                      <button
                        key={m}
                        type="button"
                        className={`${styles.websiteProxyOption} ${
                          proxyMode === m ? styles.websiteProxyOptionActive : ""
                        }`}
                        onClick={() => switchProxy(m)}
                      >
                        <span className={styles.websiteProxyRadio} aria-hidden="true">
                          {proxyMode === m && <span />}
                        </span>
                        {PROXY_LABEL[m]}
                      </button>
                    ))}
                  </div>
                ))}
                <p className={styles.websiteProxyHint}>
                  Re-serves pages so sites that refuse iframes still open.
                </p>
              </div>
            )}
          </div>
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
            className={`${styles.websiteBookmark} ${url === b.url ? styles.websiteBookmarkActive : ""}`}
            onClick={() => load(b.url)}
          >
            <Favicon url={b.url} fallback={b.icon} size={13} /> {b.label}
          </button>
        ))}
      </div>

      {blocked && proxyMode === "direct" && (
        <div className={styles.websiteBlockedBanner}>
          <div className={styles.websiteBlockedIcon}>
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5 13 3.5v3.2c0 3.4-2.2 6-5 7.3-2.8-1.3-5-3.9-5-7.3V3.5L8 1.5Z" /><line x1="8" y1="6" x2="8" y2="9" /><circle cx="8" cy="11" r="0.5" fill="currentColor" /></svg>
          </div>
          <div className={styles.websiteBlockedText}>
            <span className={styles.websiteBlockedTitle}>This site blocks iframe embedding</span>
            <span className={styles.websiteBlockedHint}>Use the proxy to view it here, or open in a new tab.</span>
          </div>
          <div className={styles.websiteBlockedActions}>
            <button className={styles.websiteBlockedBtn} onClick={() => { switchProxy("ourproxy"); setBlocked(false); }}>
              Load via Proxy
            </button>
            <button className={styles.websiteBlockedBtnSecondary} onClick={() => window.open(url, "_blank")}>
              Open in Tab
            </button>
          </div>
        </div>
      )}
      <div className={styles.websiteFrameWrap} onContextMenu={onFrameContext}>
        <iframe
          key={`${frameSrc}|${reloadKey}`}
          ref={frameRef}
          src={frameSrc}
          title="Aryan Batra — Browser"
          className={styles.websiteFrame}
          onLoad={onLoaded}
          referrerPolicy="no-referrer"
          // @ts-expect-error credentialless is a Chromium-only iframe attr
          credentialless="credentialless"

          {...(isLocal ? {} : { sandbox: IFRAME_SANDBOX })}
        />

        {/* Loading progress bar — Safari-style thin line at the top */}
        {loading && (
          <div className={styles.websiteProgress}>
            <div className={styles.websiteProgressBar} />
          </div>
        )}

        {/* Safari-style right-click menu (Back/Forward/Reload/Open in new tab). */}
        {ctxMenu && (
          <>
            <div
              className={styles.websiteCtxBackdrop}
              onClick={() => setCtxMenu(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setCtxMenu(null);
              }}
            />
            <div
              className={styles.websiteCtxMenu}
              style={{ left: ctxMenu.x, top: ctxMenu.y }}
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className={styles.websiteCtxItem}
                disabled={!canGoBack}
                onClick={() => {
                  setCtxMenu(null);
                  go(-1);
                }}
              >
                Back
              </button>
              <button
                type="button"
                role="menuitem"
                className={styles.websiteCtxItem}
                disabled={!canGoFwd}
                onClick={() => {
                  setCtxMenu(null);
                  go(1);
                }}
              >
                Forward
              </button>
              <button
                type="button"
                role="menuitem"
                className={styles.websiteCtxItem}
                onClick={() => {
                  setCtxMenu(null);
                  setReloadKey((k) => k + 1);
                  load(url, false);
                }}
              >
                Reload Page
              </button>
              <button
                type="button"
                role="menuitem"
                className={styles.websiteCtxItem}
                onClick={() => {
                  setCtxMenu(null);
                  load(HOME);
                }}
              >
                Home
              </button>
              <div className={styles.websiteCtxSep} />
              <button
                type="button"
                role="menuitem"
                className={styles.websiteCtxItem}
                onClick={() => {
                  setCtxMenu(null);
                  onNewTab?.();
                }}
              >
                Open in New Window
              </button>
              <button
                type="button"
                role="menuitem"
                className={styles.websiteCtxItem}
                onClick={() => {
                  void navigator.clipboard?.writeText(url);
                  setCtxMenu(null);
                }}
              >
                Copy Link
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
