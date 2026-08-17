"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Keyboard, Loader2 } from "lucide-react";
import Glyph from "@/components/desktop/Glyph";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Config for a single Emscripten game. Models daedalOS's
 * `useIsolatedContentWindow`: the game runs in a blank iframe with its own
 * canvas, so WASM games can't touch (or be touched by) the desktop shell.
 */
export interface EmscriptenGameConfig {
  /** URL of the game's Emscripten JS glue. */
  scriptSrc: string;
  /** <base href> written into the game frame — lets relative asset XHRs
   *  (Quake3's `./Program Files/Quake3/Quake3Game.pk3`) resolve correctly. */
  baseHref?: string;
  /** Maps asset paths to absolute URLs (SpaceCadet's .data / .wasm). */
  locateFile?: (path: string) => string;
  /** Prepare the frame window BEFORE the game script loads. `booted` hides
   *  the loading overlay — call it the moment the game is playable. */
  preload?: (win: EmGameWindow, booted: () => void) => void;
  /** Runs once the game script has finished loading. */
  onScriptLoaded?: (win: EmGameWindow, booted: () => void) => void;
  /** Safety-net delay (ms) before force-hiding the loading overlay, for
   *  games whose glue never signals readiness. 0 disables it. */
  bootTimeout?: number;
  /** Clean shutdown when the component unmounts. */
  onShutdown?: (win: EmGameWindow) => void;
  /** Whether the game creates its own canvas (Quake3) vs needing one. */
  createsCanvas?: boolean;
}

/** The game window + the globals the Emscripten glues expect. */
export interface EmGameWindow extends Window {
  Module?: {
    canvas?: HTMLCanvasElement;
    locateFile?: (path: string, prefix?: string) => string;
    postRun?: () => void;
    windowElement?: HTMLElement;
    SDL2?: { audioContext?: AudioContext };
    FS?: unknown;
    [key: string]: unknown;
  };
  ioq3?: {
    canvas?: HTMLCanvasElement | null;
    elementPointerLock?: boolean;
    viewport?: HTMLElement | null;
    callMain?: (args: string[]) => void;
    exit?: () => void;
    setCanvasSize?: (w: number, h: number) => void;
    [key: string]: unknown;
  };
  AL?: { contexts: { ctx: AudioContext }[] };
  __pinballCanvas?: HTMLCanvasElement;
  /** ClassiCube's Emscripten module (CCModule). */
  CCModule?: {
    canvas?: HTMLCanvasElement;
    locateFile?: (path: string, prefix?: string) => string;
    OnResize?: () => void;
    arguments?: string[];
    setCanvasSize?: (w: number, h: number) => void;
    postRun?: Array<() => void>;
    print?: () => void;
    setStatus?: () => void;
    windowElement?: HTMLElement;
    exit?: () => void;
    FS?: unknown;
    [key: string]: unknown;
  };
}

/** WebGL canvases are cleared after compositing — keep the drawing buffer so
 *  the composited frame (inside the window) never flashes black. */
function alwaysPreserveDrawingBuffer(win: EmGameWindow): void {
  const g = win as unknown as Window & typeof globalThis;
  const origGetContext = g.HTMLCanvasElement.prototype.getContext;
  const patchedGetContext = function patchedGetContext(
    this: HTMLCanvasElement,
    contextId: string,
    options?: WebGLContextAttributes,
  ): RenderingContext | null {
    if (contextId === "webgl" || contextId === "webgl2") {
      options = Object.assign({}, options, { preserveDrawingBuffer: true });
    }
    return (origGetContext as (
      id: string,
      opts?: unknown,
    ) => RenderingContext | null).call(this, contextId, options);
  } as unknown as typeof origGetContext;
  g.HTMLCanvasElement.prototype.getContext = patchedGetContext;
}

interface EmscriptenGameProps extends EmscriptenGameConfig {
  title: string;
  icon: string;
  accent: string;
  /** Control keys shown in the hint bar. */
  keys: string;
  /** Optional extra hint text under the frame. */
  hint?: string;
  onExit: () => void;
  /** Full-window mode (macOS Tahoe): no custom game bar — the standard
   *  window titlebar (3 traffic lights) is the chrome, and the game fills
   *  the whole window. */
  fullWindow?: boolean;
}

