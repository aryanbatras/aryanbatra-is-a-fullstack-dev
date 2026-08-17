import { useEffect, useRef, useState } from "react";
import { readFiles, saveFileContent } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Vim — the real vim.js (Lu Wang's vim ported to Emscripten), the exact
 * binary daedalOS ships. Boots the WASM-less ASM build in the window, loads
 * the file named by `file` from Finder (or starts an empty buffer), and saves
 * writes back to the Finder file system.
 */

declare global {
  interface Window {
    VimWrapperModule?: {
      init?: (config: VimInitConfig) => void;
      VimModule?: {
        FS_createPath?: (parent: string, path: string, isDir: boolean, canRead?: boolean) => void;
        FS_createDataFile?: (
          parent: string,
          name: string,
          data: Uint8Array | number[],
          canRead: boolean,
          canWrite: boolean,
        ) => void;
        exit?: () => void;
        FS?: unknown;
      };
    };
  }
}

interface VimInitConfig {
  VIMJS_ALLOW_EXIT: boolean;
  arguments: string[];
  containerWindow?: HTMLElement | null;
  memoryInitializerPrefixURL: string;
  preRun?: Array<() => void>;
  postRun?: Array<() => void>;
  print?: (msg: string) => void;
  printErr?: (msg: string) => void;
  quitCallback?: () => void;
  writeCallback?: (data: Uint8Array) => void;
}

interface VimAppProps {
  /** File name in the Finder docs folder (e.g. "notes.txt"). */
  file?: string;
  /** Optional initial content for a new file. */
  content?: string;
}

export default function VimApp({ file, content }: VimAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState("Loading Vim…");

  // Resolve the file's current content from the Finder file system by name
  // (the window only carries the file name — same as TextEdit/Webamp).
  const initialContent =
    content ??
    (file ? readFiles().find((f) => f.name === file)?.content : undefined);

  // Script tag for vim.js — load once per app open.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Canvas vim.js renders into — must be present before init runs.
    const canvas = document.createElement("canvas");
    canvas.id = "vimjs-canvas";
    canvas.className = styles.vimCanvas;
    container.appendChild(canvas);

    const script = document.createElement("script");
    script.src = "/aryan/apps/vim/vim.js";
    script.onload = () => setLoaded(true);
    script.onerror = () => setStatus("Failed to load Vim.js");
    container.appendChild(script);

    return () => {
      try {
        window.VimWrapperModule?.VimModule?.exit?.();
      } catch {
        /* module already gone */
      }
      script.remove();
      canvas.remove();
    };
  }, []);

  // Boot vim once the script is loaded.
  useEffect(() => {
    if (!loaded) return;
    const container = containerRef.current;
    if (!container) return;

    const fileName = file ?? "untitled.txt";
    const data = new TextEncoder().encode(initialContent ?? "");

    window.VimWrapperModule?.init?.({
      VIMJS_ALLOW_EXIT: true,
      arguments: [`/root/${fileName}`],
      // The window itself — vim.js uses it only to filter event targets.
      containerWindow:
        (container.closest('[role="dialog"]') as HTMLElement | null) ?? container,
      memoryInitializerPrefixURL: "/aryan/apps/vim/",
      preRun: [
        () => {
          const mod = window.VimWrapperModule?.VimModule;
          if (!mod) return;
          mod.FS_createPath?.("/", "root", true, true);
          if (data.length > 0 || content !== undefined) {
            try {
              mod.FS_createDataFile?.("/root", fileName, data, true, true);
            } catch {
              /* file already exists */
            }
          }
        },
      ],
      postRun: [() => setStatus("")],
      print: () => undefined,
      printErr: () => undefined,
      quitCallback: () => setStatus(""),
      // When vim saves (:w), persist back to the Finder file system.
      writeCallback: (data: Uint8Array) => {
        const text = new TextDecoder().decode(data);
        if (file) saveFileContent(file, text);
        setStatus(`Saved ${fileName}`);
        window.setTimeout(() => setStatus(""), 1600);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, file, initialContent]);

  return (
    <div className={styles.vimWrap}>
      <div ref={containerRef} className={styles.vimContainer} />
      {status && <div className={styles.vimStatus}>{status}</div>}
    </div>
  );
}
