"use client";

import { useEffect, useRef, useState } from "react";
import { strToU8, unzipSync, zipSync } from "fflate";
import { readFiles } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * BoxedWine — runs real 16/32-bit Windows programs (.exe / .zip) in the
 * browser, ported from daedalOS. The full Wine runtime is served locally from
 * /aryan/apps/boxedwine (wine 1.7.55, on-demand overlay) so everything works
 * offline. An .exe opened from Finder is zipped on the fly (daedalOS does the
 * same with fflate) and passed to BoxedWine as a base64 app-payload.
 */

declare global {
  interface Window {
    BoxedWineConfig?: {
      consoleLog?: (log: string) => void;
      isRunning?: boolean;
      urlParams?: string;
    };
    BoxedWineShell?: (onLoad: () => void) => void;
  }
}

interface BoxedWineAppProps {
  /** A .exe or .zip file in the Finder docs folder to run. */
  file?: string;
}

/** Base config — wine root + on-demand overlay, resolved under our local path. */
const getConfig = (dynamic: Record<string, string>): string =>
  [
    ["root", "/fullWine1.7.55-v8"],
    ["ondemand", "root"],
    ["resolution", "640x480"],
    ["inline-default-ondemand-root-overlay", "/wine1.7.55-v8-min-online"],
    ...Object.entries(dynamic),
  ]
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

/** Find the biggest .exe in a zip (daedalOS getExeName). */
function getExeName(zip: Uint8Array): string | undefined {
  const files = unzipSync(zip);
  const names = Object.keys(files).filter((n) =>
    n.toLowerCase().endsWith(".exe"),
  );
  if (names.length === 0) return undefined;
  return names.sort((a, b) => files[b].length - files[a].length)[0];
}

export default function BoxedWineApp({ file }: BoxedWineAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading BoxedWine…");
  const [ready, setReady] = useState(false);
  const bootedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || bootedRef.current) return;
    bootedRef.current = true;

    // An .exe / .zip payload from the Finder file system.
    const loadPayload = async (): Promise<string> => {
      if (!file) return "";
      const f = readFiles().find((x) => x.name === file);
      if (!f?.content) return "";
      const bytes = strToU8(f.content);
      const isExe = file.toLowerCase().endsWith(".exe");
      let payload = bytes;
      let appName = "";
      if (isExe) {
        // daedalOS zips a lone .exe so BoxedWine can extract it.
        payload = zipSync({ [file]: bytes });
        appName = file;
      } else {
        try {
          appName = getExeName(bytes) ?? "";
        } catch {
          payload = zipSync({ [file]: bytes });
        }
      }
      const dynamic: Record<string, string> = {};
      if (payload.length > 0) {
        // Base64 in urlParams like daedalOS's app-payload.
        let binary = "";
        const chunk = 0x8000;
        for (let i = 0; i < payload.length; i += chunk) {
          binary += String.fromCharCode(...payload.subarray(i, i + chunk));
        }
        dynamic["app-payload"] = btoa(binary);
      }
      if (appName) dynamic["p"] = appName;
      return getConfig(dynamic);
    };

    // An <ol> for BoxedWine's console output (daedalOS appends one).
    const consoleEl = document.createElement("ol");
    consoleEl.className = styles.boxedwineConsole;
    container.appendChild(consoleEl);

    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed ${src}`));
        document.head.appendChild(s);
      });

    (async () => {
      setStatus("Loading BoxedWine…");
      try {
        await loadScript("/aryan/apps/boxedwine/browserfs.boxedwine.js");
        await loadScript("/aryan/apps/boxedwine/boxedwine-shell.js");
        const urlParams = await loadPayload();
        window.BoxedWineConfig = {
          ...window.BoxedWineConfig,
          consoleLog: (log: string) => {
            const li = document.createElement("li");
            li.textContent = log;
            consoleEl.append(li);
            consoleEl.scrollTop = consoleEl.scrollHeight;
          },
          urlParams,
        };
        setStatus("Booting Wine…");
        // boxedwine.js must load after the shell so the config is in place.
        await loadScript("/aryan/apps/boxedwine/boxedwine.js");
        window.BoxedWineShell?.(() => {
          setReady(true);
          setStatus("");
        });
      } catch {
        setStatus("Failed to load BoxedWine");
      }
    })();

    return () => {
      window.BoxedWineConfig = {
        ...window.BoxedWineConfig,
        isRunning: false,
      };
      consoleEl.remove();
    };
  }, [file]);

  return (
    <div className={styles.boxedwine}>
      <div ref={containerRef} className={styles.boxedwineBody} />
      {!ready && (
        <div className={styles.boxedwineLoading}>
          <span className={styles.gameSpin} style={{ display: "inline-block" }} />
          {status || "Loading BoxedWine…"}
          <em>Wine is ~60MB — downloads once, then it&apos;s instant.</em>
        </div>
      )}
    </div>
  );
}
