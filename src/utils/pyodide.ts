/**
 * Pyodide — a full Python 3 interpreter in the browser, served locally from
 * /aryan/apps/pyodide (ported from daedalOS). Loaded lazily on first use and
 * kept as a singleton so every `python` command shares one interpreter.
 */

type PyodideRuntime = {
  loadPackage: (name: string, options?: { checkIntegrity?: boolean }) => Promise<void>;
  runPythonAsync: (code: string) => Promise<string>;
  loadedPackages?: string[];
};

type PyodideError = Error & { message: string };

declare global {
  interface Window {
    loadPyodide?: (cfg: { indexURL: string }) => Promise<PyodideRuntime>;
    pyodide?: PyodideRuntime;
  }
}

import CDN from "@/constants/cdn";

let loading: Promise<PyodideRuntime> | null = null;

const PYODIDE_URL = `${CDN.PYODIDE.indexURL}pyodide.js`;

const loadScript = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing && existing.dataset.loaded === "1") {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.dataset.loaded = "0";
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

/** Load pyodide.js once, then boot the interpreter (singleton). */
export const getPyodide = (): Promise<PyodideRuntime> => {
  if (window.pyodide) return Promise.resolve(window.pyodide);
  if (loading) return loading;
  loading = (async () => {
    await loadScript(PYODIDE_URL);
    if (!window.loadPyodide) throw new Error("Pyodide failed to load");
    window.pyodide = await window.loadPyodide({ indexURL: CDN.PYODIDE.indexURL });
    return window.pyodide;
  })();
  return loading;
};

/** Capture stdout, run the code, return the printed output (daedalOS pattern). */
export const runPython = async (
  code: string,
  printLn: (message: string) => void,
): Promise<void> => {
  try {
    const py = await getPyodide();
    const isVersion = code.trim() === "version" || code.trim() === "ver";

    if (code.includes("import micropip")) {
      await py.loadPackage("micropip", { checkIntegrity: false });
    }

    const captureStdOut =
      "import sys\r\nimport io\r\nsys.stdout = io.StringIO()\r\n";
    const versionCommand = "import sys\r\nsys.version\r\n";

    let result = await py.runPythonAsync(isVersion ? versionCommand : captureStdOut + code);
    if (!result) {
      result = await py.runPythonAsync("sys.stdout.getvalue()");
    }
    if (result) printLn(String(result).trimEnd());
  } catch (error) {
    const { message } = error as PyodideError;
    if (message) printLn(message);
  }
};