/** Shell for a WASM game: game bar + isolated iframe + loading overlay. */
export default function EmscriptenGame({
  title,
  icon,
  accent,
  keys,
  hint,
  onExit,
  onScriptLoaded,
  onShutdown,
  createsCanvas = false,
  fullWindow = false,
  ...cfg
}: EmscriptenGameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [booted, setBooted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = frameRef.current;
    if (!container) return;

    let cancelled = false;
    const markBooted = () => {
      if (!cancelled) setBooted(true);
    };

    const iframe = document.createElement("iframe");
    iframe.title = title;
    iframe.setAttribute("allow", "autoplay; fullscreen");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.style.background = "#000";

    container.appendChild(iframe);

    // A real document with its own <base> — relative asset requests from the
    // game resolve against the base, exactly like a standalone page. Assigned
    // AFTER the load listener so boot never races the listener.
    iframe.srcdoc = [
      "<!DOCTYPE html><html><head>",
      cfg.baseHref ? `<base href="${cfg.baseHref}">` : "",
      "<style>",
      "html,body{height:100%;width:100%;margin:0;overflow:hidden;background:#000}",
      "body{display:flex;place-content:center;place-items:center}",
      "canvas{display:block;background:#000}",
      "canvas:focus-visible{outline:none}",
      "</style></head><body></body></html>",
    ].join("");

    iframe.addEventListener("load", () => {
      if (cancelled) return;
      const win = iframe.contentWindow as EmGameWindow;
      if (!win) return;

      alwaysPreserveDrawingBuffer(win);

      // SpaceCadet needs a canvas injected before the glue runs.
      if (!createsCanvas) {
        const canvas = win.document.createElement("canvas");
        canvas.id = "canvas";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.tabIndex = -1;
        win.document.body.appendChild(canvas);
        win.__pinballCanvas = canvas;
      }

      try {
        cfg.preload?.(win, markBooted);
      } catch {
        setFailed(true);
        return;
      }

      // Honor Module.locateFile for asset path remapping — merged in AFTER
      // preload so the game's own Module fields are never clobbered.
      if (cfg.locateFile) {
        const map = cfg.locateFile;
        const module = win.Module ?? (win.Module = {});
        module.locateFile = (path: string, _prefix?: string) => map(path);
      }

      const script = win.document.createElement("script");
      script.src = cfg.scriptSrc;
      script.async = false;
      script.onerror = () => {
        if (!cancelled) setFailed(true);
      };
      script.onload = () => {
        if (cancelled) return;
        onScriptLoaded?.(win, markBooted);
        // Some glues never fire a readiness callback — don't strand the user
        // behind the loading overlay forever.
        if (cfg.bootTimeout) window.setTimeout(markBooted, cfg.bootTimeout);
      };
      win.document.head.appendChild(script);
    });

    return () => {
      cancelled = true;
      const win = iframe.contentWindow as EmGameWindow | null;
      try {
        onShutdown?.(win as EmGameWindow);
      } catch {
        // Ignore shutdown errors
      }
      iframe.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.scriptSrc, cfg.baseHref]);

  return (
    <div
      className={`${styles.gameShell} ${fullWindow ? styles.gameFullWindow : ""}`}
      data-game="emu"
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {!fullWindow && (
        <div className={styles.gameBar}>
          <button
            type="button"
            className={styles.gameBack}
            onClick={onExit}
            aria-label="Back to arcade"
          >
            <ArrowLeft size={15} />
          </button>
          <span className={styles.gameTitleIcon}>
            <Glyph id={icon} size={15} />
          </span>
          <span className={styles.gameTitle}>{title}</span>
          {!booted && !failed && (
            <span className={styles.gameScore}>
              <Loader2 size={11} className={styles.gameSpin} style={{ verticalAlign: -2 }} />{" "}
              Loading {title}…
            </span>
          )}
        </div>
      )}

      <div className={styles.gameEmuFrame} ref={frameRef}>
        {!booted && (
          <div className={styles.gameEmuLoading}>
            {failed ? (
              <>
                <strong>Failed to load {title}</strong>
                <span className={styles.gameOverlaySub}>
                  The WASM bundle didn&apos;t start. Try again, or open it in a
                  real browser tab.
                </span>
              </>
            ) : (
              <>
                <Loader2 size={26} className={styles.gameSpin} />
                <span>
                  Booting {title}… <em>(downloads once, then it&apos;s instant)</em>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {!fullWindow && hint && (
        <p className={styles.gameHint}>
          <Keyboard size={12} /> {hint}
        </p>
      )}
      {!fullWindow && (
        <p className={styles.gameHint}>
          <Keyboard size={12} /> {keys} · click the game to focus it
        </p>
      )}
    </div>
  );
}
