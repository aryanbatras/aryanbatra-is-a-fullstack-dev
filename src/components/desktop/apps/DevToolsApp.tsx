import { useEffect, useRef, useState } from "react";
import CDN from "@/constants/cdn";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * DevTools — eruda, the same mobile devtools daedalOS ships. Console,
 * Elements, Network, Resources and Sources tools rendered into the window;
 * loaded from local assets so it works offline.
 */

interface ErudaInitOptions {
  autoScale?: boolean;
  container?: HTMLElement;
  tool?: string[];
  defaults?: Record<string, unknown>;
  useShadowDom?: boolean;
}

interface ErudaApi {
  init: (options: ErudaInitOptions) => void;
  add: (plugin: unknown) => void;
  show: () => void;
  destroy: () => void;
  get: (name: string) => { select?: (el: Element) => void };
}

declare global {
  interface Window {
    eruda?: ErudaApi;
    erudaMonitor?: unknown;
  }
}

/** Tools that fit the window width, widest first (daedalOS does the same). */
const TOOLS = ["console", "elements", "network", "resources", "sources"];

export default function DevToolsApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // eruda needs a child <div> as its mount point.
    const mount = document.createElement("div");
    container.appendChild(mount);

    const load = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) { resolve(); return; }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });

    void (async () => {
      try {
        await load(CDN.ERUDA.js);
        await load(`${CDN.ERUDA.local}/eruda-monitor.js`);
      } catch {
        return;
      }
      const eruda = window.eruda;
      if (!eruda) return;
      eruda.init({
        autoScale: true,
        defaults: {
          displaySize: 100,
          theme: "Monokai Pro",
          transparency: 0,
        },
        useShadowDom: false,
        container: mount,
        tool: TOOLS,
      });
      // CPU/memory monitor panel (daedalOS adds it when space allows).
      if (window.erudaMonitor) eruda.add(window.erudaMonitor);
      eruda.show();
      setReady(true);
    })();

    return () => {
      window.eruda?.destroy();
      mount.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`${styles.devTools} ${ready ? styles.devToolsReady : ""}`}
    />
  );
}
