"use client";

import { useCallback, useRef, useState } from "react";
import { Brain, Sparkles, Loader2 } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * AI Lab — Transformers.js (Hugging Face) running client-side.
 * Text classification, summarization, sentiment analysis — all in the browser.
 * CDN: @huggingface/transformers@3.5.2 via jsDelivr
 */

type Pipeline = {
  (input: string, options?: Record<string, unknown>): Promise<unknown>;
};

declare global {
  interface Window {
    TransformersPipeline?: (task: string, model: string, options?: Record<string, unknown>) => Promise<Pipeline>;
  }
}

interface TaskDef {
  id: string;
  name: string;
  model: string;
  placeholder: string;
  description: string;
}

const TASKS: TaskDef[] = [
  {
    id: "sentiment",
    name: "Sentiment Analysis",
    model: "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
    placeholder: "Enter text to analyze sentiment…",
    description: "Classifies text as POSITIVE or NEGATIVE",
  },
  {
    id: "summarize",
    name: "Text Summarization",
    model: "Xenova/t5-small",
    placeholder: "Enter text to summarize…",
    description: "Generates a concise summary of long text",
  },
  {
    id: "ner",
    name: "Named Entity Recognition",
    model: "Xenova/bert-base-NER",
    placeholder: "Enter text to find entities…",
    description: "Extracts people, organizations, locations from text",
  },
];

const DEMO_TEXTS: Record<string, string> = {
  sentiment: `Aryan OS is an incredible achievement — a full macOS-style desktop running entirely in the browser with real WASM engines, game emulators, and a complete developer toolchain. The attention to detail is remarkable.`,
  summarize: `WebAssembly (WASM) is a binary instruction format for a stack-based virtual machine. WASM is designed as a portable compilation target for programming languages, enabling deployment on the web for client and server applications. It allows code to run at near-native speed across different platforms. The technology has grown rapidly since its initial release in 2017, with major browsers and server-side runtimes supporting it. Companies like Figma, Google Earth, and AutoCAD have adopted WASM to bring complex desktop applications to the web.`,
  ner: `Aryan Batra founded 100xsystems in February 2026, building an open EdTech ecosystem focused on deep systems engineering. The company is based in Jammu & Kashmir, India, and has partnered with institutions like IIT Bombay and organizations across Sweden.`,
};

export default function AILabApp() {
  const [task, setTask] = useState<TaskDef>(TASKS[0]);
  const [input, setInput] = useState(DEMO_TEXTS.sentiment);
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Click a task to load the model");
  const pipelineRef = useRef<Pipeline | null>(null);
  const loadedModelRef = useRef<string>("");

  const loadModel = useCallback(async (taskId: string) => {
    const taskDef = TASKS.find((t) => t.id === taskId);
    if (!taskDef) return;

    setModelLoading(true);
    setStatus(`Loading ${taskDef.name} model…`);
    setError(null);
    setOutput(null);

    try {
      // Load Transformers.js from CDN
      if (!window.TransformersPipeline) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2";
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Transformers.js"));
          document.head.appendChild(script);
        });
      }

      if (!window.TransformersPipeline) {
        throw new Error("Transformers.js not available");
      }

      pipelineRef.current = await window.TransformersPipeline(taskId === "sentiment" ? "text-classification" : taskId, taskDef.model, {
        progress_callback: (progress: { status?: string }) => {
          if (progress.status === "downloading") setStatus("Downloading model…");
          if (progress.status === "loading") setStatus("Loading model into memory…");
        },
      });
      loadedModelRef.current = taskId;
      setStatus(`${taskDef.name} ready — enter text and click Analyze`);
    } catch (e) {
      setError((e as Error).message);
      setStatus("Model load failed");
    } finally {
      setModelLoading(false);
    }
  }, []);

  const analyze = useCallback(async () => {
    if (!pipelineRef.current || !input.trim()) return;
    setLoading(true);
    setError(null);
    setOutput(null);
    const start = performance.now();
    try {
      const result = await pipelineRef.current(input);
      const elapsed = Math.round(performance.now() - start);
      let formatted: string;

      if (task.id === "sentiment") {
        const r = result as Array<{ label: string; score: number }>;
        formatted = r.map((x) => `${x.label}: ${(x.score * 100).toFixed(1)}%`).join("\n");
      } else if (task.id === "summarize") {
        const r = result as Array<{ summary_text: string }>;
        formatted = r[0]?.summary_text ?? JSON.stringify(result);
      } else {
        formatted = JSON.stringify(result, null, 2);
      }

      setOutput(`${formatted}\n\n— ${elapsed}ms`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [input, task]);

  const selectTask = (t: TaskDef) => {
    setTask(t);
    setInput(DEMO_TEXTS[t.id] ?? "");
    setOutput(null);
    if (loadedModelRef.current !== t.id) {
      void loadModel(t.id);
    }
  };

  return (
    <div className={styles.aiLab}>
      {/* Task selector */}
      <div className={styles.aiLabSidebar}>
        <div className={styles.pgliteSection}>
          <Brain size={12} /> Models
        </div>
        {TASKS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.aiLabTaskBtn} ${task.id === t.id ? styles.aiLabTaskActive : ""}`}
            onClick={() => selectTask(t)}
          >
            <span className={styles.aiLabTaskName}>{t.name}</span>
            <span className={styles.aiLabTaskDesc}>{t.description}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <div className={styles.aiLabMain}>
        <div className={styles.aiLabHeader}>
          <Sparkles size={14} />
          <span>{task.name}</span>
          <span className={styles.aiLabModel}>{task.model.split("/").pop()}</span>
        </div>

        {/* Input */}
        <textarea
          className={styles.aiLabInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={task.placeholder}
          spellCheck={false}
        />

        {/* Run */}
        <div className={styles.aiLabActions}>
          <button
            type="button"
            className={styles.pgliteRunBtn}
            onClick={() => void analyze()}
            disabled={loading || modelLoading || !pipelineRef.current}
          >
            {loading ? <Loader2 size={12} className={styles.gameSpin} /> : <Sparkles size={12} />}
            {loading ? "Analyzing…" : modelLoading ? "Loading model…" : "Analyze"}
          </button>
          <span className={styles.pgliteStatus}>{status}</span>
        </div>

        {/* Output */}
        <div className={styles.aiLabOutput}>
          {error && <div className={styles.pgliteError}>{error}</div>}
          {output ? (
            <pre className={styles.aiLabResult}>{output}</pre>
          ) : !error ? (
            <div className={styles.pgliteEmpty}>
              {modelLoading ? "Downloading model from Hugging Face (first run only)…" : "Select a model and click Analyze"}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
