"use client";

import EmscriptenGame, {
  type EmscriptenGameConfig,
  type EmGameWindow,
} from "@/components/desktop/apps/EmscriptenGame";

/**
 * Space Cadet 3D Pinball — the Windows classic, compiled to WASM and
 * ported straight from daedalOS. The glue is a classic (non-modular)
 * Emscripten build: it honors `Module.locateFile` for the .data package and
 * .wasm, and calls `Module.postRun` once the table is ready — which is why
 * both are wired up in `preload`, BEFORE the script executes.
 */
const SPACE_CADET_CONFIG: EmscriptenGameConfig = {
  scriptSrc: "/aryan/games/SpaceCadet/SpaceCadetPinball.js",
  locateFile: (path) =>
    `/aryan/games/SpaceCadet/${path.replace(/^Program%20Files\/SpaceCadet\//, "")}`,
  preload: (win: EmGameWindow, booted) => {
    win.Module = {
      canvas: win.__pinballCanvas,
      windowElement: win.document.body,
      postRun: booted,
      print: () => undefined,
      printErr: () => undefined,
    };
  },
  onShutdown: (win) => {
    try {
      win.Module?.SDL2?.audioContext?.close();
    } catch {
      // Ignore audio close errors
    }
  },
  // The glue runs synchronously and never signals readiness if something
  // went wrong — never leave the player staring at a spinner.
  bootTimeout: 20000,
};

interface SpaceCadetGameProps {
  onExit: () => void;
}

/** Space Cadet 3D Pinball — flippers, bumpers, gravity. */
export default function SpaceCadetGame({ onExit }: SpaceCadetGameProps) {
  return (
    <EmscriptenGame
      {...SPACE_CADET_CONFIG}
      title="Space Cadet Pinball"
      icon="pinball"
      accent="#3aa0ff"
      keys="Z / / · X / . — left / right flippers · ↑ launches the ball"
      hint="The legendary Windows 95 table, ported from the daedalOS machine."
      onExit={onExit}
    />
  );
}
