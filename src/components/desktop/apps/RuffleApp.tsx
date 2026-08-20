"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard, UploadCloud, Globe, Play, Search, X } from "lucide-react";
import { readFiles } from "@/utils/finderStorage";
import CDN from "@/constants/cdn";
import {
  FLASH_GAMES,
  FLASH_CATEGORIES,
  isSwfGame,
  type FlashGame,
  type FlashCategory,
} from "@/data/flashGames";
import styles from "@/styles/components/desktop/apps.module.css";

interface RuffleAppProps {
  file?: string;
  swfUrl?: string;
  swfTitle?: string;
}

/**
 * Ruffle — Flash Player emulator + HTML5 game launcher.
 * Now loads 200+ games dynamically from external URLs.
 */
export default function RuffleApp({ file, swfUrl, swfTitle }: RuffleAppProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [game, setGame] = useState<{ name: string; url: string; isSwf: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showCatalog, setShowCatalog] = useState(!swfUrl && !file);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<FlashCategory>("all");

  // Load ruffle.js once
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-ruffle]");
    if (existing) { setLoaded(true); return; }
    const s = document.createElement("script");
    s.src = CDN.RUFFLE.js;
    s.dataset.ruffle = "1";
    s.onload = () => setLoaded(true);
    s.onerror = () => setError("Could not load the Flash player.");
    document.body.appendChild(s);
  }, []);

  // Ruffle config
  useEffect(() => {
    if (!loaded) return;
    const RP = (window as unknown as Record<string, any>).RufflePlayer;
    if (!RP) return;
    RP.config = {
      allowScriptAccess: false, autoplay: "on", backgroundColor: "#000000",
      letterbox: "on", menu: false, polyfills: false, preloader: false,
      unmuteOverlay: "hidden",
    };
  }, [loaded]);

  const playGame = (name: string, url: string, swf: boolean) => {
    setError(null);
    setGame({ name, url, isSwf: swf });
    setLoading(true);
    setShowCatalog(false);
  };

  const playFlashGame = (fg: FlashGame) => {
    playGame(fg.title, fg.url, isSwfGame(fg));
  };

  // Load from props
  useEffect(() => {
    if (swfUrl) playGame(swfTitle ?? "Flash Game", swfUrl, swfUrl.endsWith(".swf"));
  }, [swfUrl]);

  useEffect(() => {
    if (!file) return;
    const f = readFiles().find((x) => x.name === file);
    if (f?.content.startsWith("data:")) playGame(f.name, f.content, true);
  }, []);

  // Ruffle player for SWF
  useEffect(() => {
    if (!game?.isSwf || !loaded) return;
    const host = hostRef.current;
    const RP = (window as unknown as Record<string, any>).RufflePlayer;
    if (!host || !RP) return;
    host.innerHTML = "";
    const player = RP.newest().createPlayer();
    host.appendChild(player);
    player.load({ url: game.url })
      .then(() => setLoading(false))
      .catch(() => { setLoading(false); setError("Ruffle could not play this Flash file."); });
    return () => { try { player.remove(); } catch {} };
  }, [game, loaded]);

  const pickFiles = (list: FileList | File[] | null) => {
    const f = Array.from(list ?? [])[0];
    if (f) playGame(f.name, URL.createObjectURL(f), true);
  };

  const filtered = useMemo(() => {
    let list = FLASH_GAMES;
    if (category !== "all") list = list.filter((g) => g.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((g) =>
        g.title.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [search, category]);

  // ─── Catalog View ───
  if (showCatalog && !game) {
    return (
      <div className={styles.emuShell} data-app="ruffle">
        <div className={styles.emuHint}>
          <Clapperboard size={14} />
          <span style={{ flex: 1, fontWeight: 600 }}>Flash Games ({FLASH_GAMES.length})</span>
          <button type="button" className={styles.texteditBtn}
            onClick={() => (document.getElementById("ruffle-swf") as HTMLInputElement | null)?.click()}>
            <UploadCloud size={13} /> Open .swf File…
          </button>
        </div>
        <input id="ruffle-swf" type="file" accept=".swf,.spl" hidden
          onChange={(e) => { pickFiles(e.target.files); e.target.value = ""; }} />

        {/* Search */}
        <div style={{ padding: "10px 14px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6,
              padding: "6px 10px", borderRadius: 8, background: "#161b22", border: "1px solid #30363d" }}>
              <Search size={13} style={{ color: "#8b949e", flexShrink: 0 }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search games..."
                style={{ flex: 1, background: "none", border: "none", outline: "none",
                  color: "#fff", fontSize: 13, fontFamily: "inherit" }} />
              {search && <button type="button" onClick={() => setSearch("")}
                style={{ background: "none", border: "none", color: "#8b949e", cursor: "pointer", padding: 0 }}>
                <X size={12} /></button>}
            </div>
          </div>
          {/* Category pills */}
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            {FLASH_CATEGORIES.map((cat) => {
              const count = cat.id === "all" ? FLASH_GAMES.length : FLASH_GAMES.filter((g) => g.category === cat.id).length;
              return (
                <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                  style={{ padding: "4px 10px", borderRadius: 20, border: "none", whiteSpace: "nowrap",
                    background: category === cat.id ? "#f0ad4e" : "#21262d",
                    color: category === cat.id ? "#000" : "#8b949e",
                    fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Game grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 14px",
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 8, alignContent: "start" }}>
          {filtered.map((fg) => (
            <button key={fg.id} type="button" onClick={() => playFlashGame(fg)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center",
                background: "#161b22", border: "1px solid #30363d",
                borderRadius: 8, padding: "12px 6px", cursor: "pointer",
                transition: "all 0.12s", textAlign: "center", gap: 6,
                color: "#e6edf3", fontFamily: "inherit" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f0ad4e"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#30363d"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ width: 36, height: 36, borderRadius: 8,
                background: isSwfGame(fg) ? "rgba(240,173,78,0.1)" : "rgba(78,205,196,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Play size={16} style={{ color: isSwfGame(fg) ? "#f0ad4e" : "#4ecdc4" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{fg.title}</span>
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                {fg.tags.slice(0, 2).map((t) => (
                  <span key={t} style={{ fontSize: 8, padding: "1px 4px", borderRadius: 3,
                    background: "#21262d", color: "#8b949e" }}>{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div style={{ padding: "5px 14px", borderTop: "1px solid #30363d", background: "#0d1117",
          display: "flex", justifyContent: "space-between", fontSize: 10, color: "#484f58", flexShrink: 0 }}>
          <span>{filtered.length} games · {FLASH_GAMES.filter(isSwfGame).length} SWF + {FLASH_GAMES.filter((g) => !isSwfGame(g)).length} HTML5</span>
          <span>Powered by Ruffle</span>
        </div>
      </div>
    );
  }

  // ─── Player View ───
  return (
    <div className={styles.emuShell} data-app="ruffle"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFiles(e.dataTransfer?.files ?? null); }}>
      <div className={styles.emuHint}>
        <button type="button" className={styles.texteditBtn}
          onClick={() => (document.getElementById("ruffle-swf") as HTMLInputElement | null)?.click()}>
          <UploadCloud size={13} /> Open .swf…
        </button>
        <span className={styles.webampCount}>
          <Clapperboard size={12} />
          {game?.name ?? "drop a .swf to play"}
        </span>
        <div style={{ flex: 1 }} />
        <button type="button" className={styles.texteditBtn}
          onClick={() => { setGame(null); setShowCatalog(true); setError(null); }}
          title="Back to catalog">
          <Globe size={13} /> Catalog
        </button>
      </div>
      <input id="ruffle-swf" type="file" accept=".swf,.spl" hidden
        onChange={(e) => { pickFiles(e.target.files); e.target.value = ""; }} />

      {game ? (
        <div className={`${styles.emuHost} ${dragOver ? styles.emuHostDrag : ""}`}>
          {game.isSwf ? (
            <div ref={hostRef} className={styles.emuFrame} />
          ) : (
            <iframe ref={iframeRef} src={game.url} title={game.name}
              className={styles.emuFrame}
              allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox" />
          )}
          {loading && <div className={styles.emuOverlay}>Loading {game.name}…</div>}
          {error && <div className={styles.emuOverlay}>{error}</div>}
        </div>
      ) : (
        <div className={`${styles.emuDrop} ${dragOver ? styles.emuHostDrag : ""}`}>
          <Clapperboard size={30} />
          <p>Drop a Flash (.swf) file here</p>
          <p className={styles.emuDropSub}>Ruffle emulates Flash in the browser</p>
        </div>
      )}
    </div>
  );
}
