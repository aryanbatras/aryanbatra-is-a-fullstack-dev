"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, ArrowLeft, Maximize2, Minimize2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { ONLINE_GAMES, CATEGORY_COUNTS, type OnlineGame } from "@/data/onlineGames";

const PER_PAGE = 6;

const CAT_DOT: Record<string, string> = {
  Action: "#8b8b8b", Racing: "#7a8a6e", ".io": "#6e8a8a",
  Shooting: "#8a7a6e", Sports: "#6e7a8a", Puzzle: "#8a6e7a",
  Arcade: "#6e8a7a", Simulation: "#7a6e8a", Platformer: "#8a8a6e",
  Adventure: "#6e8a6e", Clicker: "#7a8a7a", Board: "#6e6e8a",
  Fighting: "#8a6e6e", "Tower Defense": "#6e7a6e", "Match-3": "#7a6e6e",
  Horror: "#5a5a5a", Music: "#6e8a8a", Trivia: "#7a7a6e",
};

function gameTitle(g: OnlineGame) {
  return g.title.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getGameUrl(game: OnlineGame) {
  if (game.source === "itch.io") return "/api/proxy?url=" + encodeURIComponent(game.embed);
  return game.embed;
}

function GameThumb({ game, dot }: { game: OnlineGame; dot: string }) {
  const [failed, setFailed] = useState(false);
  const title = gameTitle(game);
  if (failed || !game.thumb) {
    return (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg, ${dot}15, ${dot}08)`,
        fontSize: 40, fontWeight: 700, color: dot + "30",
      }}>
        {title.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img src={game.thumb} alt={title} loading="lazy"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
  );
}

export default function GamesApp() {
  const [selected, setSelected] = useState<OnlineGame | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let list = ONLINE_GAMES;
    if (category !== "all") list = list.filter((g) => g.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) => g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageGames = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, category]);

  // Scroll to top on page change
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  // Keyboard navigation: left/right arrows for pages, Escape to go back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (selected) return; // Don't intercept when playing
      if (e.key === "ArrowRight" && page < totalPages) { setPage(p => p + 1); }
      if (e.key === "ArrowLeft" && page > 1) { setPage(p => p - 1); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [page, totalPages, selected]);

  // ─── FULLSCREEN GAME PLAYER ───
  if (selected) {
    return (
      <div style={{
        position: "absolute", inset: 0, zIndex: 9999,
        background: "#000", display: "flex", flexDirection: "column",
      }}>
        <button type="button" onClick={() => { setSelected(null); setFullscreen(false); }}
          style={{
            position: "absolute", top: 10, left: 10, zIndex: 10000,
            width: 36, height: 36, borderRadius: 8,
            background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(12px)",
          }}
          title="Back (Esc)">
          <ArrowLeft size={18} />
        </button>
        <button type="button" onClick={() => {
          const el = document.querySelector("[data-game-iframe]") as HTMLIFrameElement;
          if (el) { if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.(); }
        }}
          style={{
            position: "absolute", top: 10, right: 10, zIndex: 10000,
            width: 36, height: 36, borderRadius: 8,
            background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(12px)",
          }}
          title="Fullscreen">
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <div style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 10000,
          padding: "6px 16px", borderRadius: 10,
          background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)", fontSize: 13, fontWeight: 600, color: "#fff",
          whiteSpace: "nowrap", pointerEvents: "none", opacity: 0.8,
        }}>
          {gameTitle(selected)}
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>{selected.source}</span>
        </div>
        <iframe
          data-game-iframe
          src={getGameUrl(selected)}
          title={selected.title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope; clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
        />
        <EscHandler onEsc={() => { setSelected(null); setFullscreen(false); }} />
      </div>
    );
  }

  // ─── GAME LIBRARY WITH PAGINATION ───
  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%", width: "100%",
      background: "#fff", color: "#1d1d1f",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      overflow: "hidden",
    }}>
      {/* Search bar */}
      <div style={{
        padding: "10px 16px 6px", background: "#fff",
        borderBottom: "0.5px solid rgba(0,0,0,0.08)", flexShrink: 0,
      }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: 8,
          background: "rgba(0,0,0,0.04)", border: "0.5px solid rgba(0,0,0,0.06)",
        }}>
          <Search size={14} style={{ color: "#86868b", flexShrink: 0 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={"Search " + ONLINE_GAMES.length + " games..."}
            style={{
              width: "100%", background: "none", border: "none", outline: "none",
              color: "#1d1d1f", fontSize: 14, fontFamily: "inherit",
            }} />
          {search && <button type="button" onClick={() => setSearch("")}
            style={{ background: "none", border: "none", color: "#86868b", cursor: "pointer", padding: 0 }}>
            <X size={14} /></button>}
        </div>
        {/* Category pills */}
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", paddingTop: 8, paddingBottom: 2,
          scrollbarWidth: "none" as const, WebkitOverflowScrolling: "touch" as const,
        }}>
          <button type="button" onClick={() => setCategory("all")}
            style={{
              padding: "4px 12px", borderRadius: 16, border: "none", whiteSpace: "nowrap",
              background: category === "all" ? "#1d1d1f" : "rgba(0,0,0,0.04)",
              color: category === "all" ? "#fff" : "#1d1d1f",
              fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}>
            All
          </button>
          {CATEGORY_COUNTS.map(([cat]) => (
            <button key={cat} type="button" onClick={() => setCategory(cat)}
              style={{
                padding: "4px 12px", borderRadius: 16, border: "none", whiteSpace: "nowrap",
                background: category === cat ? "#1d1d1f" : "rgba(0,0,0,0.04)",
                color: category === cat ? "#fff" : "#1d1d1f",
                fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Game grid — 2 columns, 6 per page */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch",
        padding: "8px 12px",
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 10,
        alignContent: "start",
      }}>
        {pageGames.map((game) => {
          const dot = CAT_DOT[game.category] || "#8b8b8b";
          return (
            <button key={game.id} onClick={() => setSelected(game)}
              style={{
                display: "flex", flexDirection: "column",
                background: "transparent", border: "none",
                overflow: "hidden", cursor: "pointer",
                textAlign: "left", color: "#1d1d1f", fontFamily: "inherit",
                padding: 0,
              }}>
              <div style={{
                width: "100%", aspectRatio: "4/3",
                position: "relative", overflow: "hidden", borderRadius: 10,
                background: "#f5f5f7",
              }}>
                <GameThumb game={game} dot={dot} />
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,0,0,0)", transition: "background 0.15s",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 22,
                    background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: "14px solid #fff",
                      borderTop: "9px solid transparent",
                      borderBottom: "9px solid transparent",
                      marginLeft: 3,
                    }} />
                  </div>
                </div>
              </div>
              <div style={{ padding: "8px 2px 4px" }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: "#1d1d1f", lineHeight: 1.3,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {gameTitle(game)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#86868b" }}>{game.category}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination — big Prev/Next buttons */}
      <div style={{
        flexShrink: 0, padding: "10px 16px 14px",
        borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
      }}>
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            padding: "10px 20px", borderRadius: 12,
            border: "none",
            background: page <= 1 ? "rgba(0,0,0,0.04)" : "#1d1d1f",
            color: page <= 1 ? "#c7c7cc" : "#fff",
            fontSize: 14, fontWeight: 600, cursor: page <= 1 ? "default" : "pointer",
            fontFamily: "inherit", opacity: page <= 1 ? 0.5 : 1,
            minWidth: 100,
          }}>
          <ChevronLeft size={18} /> Prev
        </button>

        <span style={{
          fontSize: 13, fontWeight: 500, color: "#86868b",
          minWidth: 80, textAlign: "center",
        }}>
          {page} / {totalPages}
        </span>

        <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            padding: "10px 20px", borderRadius: 12,
            border: "none",
            background: page >= totalPages ? "rgba(0,0,0,0.04)" : "#1d1d1f",
            color: page >= totalPages ? "#c7c7cc" : "#fff",
            fontSize: 14, fontWeight: 600, cursor: page >= totalPages ? "default" : "pointer",
            fontFamily: "inherit", opacity: page >= totalPages ? 0.5 : 1,
            minWidth: 100,
          }}>
          Next <ChevronRight size={18} />
        </button>
      </div>

      {/* Results count */}
      <div style={{
        flexShrink: 0, padding: "0 16px 8px", background: "#fff",
        fontSize: 11, color: "#86868b", textAlign: "center",
      }}>
        {filtered.length} games{category !== "all" ? ` in ${category}` : ""}
      </div>
    </div>
  );
}

function EscHandler({ onEsc }: { onEsc: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onEsc(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEsc]);
  return null;
}
