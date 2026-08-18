"use client";

import { useCallback, useRef, useState } from "react";
import { Play, RotateCcw, Copy, Download } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Code Playground — run JavaScript/TypeScript in the browser.
 * Like CodePen or JSFiddle, but fully client-side.
 */

const DEMO_CODE = `// 🎮 Aryan OS Code Playground
// Write JavaScript here and click Run!

console.log("👋 Hello from Aryan OS!");

// Array methods
const skills = ["React", "Next.js", "TypeScript", "Three.js", "GSAP"];
console.log("Skills:", skills.join(", "));

// Async/Await demo
async function fetchTime() {
  const response = await fetch("https://worldtimeapi.org/api/timezone/Asia/Kolkata");
  const data = await response.json();
  console.log("Current time in India:", data.datetime);
}

fetchTime();

// DOM manipulation
document.body.style.fontFamily = "monospace";

// Math
const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};
console.log("Fibonacci(10):", fibonacci(10));

// Classes
class Counter {
  #count = 0;
  increment() { return ++this.#count; }
  get value() { return this.#count; }
}

const counter = new Counter();
for (let i = 0; i < 5; i++) counter.increment();
console.log("Counter:", counter.value);

// Map/Set
const uniqueSkills = new Set(skills);
uniqueSkills.add("WASM");
console.log("Unique skills:", [...uniqueSkills].length);

// Destructuring
const [first, ...rest] = skills;
console.log("First:", first, "Rest:", rest);

// Template literals with expressions
const name = "Aryan";
console.log(\`Welcome to \${name} OS, \${name}!\`);

// Closures
function createCounter(initial = 0) {
  let count = initial;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}

const myCounter = createCounter(10);
myCounter.increment();
myCounter.increment();
console.log("Closure counter:", myCounter.getCount());

// Promises
Promise.resolve("Promise resolved!").then(console.log);

console.log("✅ All demos completed!");`;

export default function PlaygroundApp() {
  const [code, setCode] = useState(DEMO_CODE);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  const run = useCallback(() => {
    setRunning(true);
    setOutput([]);
    setError(null);

    // Capture console.log
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args) => {
      logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "));
      originalLog(...args);
    };
    console.error = (...args) => {
      logs.push("❌ " + args.map(String).join(" "));
      originalError(...args);
    };
    console.warn = (...args) => {
      logs.push("⚠️ " + args.map(String).join(" "));
      originalWarn(...args);
    };
    console.info = (...args) => {
      logs.push("ℹ️ " + args.map(String).join(" "));
      originalInfo(...args);
    };

    try {
      // Execute the code
      const result = new Function(code)();
      if (result !== undefined) {
        logs.push("→ " + (typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)));
      }
      setOutput(logs);
    } catch (e) {
      logs.push("❌ " + (e as Error).message);
      setOutput(logs);
      setError((e as Error).message);
    } finally {
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      setRunning(false);
    }
  }, [code]);

  const clear = () => {
    setOutput([]);
    setError(null);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "playground.js";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    }
    // Tab support
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      setCode((c) => c.substring(0, start) + "  " + c.substring(end));
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className={styles.playground}>
      {/* Editor */}
      <div className={styles.playgroundEditor}>
        <div className={styles.pgliteToolbar}>
          <button
            type="button"
            className={styles.pgliteRunBtn}
            onClick={run}
            disabled={running}
          >
            <Play size={12} /> {running ? "Running…" : "Run (⌘↵)"}
          </button>
          <button type="button" className={styles.esbuildDownload} onClick={clear}>
            <RotateCcw size={12} /> Clear
          </button>
          <button type="button" className={styles.esbuildDownload} onClick={copyCode}>
            <Copy size={12} /> Copy
          </button>
          <button type="button" className={styles.esbuildDownload} onClick={downloadCode}>
            <Download size={12} /> Download
          </button>
          <span className={styles.pgliteStatus}>JavaScript Playground</span>
        </div>
        <textarea
          className={styles.playgroundCode}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="Write JavaScript here…"
        />
      </div>

      {/* Output */}
      <div className={styles.playgroundOutput}>
        <div className={styles.playgroundOutputHeader}>
          Console Output
        </div>
        <div ref={outputRef} className={styles.playgroundOutputBody}>
          {output.length === 0 ? (
            <div className={styles.pgliteEmpty}>
              Click "Run" or press ⌘+Enter to execute your code
            </div>
          ) : (
            output.map((line, i) => (
              <div
                key={i}
                className={`${styles.playgroundLine} ${line.startsWith("❌") ? styles.playgroundError : ""} ${line.startsWith("⚠️") ? styles.playgroundWarn : ""}`}
              >
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
