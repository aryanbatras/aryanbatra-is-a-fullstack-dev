"use client";

import EmscriptenGame, {
  type EmscriptenGameConfig,
  type EmGameWindow,
} from "@/components/desktop/apps/EmscriptenGame";

/**
 * ClassiCube — the Minecraft Classic-compatible client, ported from daedalOS.
 * The Emscripten build boots into a singleplayer world with `Module.arguments
 * = ["Singleplayer"]`, draws to its own canvas, and exposes CCModule for
 * window resizing (mirrored here in `preload`).
 */
const CLASSICUBE_CONFIG: EmscriptenGameConfig = {
  scriptSrc: "/aryan/apps/classicube/ClassiCube.js",
  baseHref: "/aryan/apps/classicube/",
  createsCanvas: false,
  preload: (win: EmGameWindow, booted) => {
    win.CCModule = {
      arguments: ["Singleplayer"],
      canvas: win.__pinballCanvas,
      print: () => undefined,
      setStatus: () => undefined,
      windowElement: win.document.body,
      postRun: [
        () => {
          const c = win.__pinballCanvas;
          if (c) {
            const { width, height } = c.getBoundingClientRect() || {};
            if (width) c.width = width;
            if (height) c.height = height;
          }
          booted();
        },
      ],
    };
    // Honor the (few) asset requests against the local folder.
    win.CCModule.locateFile = (path: string) => `/aryan/apps/classicube/${path}`;
  },
  onShutdown: (win) => {
    try {
      win.CCModule?.exit?.();
    } catch {
      // Ignore shutdown errors
    }
  },
  bootTimeout: 30000,
};

interface ClassiCubeGameProps {
  onExit: () => void;
  fullWindow?: boolean;
}

/** ClassiCube — Minecraft Classic in the browser. */
export default function ClassiCubeGame({ onExit, fullWindow }: ClassiCubeGameProps) {
  return (
    <EmscriptenGame
      {...CLASSICUBE_CONFIG}
      title="ClassiCube"
      icon="gamepad"
      accent="#5ad96c"
      keys="WASD — move · Space — jump · Shift — sneak · ESC — pause"
      hint="Minecraft Classic-compatible client, ported from the daedalOS machine."
      onExit={onExit}
      fullWindow={fullWindow}
    />
  );
}
