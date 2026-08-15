"use client";

import { useEffect, useRef, useState } from "react";
import { MonitorPlay, UploadCloud } from "lucide-react";
import { readFiles } from "@/utils/finderStorage";
import { strToBytes, zipEntries } from "@/utils/archives";
import styles from "@/styles/components/desktop/apps.module.css";

interface JSDOSAppProps {
  /** A persisted .jsdos/.exe/.zip DOS game from Finder. */
  file?: string;
}

const DOS_EXT = /\.(jsdos|exe|com|bat|zip)$/i;

/**
 * js-dos — the DOSBox emulator daedalOS ships. Runs .jsdos bundles (and raw
 * .exe/.zip games, which get wrapped with a dosbox config like daedalOS).
 */
export default function JSDOSApp({ file }: JSDOSAppProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<{ name: string; url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [ready, setReady] = useState(false);
  const dosRef = useRef<any>(null);

  // Load the emulators scripts once (wasm is resolved via pathPrefix).
  useEffect(() => {
    let cancelled = false;
    const W = window as unknown as Record<string, any>;
    const load = (src: string) =>
      new Promise<void>((resolve, reject) => {
        if (src.includes("emulators.js") && W.emulators) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(src));
        document.body.appendChild(s);
      });
    Promise.all([
      load("/aryan/games/jsdos/emulators.js"),
      load("/aryan/games/jsdos/emulators-ui.js"),
    ])
      .then(() => {
        if (cancelled) return;
        W.emulators.pathPrefix = "/aryan/games/jsdos/";
        setReady(true);
      })
      .catch(() => setError("Could not load the DOS emulator."));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!file) return;
    const f = readFiles().find((x) => x.name === file);
    if (f?.content.startsWith("data:")) loadGame(f.name, f.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGame = (name: string, url: string) => {
    setError(null);
    setGame({ name, url });
    setLoading(true);
  };

  // Boot DOSBox and run the game once scripts are ready.
  useEffect(() => {
    if (!game || !ready) return;
    let cancelled = false;
    const W = window as unknown as Record<string, any>;
    (async () => {
      try {
        const host = hostRef.current;
        if (!host) return;
        host.innerHTML = "";
        const dos = await W.Dos(host, { emulatorFunction: "dosWorker" });
        if (cancelled) {
          dos.stop?.();
          return;
        }
        dosRef.current = dos;
        // Non-.jsdos games get wrapped with the dosbox config (daedalOS
        // addJsDosConfig) so raw .exe/.zip files boot straight to the prompt.
        let bundleUrl = game.url;
        if (!DOS_EXT.test(game.name) || /\.(exe|com|bat|zip)$/i.test(game.name)) {
          const [conf, json, bytes] = await Promise.all([
            fetch("/aryan/games/jsdos/dosbox.conf").then((r) => r.text()),
            fetch("/aryan/games/jsdos/jsdos.json").then((r) => r.text()),
            fetch(game.url).then((r) => r.arrayBuffer()),
          ]);
          const zip = zipEntries([
            { path: game.name, directory: false, bytes: new Uint8Array(bytes) },
            { path: ".jsdos/dosbox.conf", directory: false, bytes: strToBytes(conf) },
            { path: ".jsdos/jsdos.json", directory: false, bytes: strToBytes(json) },
          ]);
          bundleUrl = URL.createObjectURL(
            new Blob([zip.slice().buffer as ArrayBuffer], { type: "application/zip" }),
          );
        }
        await dos.run(bundleUrl);
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError("Could not start the DOS game.");
        }
      }
    })();
    return () => {
      cancelled = true;
      dosRef.current?.stop?.();
      dosRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, ready]);

  const pickFiles = (list: FileList | File[] | null) => {
    const f = Array.from(list ?? [])[0];
    if (f) loadGame(f.name, URL.createObjectURL(f));
  };

  return (
    <div
      className={styles.emuShell}
      data-app="jsdos"
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
          onClick={() => (document.getElementById("dos-game") as HTMLInputElement | null)?.click()}
        >
          <UploadCloud size={13} /> Open DOS Game…
        </button>
        <span className={styles.webampCount}>
          <MonitorPlay size={12} />
          {game ? game.name : "drop a .jsdos / .exe / .zip game"}
        </span>
      </div>
      <input
        id="dos-game"
        type="file"
        accept=".jsdos,.exe,.com,.bat,.zip"
        hidden
        onChange={(e) => {
          pickFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {game ? (
        <div className={`${styles.emuHost} ${dragOver ? styles.emuHostDrag : ""}`}>
          <div ref={hostRef} className={styles.emuFrame} />
          {loading && <div className={styles.emuOverlay}>Booting {game.name}…</div>}
          {error && <div className={styles.emuOverlay}>{error}</div>}
        </div>
      ) : (
        <div className={`${styles.emuDrop} ${dragOver ? styles.emuHostDrag : ""}`}>
          <MonitorPlay size={30} />
          <p>Drop a DOS game here — .jsdos bundles, .exe, .zip.</p>
          <p className={styles.emuDropSub}>
            DOSBox runs entirely in the browser, ported from daedalOS
          </p>
          <button type="button" className={styles.texteditBtn} onClick={() => (document.getElementById("dos-game") as HTMLInputElement | null)?.click()}>
            <UploadCloud size={13} /> Open DOS Game…
          </button>
        </div>
      )}
    </div>
  );
}
