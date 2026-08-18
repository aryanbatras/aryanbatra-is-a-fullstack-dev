"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Upload, Download, Scissors, Music } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * FFmpeg WASM — video/audio processing in the browser.
 * Convert formats, trim, extract audio, compress — all client-side.
 * CDN: @ffmpeg/ffmpeg@0.12.10 via jsDelivr
 */

type FFmpegInstance = {
  load: () => Promise<void>;
  run: (...args: string[]) => Promise<{ exitCode: number; stderr: string }>;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array>;
  on: (event: string, cb: (data: any) => void) => void;
};

declare global {
  interface Window {
    FFmpeg?: {
      createFFmpeg: (options?: Record<string, unknown>) => FFmpegInstance;
    };
  }
}

const PRESETS = [
  { id: "info", name: "Get Media Info", icon: "📊", args: (f: string) => ["-i", f], description: "Show file metadata and streams" },
  { id: "mp4", name: "Convert to MP4", icon: "🎬", args: (f: string) => ["-i", f, "-c:v", "libx264", "-strict", "experimental", "output.mp4"], description: "H.264 video conversion" },
  { id: "webm", name: "Convert to WebM", icon: "🌐", args: (f: string) => ["-i", f, "-c:v", "libvpx", "-b:v", "1M", "output.webm"], description: "WebM video conversion" },
  { id: "mp3", name: "Extract Audio (MP3)", icon: "🎵", args: (f: string) => ["-i", f, "-vn", "-ab", "192k", "output.mp3"], description: "Extract audio track as MP3" },
  { id: "gif", name: "Convert to GIF", icon: "🖼️", args: (f: string) => ["-i", f, "-vf", "fps=10,scale=320:-1", "output.gif"], description: "Animated GIF from video" },
  { id: "trim", name: "Trim (10s–20s)", icon: "✂️", args: (f: string) => ["-i", f, "-ss", "10", "-to", "20", "-c", "copy", "output_trimmed.mp4"], description: "Extract 10 second clip" },
  { id: "compress", name: "Compress Video", icon: "📦", args: (f: string) => ["-i", f, "-c:v", "libx264", "-crf", "28", "output_compressed.mp4"], description: "Reduce file size" },
  { id: "thumbnail", name: "Extract Thumbnail", icon: "📸", args: (f: string) => ["-i", f, "-ss", "00:00:01", "-vframes", "1", "output.png"], description: "First frame as PNG" },
];

