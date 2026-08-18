/**
 * CDN Configuration for heavy WASM/binary assets.
 *
 * Instead of hosting ~190MB of binaries in /public/aryan/ (which Vercel serves
 * from a single origin), we point to free public CDNs (unpkg, jsDelivr).
 *
 * Benefits:
 *   - Browser loads from CDN edge nodes (faster than your single Vercel region)
 *   - CDN files have immutable Cache-Control headers (instant on repeat visits)
 *   - Your Vercel deployment stays small and deploys fast
 *   - CDN bandwidth is free (unpkg: unlimited, jsDelivr: 50TB/month)
 *
 * If a CDN goes down, assets fall back to the local /aryan/ paths.
 */

/* ─── CDN Fallback Helper ───────────────────────────────────────────
 *
 * Attempts to load a script from the CDN URL. If it fails (network error,
 * CORS, 404), falls back to the local path. This gives us the speed of
 * CDNs with the reliability of self-hosting.
 */
export const loadScriptWithFallback = (
  cdnUrl: string,
  localUrl: string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const tryLocal = () => {
      const s = document.createElement("script");
      s.src = localUrl;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${localUrl}`));
      document.head.appendChild(s);
    };
    const s = document.createElement("script");
    s.src = cdnUrl;
    s.onload = () => resolve();
    s.onerror = tryLocal; // CDN failed → try local
    document.head.appendChild(s);
  });

const CDN = {
  /** Base URL for assets that stayed in /public/aryan/ (no CDN mirror). */
  LOCAL: "/aryan",

  /** Phase 1 — Stockfish 18 chess engine (WASM) */
  STOCKFISH: {
    js: "https://unpkg.com/stockfish@18.0.8/bin/stockfish-18-lite-single.js",
    wasm: "https://unpkg.com/stockfish@18.0.8/bin/stockfish-18-lite-single.wasm",
    local: "/aryan/games/chess/stockfish-18-lite-single",
  },

  /** Phase 2 — v86 x86 PC emulator */
  V86: {
    js: "https://cdn.jsdelivr.net/npm/v86@0.5.432/build/libv86.js",
    wasm: "https://cdn.jsdelivr.net/npm/v86@0.5.432/build/v86.wasm",
    bios: "/aryan/apps/v86/bios",
    local: "/aryan/apps/v86",
  },

  /** Phase 3 — Pyodide (CPython in the browser) */
  PYODIDE: {
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
    local: "/aryan/apps/pyodide/",
  },

  /** Phase 4 — Ruffle Flash Player emulator */
  RUFFLE: {
    js: "https://unpkg.com/@ruffle-rs/ruffle@0.5.0/ruffle.js",
    local: "/aryan/games/ruffle",
  },

  /** Phase 5 — Monaco Editor (VS Code in the browser) */
  MONACO: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs",
    local: "/aryan/apps/monaco/vs",
  },

  /** Phase 6 — EmulatorJS (retro console emulator) */
  EMULATORJS: {
    loader: "https://cdn.jsdelivr.net/gh/EmulatorJS/EmulatorJS@latest/data/loader.js",
    js: "https://cdn.jsdelivr.net/gh/EmulatorJS/EmulatorJS@latest/data/emulator.min.js",
    css: "https://cdn.jsdelivr.net/gh/EmulatorJS/EmulatorJS@latest/data/emu-css.min.css",
    cores: "/aryan/games/emulatorjs/cores",
    local: "/aryan/games/emulatorjs",
  },

  /** Phase 7 — TinyMCE rich-text editor */
  TINYMCE: {
    js: "https://cdn.jsdelivr.net/npm/tinymce@7.9.3/tinymce.min.js",
    local: "/aryan/apps/tinymce",
  },

  /** Phase 8 — Eruda DevTools */
  ERUDA: {
    js: "https://cdn.jsdelivr.net/npm/eruda@3.4.0/eruda.min.js",
    local: "/aryan/apps/eruda",
  },

  /**
   * Phase 9+ — Assets with NO public CDN mirror.
   * These stay in /public/aryan/ but benefit from the Cache-Control headers
   * we add in next.config.ts (immutable, 1 year cache).
   */
  BOXEDWINE: { local: "/aryan/apps/boxedwine" },
  QUAKE3: { local: "/aryan/games/Quake3" },
  SPACECADET: { local: "/aryan/games/SpaceCadet" },
  TIC80: { local: "/aryan/apps/tic80" },
  CLASSICUBE: { local: "/aryan/apps/classicube" },
  VIM: { local: "/aryan/apps/vim" },
  DXBALL: { local: "/aryan/apps/dxball" },
  KIWIIRC: { local: "/aryan/apps/kiwiirc" },
  SEVENZIP: { local: "/aryan/apps/7zip" },
  JSDOS: { local: "/aryan/games/jsdos" },
  ESHEEP: { local: "/aryan/apps/esheep" },
} as const;

export default CDN;
