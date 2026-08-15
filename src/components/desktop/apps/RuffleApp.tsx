"use client";

import { useEffect, useRef, useState } from "react";
import { Clapperboard, UploadCloud } from "lucide-react";
import { readFiles } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

interface RuffleAppProps {
  /** A persisted .swf file name from Finder (loaded from storage). */
  file?: string;
}

/**
 * Ruffle — the Flash Player emulator daedalOS ships. Renders .swf files in
 * the browser with the real Ruffle web component. Drop a Flash game or open
 * one from Finder and it plays instantly.
 */
export default function RuffleApp({ file }: RuffleAppProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [swf, setSwf] = useState<{ name: string; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load ruffle.js once (it fetches its .wasm from the same folder).
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-ruffle]");
    if (existing) {
      setLoaded(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "/aryan/games/ruffle/ruffle.js";
    s.dataset.ruffle = "1";
    s.onload = () => setLoaded(true);
    s.onerror = () => setError("Could not load the Flash player.");
    document.body.appendChild(s);
  }, []);

  // daedalOS RufflePlayer.config — autoplay, letterboxed, no menu.
  useEffect(() => {
    if (!loaded) return;
    const RufflePlayer = (window as unknown as Record<string, any>).RufflePlayer;
    if (!RufflePlayer) return;
    RufflePlayer.config = {
      allowScriptAccess: false,
      autoplay: "on",
      backgroundColor: "#000000",
      letterbox: "on",
      menu: false,
      polyfills: false,
      preloader: false,
      unmuteOverlay: "hidden",
    };
  }, [loaded]);

  const playSwf = (name: string, url: string) => {
    setError(null);
    setSwf({ name, url });
    setLoading(true);
  };

  useEffect(() => {
    if (!file) return;
    const f = readFiles().find((x) => x.name === file);
    if (f?.content.startsWith("data:")) playSwf(f.name, f.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create a fresh player and load the movie.
  useEffect(() => {
    if (!swf || !loaded) return;
    const host = hostRef.current;
    const RufflePlayer = (window as unknown as Record<string, any>).RufflePlayer;
    if (!host || !RufflePlayer) return;
    host.innerHTML = "";
    const player = RufflePlayer.newest().createPlayer();
    host.appendChild(player);
    player
      .load({ url: swf.url })
      .then(() => setLoading(false))
      .catch(() => {
        setLoading(false);
        setError("Ruffle could not play this Flash file.");
      });
    return () => {
      try {
        player.remove();
      } catch {
        // Already removed
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swf, loaded]);

  const pickFiles = (list: FileList | File[] | null) => {
    const f = Array.from(list ?? [])[0];
    if (f) playSwf(f.name, URL.createObjectURL(f));
  };

  return (
    <div
      className={styles.emuShell}
      data-app="ruffle"
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
          onClick={() => (document.getElementById("ruffle-swf") as HTMLInputElement | null)?.click()}
        >
          <UploadCloud size={13} /> Open Flash File…
        </button>
        <span className={styles.webampCount}>
          <Clapperboard size={12} />
          {swf ? swf.name : "drop a .swf to play"}
        </span>
      </div>
      <input
        id="ruffle-swf"
        type="file"
        accept=".swf,.spl"
        hidden
        onChange={(e) => {
          pickFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {swf ? (
        <div className={`${styles.emuHost} ${dragOver ? styles.emuHostDrag : ""}`}>
          <div ref={hostRef} className={styles.emuFrame} />
          {loading && <div className={styles.emuOverlay}>Loading {swf.name}…</div>}
          {error && <div className={styles.emuOverlay}>{error}</div>}
        </div>
      ) : (
        <div className={`${styles.emuDrop} ${dragOver ? styles.emuHostDrag : ""}`}>
          <Clapperboard size={30} />
          <p>Drop a Flash (.swf) file here — games, animations, the lot.</p>
          <p className={styles.emuDropSub}>
            Ruffle emulates Flash in the browser, straight from daedalOS
          </p>
          <button type="button" className={styles.texteditBtn} onClick={() => (document.getElementById("ruffle-swf") as HTMLInputElement | null)?.click()}>
            <UploadCloud size={13} /> Open Flash File…
          </button>
        </div>
      )}
    </div>
  );
}