export default function FFmpegApp() {
  const [status, setStatus] = useState("Click to load FFmpeg (~30MB first time)");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputName, setOutputName] = useState("output");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const ffmpegRef = useRef<FFmpegInstance | null>(null);

  const loadFFmpeg = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    setStatus("Loading FFmpeg WASM (~30MB, cached after first load)…");

    try {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js";
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load FFmpeg"));
        document.head.appendChild(script);
      });

      if (!window.FFmpeg) throw new Error("FFmpeg not available");

      const ffmpeg = window.FFmpeg.createFFmpeg({
        log: true,
        progress: (p: { progress: number }) => setProgress(Math.round(p.progress * 100)),
      });

      ffmpeg.on("log", (event: any) => {
        console.log("[FFmpeg]", event.message);
      });

      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
      setLoaded(true);
      setStatus("FFmpeg ready — drop a media file to process");
    } catch (e) {
      setError((e as Error).message);
      setStatus("Failed to load FFmpeg");
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const handleFile = async (f: File) => {
    setFile({ name: f.name, size: f.size });
    setOutput(null);
    setOutputBlob(null);
    setError(null);
    setStatus(`Loaded: ${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB) — pick a preset`);

    if (!loaded) await loadFFmpeg();
  };

  const runPreset = useCallback(async (presetId: string) => {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg || !file) return;

    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setProcessing(true);
    setError(null);
    setOutput(null);
    setOutputBlob(null);
    setProgress(0);
    setStatus(`Running: ${preset.name}…`);

    try {
      const inputData = await fetch(`/aryan/placeholder`).catch(() => null);
      // Read file from the input
      const fileInput = document.querySelector<HTMLInputElement>("#ffmpeg-input");
      const selectedFile = fileInput?.files?.[0];
      if (!selectedFile) throw new Error("No file selected");

      const arrayBuffer = await selectedFile.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      await ffmpeg.writeFile(file.name, data);

      const args = preset.args(file.name);
      const result = await ffmpeg.run(...args);

      if (result.exitCode !== 0) {
        throw new Error(result.stderr || "FFmpeg failed");
      }

      // Try to read output file
      const outputFileName = args[args.length - 1];
      try {
        const outputData = await ffmpeg.readFile(outputFileName);
        const blob = new Blob([new Uint8Array(outputData as unknown as ArrayBuffer)], { type: "application/octet-stream" });
        setOutputBlob(blob);
        setOutputName(outputFileName);
        setStatus(`${preset.name} complete — ${outputFileName} ready to download`);
      } catch {
        // For info command, output is in stderr
        setStatus(`${preset.name} complete`);
      }
    } catch (e) {
      setError((e as Error).message);
      setStatus("Processing failed");
    } finally {
      setProcessing(false);
    }
  }, [file, loaded]);

  const downloadOutput = () => {
    if (!outputBlob) return;
    const url = URL.createObjectURL(outputBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outputName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className={styles.ffmpeg}>
      {/* Sidebar: presets */}
      <div className={styles.pgliteSidebar}>
        <div className={styles.pgliteSection}>
          <Film size={12} /> Presets
        </div>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={styles.pgliteQueryBtn}
            onClick={() => void runPreset(p.id)}
            disabled={!loaded || !file || processing}
            title={p.description}
          >
            {p.icon} {p.name}
          </button>
        ))}
      </div>

      {/* Main */}
      <div className={styles.pgliteMain}>
        {/* Toolbar */}
        <div className={styles.pgliteToolbar}>
          {!loaded ? (
            <button
              type="button"
              className={styles.pgliteRunBtn}
              onClick={() => void loadFFmpeg()}
              disabled={loading}
            >
              <Film size={12} /> {loading ? "Loading…" : "Load FFmpeg"}
            </button>
          ) : (
            <button
              type="button"
              className={styles.pgliteRunBtn}
              onClick={() => document.getElementById("ffmpeg-input")?.click()}
              disabled={processing}
            >
              <Upload size={12} /> Open File
            </button>
          )}
          {outputBlob && (
            <button type="button" className={styles.esbuildDownload} onClick={downloadOutput}>
              <Download size={12} /> Download {outputName}
            </button>
          )}
          <span className={styles.pgliteStatus}>{status}</span>
        </div>

        <input
          id="ffmpeg-input"
          type="file"
          accept="video/*,audio/*,.mp4,.webm,.avi,.mov,.mkv,.mp3,.wav,.ogg,.flac"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />

        {/* Drop zone or file info */}
        <div
          className={`${styles.ffmpegDrop} ${dragOver ? styles.ffmpegDropActive : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className={styles.ffmpegFileInfo}>
              <Film size={24} />
              <div>
                <strong>{file.name}</strong>
                <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              </div>
            </div>
          ) : (
            <div className={styles.ffmpegDropContent}>
              <Film size={30} />
              <p>Drop a media file here or click "Open File"</p>
              <p className={styles.emuDropSub}>MP4, WebM, AVI, MOV, MP3, WAV — processed entirely in your browser</p>
            </div>
          )}
        </div>

        {/* Progress */}
        {processing && (
          <div className={styles.ffmpegProgress}>
            <div className={styles.ffmpegProgressBar}>
              <div className={styles.ffmpegProgressFill} style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}%</span>
          </div>
        )}

        {/* Output */}
        <div className={styles.pgliteResults}>
          {error && <div className={styles.pgliteError}>{error}</div>}
          {output && <pre className={styles.esbuildCode}>{output}</pre>}
          {!error && !output && !processing && (
            <div className={styles.pgliteEmpty}>
              {loaded
                ? "Select a preset to process your media file"
                : "Load FFmpeg first, then drop a media file"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
