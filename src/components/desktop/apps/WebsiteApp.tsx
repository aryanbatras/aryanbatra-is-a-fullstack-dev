"use client";

import { useEffect, useRef, useState } from "react";
import Glyph from "@/components/desktop/Glyph";
import styles from "@/styles/components/desktop/apps.module.css";

const HOME = "/legacy";

/** Google's basic HTML mode — unlike the modern UI it sends no X-Frame-Options,
 *  so it actually embeds in an iframe (the daedalOS trick for running Google). */
const GOOGLE_HOME = "https://www.google.com/webhp?igu=1";
const GOOGLE_SEARCH = "https://www.google.com/search?igu=1&q=";

/** daedalOS proxy modes — re-serve pages so sites that block iframes work. */
type ProxyMode = "direct" | "allorigins" | "wayback" | `oldnet_${number}`;

const OLD_NET_YEARS = [
  1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008,
  2009, 2010, 2011, 2012,
];

/** theoldnet.com re-renders a page the way it looked in a given year. */
const OLD_NET_PROXY =
  "https://theoldnet.com/get?scripts=true&decode=true&year=<year>&url=";

/** Proxy menu is grouped — general proxies, then the Old Net time machine. */
const PROXY_GROUPS: { label: string; modes: ProxyMode[] }[] = [
  { label: "Proxy", modes: ["direct", "allorigins", "wayback"] },
  {
    label: "Old Net",
    modes: OLD_NET_YEARS.map((y) => `oldnet_${y}` as ProxyMode),
  },
];

const PROXY_LABEL: Record<ProxyMode, string> = {
  direct: "Direct",
  allorigins: "AllOrigins",
  wayback: "Wayback Machine",
  ...Object.fromEntries(
    OLD_NET_YEARS.map((y) => [`oldnet_${y}`, `Old Net ${y}`]),
  ),
};

/** Wrap a URL in the selected proxy (daedalOS's PROXIES table). */
const proxify = async (url: string, mode: ProxyMode): Promise<string> => {
  if (mode === "direct") return url;
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
const IFRAME_SANDBOX =
  "allow-downloads allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts";

const BOOKMARKS = [
  { label: "Portfolio", url: HOME, icon: "globe" },
  { label: "Google", url: GOOGLE_HOME, icon: "globe" },
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
}

/**
 * A browser inside the machine. Same bones as daedalOS's Browser: Google's
 * basic HTML search works in an iframe, blocked sites can be re-served through
 * AllOrigins / Wayback / Old Net from the network menu, back/forward buttons
 * drop down their full histories, and bookmarks + pages show real favicons.
 */
export default function WebsiteApp({ initialUrl }: WebsiteAppProps) {
  const start = initialUrl && initialUrl !== HOME ? initialUrl : HOME;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [url, setUrl] = useState(start);
  const [frameSrc, setFrameSrc] = useState(start);
  const [history, setHistory] = useState<string[]>([start]);
  const [hIndex, setHIndex] = useState(0);
  const [input, setInput] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [addrFocused, setAddrFocused] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proxyMode, setProxyMode] = useState<ProxyMode>("direct");
  const [proxyOpen, setProxyOpen] = useState(false);
  const [historyMenu, setHistoryMenu] = useState<"back" | "fwd" | null>(null);
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
    if (u === url) {
      // Same page (reload): re-fetch through the proxy; the iframe `key`
      // (which includes reloadKey) forces a clean remount.
      setFrameSrc(await proxify(u, proxyRef.current));
      return;
    }
    clearLoadWatch();
    setBlocked(false);
    setLoading(true);
    const next = intoHistory ? history.slice(0, hIndex + 1) : history;
    if (intoHistory) {
      next.push(u);
      setHIndex(next.length - 1);
    }
    setHistory(next);
    setUrl(u);
    setInput("");
    const proxied = await proxify(u, proxyRef.current);
    if (next[next.length - 1] === u) setFrameSrc(proxied);
    // Watch for refusal: no load event after a grace period → assume blocked.
    loadTimer.current = window.setTimeout(() => {
      const f = frameRef.current;
      if (f && f.contentDocument === null && !f.src.startsWith(location.origin)) {
        setBlocked(true);
      }
      setLoading(false);
    }, 8000);
  };

  const go = (step: number) => {
    const i = Math.max(0, Math.min(hIndex + step, history.length - 1));
    if (i === hIndex) return;
    clearLoadWatch();
    setHIndex(i);
    const target = history[i];
    setUrl(target);
    setInput("");
    setBlocked(false);
    setLoading(true);
    proxify(target, proxyRef.current).then((proxied) => {
      if (history[i] === target) setFrameSrc(proxied);
    });
    loadTimer.current = window.setTimeout(() => {
      const f = frameRef.current;
      if (f && f.contentDocument === null && !f.src.startsWith(location.origin)) {
        setBlocked(true);
      }
      setLoading(false);
    }, 8000);
  };

  /** Jump to an absolute history index (from the dropdown menus). */
  const jumpTo = (i: number) => {
    if (i < 0 || i >= history.length || i === hIndex) return;
    setHistoryMenu(null);
    go(i - hIndex);
  };

  const onLoaded = () => {
    clearLoadWatch();
    setBlocked(false);
    setLoading(false);
    setCanGoBack(hIndex > 0);
    setCanGoFwd(hIndex < history.length - 1);
  };

  const switchProxy = (m: ProxyMode) => {
    setProxyMode(m);
    setProxyOpen(false);
    if (m !== "direct") {
      // Re-serve the current page through the new proxy immediately.
      clearLoadWatch();
      setBlocked(false);
      setLoading(true);
      proxify(url, m).then(setFrameSrc);
    }
  };

  useEffect(() => {
    setCanGoBack(hIndex > 0);
    setCanGoFwd(hIndex < history.length - 1);
  }, [hIndex, history.length]);

  useEffect(() => () => clearLoadWatch(), []);

  const isLocal = url.startsWith("/");

  // Entries for the back / forward dropdowns (most recent first for back).
  const backEntries = history.slice(0, hIndex).reverse();
  const fwdEntries = history.slice(hIndex + 1);

  return (
    <div className={styles.website}>
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

      <div className={styles.websiteFrameWrap}>
        {blocked && (
          <div className={styles.websiteBlocked}>
            <strong>This site refused to be embedded</strong>
            <p>
              {url} blocks being shown inside another page. Re-serve it through
              a proxy, open it in a new tab, or head home.
            </p>
            <div className={styles.websiteBlockedBtns}>
              <button
                type="button"
                className={styles.gameBtn}
                onClick={() => switchProxy("allorigins")}
              >
                Open via AllOrigins
              </button>
              <button
                type="button"
                className={styles.gameBtn}
                onClick={() => switchProxy("wayback")}
              >
                Open via Wayback
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
                onClick={() => load(HOME)}
              >
                Go to Portfolio
              </button>
            </div>
          </div>
        )}
        <iframe
          key={`${frameSrc}|${reloadKey}`}
          ref={frameRef}
          src={frameSrc}
          title="Aryan Batra — Browser"
          className={styles.websiteFrame}
          onLoad={onLoaded}
          referrerPolicy="no-referrer"
          {...(isLocal ? {} : { sandbox: IFRAME_SANDBOX })}
        />
      </div>
    </div>
  );
}
