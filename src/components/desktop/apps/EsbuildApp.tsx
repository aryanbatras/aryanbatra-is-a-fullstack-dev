"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, FileCode2, Download } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Esbuild WASM — the fast JavaScript bundler running client-side.
 * Bundles, minifies, and transpiles modern JS/TS in milliseconds.
 * CDN: esbuild-wasm@0.28.1 via jsDelivr
 */

type EsbuildInstance = {
  initialize: (options: Record<string, unknown>) => Promise<void>;
  build: (options: Record<string, unknown>) => Promise<{ outputFiles: Array<{ path: string; text: string }> }>;
  transform: (input: string, options?: Record<string, unknown>) => Promise<{ code: string }>;
};

declare global {
  interface Window {
    esbuild?: EsbuildInstance;
  }
}

const DEMO_FILES: Record<string, string> = {
  "main.ts": `import { greet } from "./greet";
import { add } from "./math";

console.log(greet("Aryan OS"));
console.log("2 + 3 =", add(2, 3));

// TypeScript features
interface User {
  name: string;
  role: "admin" | "engineer";
}

const user: User = { name: "Aryan", role: "engineer" };
console.log(\`User: \${user.name} (\${user.role})\`);`,
  "greet.ts": `export function greet(name: string): string {
  return \`Hello from \${name}!\`;
}

export const VERSION = "1.0.0";`,
  "math.ts": `export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export const PI = 3.14159;`,
};

export default function EsbuildApp() {
  const [files, setFiles] = useState(DEMO_FILES);
  const [activeFile, setActiveFile] = useState("main.ts");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Loading esbuild…");
  const [bundleMode, setBundleMode] = useState<"bundle" | "transform">("bundle");
  const esbuildRef = useRef<EsbuildInstance | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // @ts-expect-error — URL import resolved at runtime by the browser
        const esbuild = await import("https://cdn.jsdelivr.net/npm/esbuild-wasm@0.28.1/+esm") as unknown as EsbuildInstance;
        if (!alive) return;
        await esbuild.initialize({
          wasmURL: "https://cdn.jsdelivr.net/npm/esbuild-wasm@0.28.1/esm/browser.wasm",
        });
        esbuildRef.current = esbuild;
        if (alive) setStatus("esbuild ready — write code and bundle");
      } catch {
        if (alive) setStatus("Failed to load esbuild");
      }
    };
    void load();
    return () => { alive = false; };
  }, []);

  const bundle = useCallback(async () => {
    if (!esbuildRef.current) return;
    setLoading(true);
    setError(null);
    setOutput("");
    const start = performance.now();
    try {
      if (bundleMode === "bundle") {
        const result = await esbuildRef.current.build({
          entryPoints: ["/" + activeFile],
          bundle: true,
          write: false,
          format: "esm",
          target: "es2020",
          define: { "process.env.NODE_ENV": '"production"' },
          plugins: [{
            name: "virtual-fs",
            setup(build: any) {
              build.onResolve({ filter: /^\// }, (args: { path: string }) => ({ path: args.path, namespace: "virtual" }));
              build.onLoad({ filter: /.*/, namespace: "virtual" }, (args: { path: string }) => {
                const content = files[args.path.slice(1)];
                if (content === undefined) throw new Error(`File not found: ${args.path}`);
                return { contents: content, loader: args.path.endsWith(".ts") ? "ts" : "tsx" };
              });
            },
          }],
        });
        const elapsed = Math.round(performance.now() - start);
        setOutput(`// Bundled in ${elapsed}ms (${result.outputFiles[0].text.length} bytes)\n\n${result.outputFiles[0].text}`);
      } else {
        const result = await esbuildRef.current.transform(files[activeFile] ?? "", {
          loader: activeFile.endsWith(".ts") ? "ts" : "tsx",
          target: "es2020",
          format: "esm",
        });
        const elapsed = Math.round(performance.now() - start);
        setOutput(`// Transformed in ${elapsed}ms\n\n${result.code}`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [files, activeFile, bundleMode]);

  const downloadBundle = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bundle.js";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.esbuild}>
      {/* File tabs */}
      <div className={styles.esbuildTabs}>
        {Object.keys(files).map((name) => (
          <button
            key={name}
            type="button"
            className={`${styles.esbuildTab} ${activeFile === name ? styles.esbuildTabActive : ""}`}
            onClick={() => setActiveFile(name)}
          >
            <FileCode2 size={12} /> {name}
          </button>
        ))}
      </div>

      <div className={styles.esbuildBody}>
        {/* Editor */}
        <div className={styles.esbuildEditor}>
          <div className={styles.esbuildToolbar}>
            <select
              className={styles.esbuildMode}
              value={bundleMode}
              onChange={(e) => setBundleMode(e.target.value as "bundle" | "transform")}
            >
              <option value="bundle">Bundle</option>
              <option value="transform">Transform</option>
            </select>
            <button
              type="button"
              className={styles.pgliteRunBtn}
              onClick={() => void bundle()}
              disabled={loading || !esbuildRef.current}
            >
              <Play size={12} /> {loading ? "Building…" : "Build"}
            </button>
            {output && (
              <button type="button" className={styles.esbuildDownload} onClick={downloadBundle}>
                <Download size={12} /> Download
              </button>
            )}
            <span className={styles.esbuildStatus}>{status}</span>
          </div>
          <textarea
            className={styles.esbuildCode}
            value={files[activeFile] ?? ""}
            onChange={(e) => setFiles((f) => ({ ...f, [activeFile]: e.target.value }))}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className={styles.esbuildOutput}>
          <div className={styles.esbuildOutputHeader}>Output</div>
          {error ? (
            <pre className={styles.esbuildError}>{error}</pre>
          ) : output ? (
            <pre className={styles.esbuildCode}>{output}</pre>
          ) : (
            <div className={styles.pgliteEmpty}>Click "Build" to bundle your code</div>
          )}
        </div>
      </div>
    </div>
  );
}
