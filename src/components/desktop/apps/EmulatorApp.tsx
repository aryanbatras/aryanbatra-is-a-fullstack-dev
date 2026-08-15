"use client";

import { useEffect, useRef, useState } from "react";
import { Gamepad2, UploadCloud } from "lucide-react";
import { readFiles } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

interface EmulatorAppProps {
  /** A persisted ROM file name from Finder (loaded from storage). */
  file?: string;
}

/** daedalOS emulatorCores — extension → EmulatorJS core id + console name. */
const ROM_CORES: { core: string; name: string; ext: string[] }[] = [
  { core: "atari2600", name: "Atari 2600", ext: [".a26"] },
  { core: "atari5200", name: "Atari 5200", ext: [".a52"] },
  { core: "atari7800", name: "Atari 7800", ext: [".a78"] },
  { core: "jaguar", name: "Atari Jaguar", ext: [".j64", ".jag"] },
  { core: "lynx", name: "Atari Lynx", ext: [".lnx"] },
  { core: "ngp", name: "Neo Geo Pocket", ext: [".ngc", ".ngp"] },
  { core: "n64", name: "Nintendo 64", ext: [".n64", ".v64", ".z64"] },
  { core: "nds", name: "Nintendo DS", ext: [".nds"] },
  { core: "nes", name: "Nintendo Entertainment System", ext: [".nes"] },
  { core: "gb", name: "Nintendo Game Boy / Color", ext: [".gb", ".gbc"] },
  { core: "gba", name: "Nintendo Game Boy Advance", ext: [".gba"] },
  { core: "pce", name: "PC Engine", ext: [".pce"] },
  { core: "sega32x", name: "Sega 32X", ext: [".32x"] },
  { core: "segaGG", name: "Sega Game Gear", ext: [".gg"] },
  { core: "segaMD", name: "Sega Genesis / Mega Drive", ext: [".gen", ".md", ".smd"] },
  { core: "segaMS", name: "Sega Master System", ext: [".sms"] },
  { core: "snes", name: "Super Nintendo", ext: [".sfc", ".smc"] },
  { core: "vb", name: "Virtual Boy", ext: [".vb", ".vboy"] },
  { core: "ws", name: "WonderSwan", ext: [".ws", ".wsc"] },
];

const coreFor = (name: string) =>
  ROM_CORES.find((c) => c.ext.some((e) => name.toLowerCase().endsWith(e)));

const EJS_SRCDOC = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}
#emulator{width:100%;height:100%;place-content:center}</style></head>
<body><div id="emulator"></div></body></html>`;

/**
 * EmulatorJS — the browser console emulator daedalOS ships. Runs NES, SNES,
 * Game Boy, GBA, N64, Sega, Atari and more, in an isolated iframe. Drop a ROM
 * (or open one from Finder) and it boots the matching core automatically.
 */
export default function EmulatorApp({ file }: EmulatorAppProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const bootedFor = useRef<string>("");
  const [rom, setRom] = useState<{ name: string; url: string; core: string; consoleName: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [frameKey, setFrameKey] = useState(0);

  const loadRom = (name: string, url: string) => {
    const match = coreFor(name);
    if (!match) {
      setError(`No emulator core for “${name}”.`);
      return;
    }
    setError(null);
    setLoading(true);
    setRom({ name, url, core: match.core, consoleName: match.name });
    // Fresh iframe per ROM — the old one is torn down cleanly.
    setFrameKey((k) => k + 1);
  };

  useEffect(() => {
    if (!file) return;
    const f = readFiles().find((x) => x.name === file);
    if (f?.content.startsWith("data:")) loadRom(f.name, f.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Boot EmulatorJS inside the iframe. Runs on iframe load (and immediately,
  // for a persisted ROM where the frame is already mounted).
  const boot = () => {
    const frame = frameRef.current;
    const win = frame?.contentWindow;
    if (!win || !rom) return;
    const guard = `${frameKey}:${rom.url}`;
    if (bootedFor.current === guard) return;
    bootedFor.current = guard;
    const doc = win.document;
    const EJS = win as unknown as Record<string, unknown>;
    EJS.EJS_gameName = rom.name.replace(/\.[^.]+$/, "");
    EJS.EJS_gameUrl = rom.url;
    EJS.EJS_core = rom.core;
    EJS.EJS_player = "#emulator";
    EJS.EJS_biosUrl = "";
    EJS.EJS_pathtodata = "/aryan/games/emulatorjs/";
    EJS.EJS_startOnLoaded = true;
    EJS.EJS_RESET_VARS = true;
    EJS.EJS_Buttons = {
      cacheManage: false,
      loadState: false,
      quickLoad: false,
      quickSave: false,
      saveState: false,
      screenRecord: false,
      screenshot: false,
    };
    EJS.EJS_onGameStart = () => {
      setLoading(false);
      setError(null);
    };
    EJS.EJS_onError = () => {
      setLoading(false);
      setError("The emulator failed to start — the ROM may be unsupported.");
    };
    const s = doc.createElement("script");
    s.src = "/aryan/games/emulatorjs/loader.js";
    doc.body.appendChild(s);
  };

  useEffect(() => {
    if (rom) boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rom, frameKey]);

  const pickFiles = (list: FileList | File[] | null) => {
    const f = Array.from(list ?? [])[0];
    if (f) loadRom(f.name, URL.createObjectURL(f));
  };

  return (
    <div
      className={styles.emuShell}
      data-app="emulator"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        pickFiles(e.dataTransfer?.files ?? null);
      }}
    >
      <div className={styles.emuHint}>
        <button
          type="button"
          className={styles.texteditBtn}
          onClick={() => (document.getElementById("emu-rom") as HTMLInputElement | null)?.click()}
        >
          <UploadCloud size={13} /> Open ROM…
        </button>
        <span className={styles.webampCount}>
          <Gamepad2 size={12} />
          {rom ? `${rom.name} · ${rom.consoleName}` : "drop a ROM to play"}
        </span>
      </div>
      <input
        id="emu-rom"
        type="file"
        accept=".nes,.smc,.sfc,.gb,.gbc,.gba,.n64,.z64,.gen,.md,.sms,.gg,.a26,.pce,.nds,.ws,.v64,.j64"
        hidden
        onChange={(e) => {
          pickFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {rom ? (
        <div className={`${styles.emuHost} ${dragOver ? styles.emuHostDrag : ""}`}>
          <iframe
            key={frameKey}
            ref={frameRef}
            onLoad={boot}
            title="Emulator"
            className={styles.emuFrame}
            srcDoc={EJS_SRCDOC}
          />
          {loading && <div className={styles.emuOverlay}>Loading {rom.name}…</div>}
          {error && <div className={styles.emuOverlay}>{error}</div>}
        </div>
      ) : (
        <div className={`${styles.emuDrop} ${dragOver ? styles.emuHostDrag : ""}`}>
          <Gamepad2 size={30} />
          <p>Drop a game ROM here and play it in the browser.</p>
          <p className={styles.emuDropSub}>
            NES · SNES · Game Boy · GBA · N64 · Sega · Atari · PC Engine — the
            right core loads automatically
          </p>
          <button type="button" className={styles.texteditBtn} onClick={() => (document.getElementById("emu-rom") as HTMLInputElement | null)?.click()}>
            <UploadCloud size={13} /> Open ROM…
          </button>
        </div>
      )}
    </div>
  );
}
