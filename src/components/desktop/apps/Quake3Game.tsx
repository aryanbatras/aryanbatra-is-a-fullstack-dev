"use client";

import EmscriptenGame, {
  type EmscriptenGameConfig,
  type EmGameWindow,
} from "@/components/desktop/apps/EmscriptenGame";

/**
 * Quake III Arena — daedalOS's WASM port of the classic FPS. The glue
 * creates its own canvas, and its patched CDN loader pulls the game data
 * from `./Program Files/Quake3/Quake3Game.pk3` — resolved against the
 * frame's <base href>, so the folder structure under /aryan/games/Quake3/
 * mirrors the daedalOS path exactly.
 */
const QUAKE3_CONFIG: EmscriptenGameConfig = {
  scriptSrc: "/aryan/games/Quake3/Quake3Game.js",
  baseHref: "/aryan/games/Quake3/",
  createsCanvas: true,
  preload: (win: EmGameWindow) => {
    // The glue merges an existing `ioq3` object, then exposes itself as
    // `ioq3` — keep a stable reference so config below sticks.
    win.ioq3 = win.ioq3 || {};
  },
  onScriptLoaded: (win, booted) => {
    const ioq3 = win.ioq3;
    if (!ioq3) {
      booted();
      return;
    }
    ioq3.viewport = win.document.body;
    ioq3.elementPointerLock = true;
    ioq3.callMain?.([]);

    // The canvas appears as soon as the GL context is up — focus it so
    // keyboard + pointer-lock work without an extra click.
    const initCanvas = () => {
      if (ioq3.canvas) {
        ioq3.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
        try {
          ioq3.canvas.focus({ preventScroll: true });
        } catch {
          // Older browsers don't accept options
        }
        booted();
      } else {
        requestAnimationFrame(initCanvas);
      }
    };
    initCanvas();
  },
  onShutdown: (win) => {
    try {
      win.ioq3?.exit?.();
    } catch {
      // Ignore exit errors
    }
    try {
      win.AL?.contexts.forEach(({ ctx }) => ctx.close());
    } catch {
      // Ignore audio close errors
    }
  },
};

interface Quake3GameProps {
  onExit: () => void;
}

/** Quake III Arena — full 3D FPS with bots, running in the browser. */
export default function Quake3Game({ onExit }: Quake3GameProps) {
  return (
    <EmscriptenGame
      {...QUAKE3_CONFIG}
      title="Quake III Arena"
      icon="quake"
      accent="#ff4d2e"
      keys="WASD — move · Mouse — look · Space — jump · Ctrl — crouch · Tab — scores"
      hint="Fight the bots. Click the game to capture the mouse, Esc releases it."
      onExit={onExit}
    />
  );
}
