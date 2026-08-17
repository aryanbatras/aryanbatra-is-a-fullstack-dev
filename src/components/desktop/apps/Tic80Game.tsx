"use client";

import EmscriptenGame, {
  type EmscriptenGameConfig,
  type EmGameWindow,
} from "@/components/desktop/apps/EmscriptenGame";
import { readFiles } from "@/utils/finderStorage";

/**
 * TIC-80 — the "fantasy computer" (pico-8 style), ported from daedalOS.
 * A tiny virtual machine for making/playing retro games in Lua. A .tic cart
 * file opened from Finder boots straight into it (daedalOS passes the cart
 * as Module.arguments). The WASM runs in the isolated game frame.
 */

/** URL of a .tic cart to boot, or empty to open the TIC-80 welcome screen. */
interface Tic80GameProps {
  onExit: () => void;
  /** Name of a .tic cart file in the Finder docs folder (boots it). */
  cart?: string;
  fullWindow?: boolean;
}

/** Load a .tic cart as a blob URL so TIC-80 can fetch it (synchronous —
 *  Module must exist before the game script executes). */
function cartToUrl(cart?: string): string {
  if (!cart) return "";
  const file = readFiles().find((f) => f.name === cart);
  if (!file?.content) return "";
  const blob = new Blob([file.content], { type: "application/octet-stream" });
  return `${URL.createObjectURL(blob)}?e=.tic`;
}

interface Tic80GameConfig extends EmscriptenGameConfig {
  cart?: string;
}

export default function Tic80Game({ onExit, cart, fullWindow }: Tic80GameProps) {
  const config: Tic80GameConfig = {
    scriptSrc: "/aryan/apps/tic80/tic80.js",
    baseHref: "/aryan/apps/tic80/",
    createsCanvas: false,
    cart,
    preload: (win: EmGameWindow, booted) => {
      const cartUrl = cartToUrl(cart);
      win.Module = {
        canvas: win.__pinballCanvas,
        windowElement: win.document.body,
        arguments: cartUrl ? [cartUrl] : undefined,
        postRun: () => {
          win.document.body.setAttribute(
            "style",
            "display:flex;place-content:center;place-items:center;background:#1a1c2c",
          );
          booted();
        },
      };
      win.Module.locateFile = (path: string) => `/aryan/apps/tic80/${path}`;
    },
    // The glue never calls postRun if it can't fetch the wasm.
    bootTimeout: 20000,
  };

  return (
    <EmscriptenGame
      {...config}
      title={cart ? cart : "TIC-80"}
      icon="emulator"
      accent="#ffec27"
      keys="Arrow keys · Z / X — fire / jump · ESC — menu"
      hint="The fantasy computer — open a .tic cart from Finder to play it, or run the built-in demo."
      onExit={onExit}
      fullWindow={fullWindow}
    />
  );
}
