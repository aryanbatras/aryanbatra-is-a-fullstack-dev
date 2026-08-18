"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music, Play, Pause, Upload, Volume2 } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Music Visualizer — real-time audio visualization using Web Audio API.
 * Load audio files and see frequency bars, waveforms, and circular visualizations.
 */

type VisualMode = "bars" | "waveform" | "circular";

export default function MusicVisualizerApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number>(0);

  const [file, setFile] = useState<{ name: string; url: string } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<VisualMode>("bars");
  const [status, setStatus] = useState("Drop an audio file or click Open");
  const [dragOver, setDragOver] = useState(false);
  const [volume, setVolume] = useState(0.8);

  const setupAudio = useCallback(async (url: string) => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    const ctx = contextRef.current;

    if (audioRef.current) {
      audioRef.current.pause();
      if (sourceRef.current) sourceRef.current.disconnect();
    }

    const audio = new Audio(url);
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    sourceRef.current = source;

    audio.volume = volume;
    return audio;
  }, [volume]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    ctx.fillStyle = "#0d0d1a";
    ctx.fillRect(0, 0, width, height);

    if (mode === "bars") {
      analyser.getByteFrequencyData(dataArray);
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.8;
        const hue = (i / bufferLength) * 360;
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    } else if (mode === "waveform") {
      analyser.getByteTimeDomainData(dataArray);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#3b82f6";
      ctx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    } else if (mode === "circular") {
      analyser.getByteFrequencyData(dataArray);
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.3;

      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * Math.PI * 2;
        const amplitude = dataArray[i] / 255;
        const r = radius + amplitude * radius * 0.8;
        const hue = (i / bufferLength) * 360;
        ctx.beginPath();
        ctx.arc(cx, cy, r, angle, angle + (Math.PI * 2) / bufferLength);
        ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    frameRef.current = requestAnimationFrame(draw);
  }, [mode]);

  useEffect(() => {
    if (playing) {
      frameRef.current = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing, draw]);

  const handleFile = async (f: File) => {
    if (!f.type.startsWith("audio/")) {
      setStatus("Please select an audio file");
      return;
    }
    const url = URL.createObjectURL(f);
    setFile({ name: f.name, url });
    setPlaying(false);
    setStatus(`Loaded: ${f.name} — click Play`);

    const audio = await setupAudio(url);
    audio.addEventListener("ended", () => setPlaying(false));
  };

  const togglePlay = async () => {
    if (!file) return;
    if (!audioRef.current) {
      const audio = await setupAudio(file.url);
      audio.addEventListener("ended", () => setPlaying(false));
    }

    if (playing) {
      audioRef.current?.pause();
    } else {
      if (contextRef.current?.state === "suspended") {
        await contextRef.current.resume();
      }
      audioRef.current?.play();
    }
    setPlaying(!playing);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const changeVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return (
    <div className={styles.ffmpeg}>
      {/* Sidebar */}
      <div className={styles.pgliteSidebar}>
        <div className={styles.pgliteSection}>
          <Music size={12} /> Visual Mode
        </div>
        {(["bars", "waveform", "circular"] as VisualMode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`${styles.pgliteQueryBtn} ${mode === m ? styles.pgliteQueryBtnActive : ""}`}
            onClick={() => setMode(m)}
          >
            {m === "bars" ? "📊 Frequency Bars" : m === "waveform" ? "🌊 Waveform" : "🔵 Circular"}
          </button>
        ))}

        <div className={styles.pgliteSection} style={{ marginTop: 12 }}>
          <Volume2 size={12} /> Volume
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => changeVolume(Number(e.target.value))}
          style={{ width: "100%", margin: "8px" }}
        />

        {file && (
          <>
            <div className={styles.pgliteSection} style={{ marginTop: 12 }}>
              🎵 Now Playing
            </div>
            <div style={{ padding: "4px 8px", fontSize: 12, color: "#c0c0e0", wordBreak: "break-all" }}>
              {file.name}
            </div>
          </>
        )}
      </div>

      {/* Main */}
      <div className={styles.pgliteMain}>
        <div className={styles.pgliteToolbar}>
          <button
            type="button"
            className={styles.pgliteRunBtn}
            onClick={() => document.getElementById("audio-input")?.click()}
          >
            <Upload size={12} /> Open Audio
          </button>
          {file && (
            <button
              type="button"
              className={styles.pgliteRunBtn}
              onClick={() => void togglePlay()}
            >
              {playing ? <Pause size={12} /> : <Play size={12} />}
              {playing ? "Pause" : "Play"}
            </button>
          )}
          <span className={styles.pgliteStatus}>{status}</span>
        </div>

        <input
          id="audio-input"
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />

        {/* Canvas */}
        <div
          className={`${styles.ffmpegDrop} ${dragOver ? styles.ffmpegDropActive : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{ background: "#0d0d1a", border: "none", margin: 0, borderRadius: 0 }}
        >
          {file ? (
            <canvas
              ref={canvasRef}
              width={800}
              height={400}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <div className={styles.ffmpegDropContent}>
              <Music size={30} />
              <p>Drop an audio file here or click "Open Audio"</p>
              <p className={styles.emuDropSub}>MP3, WAV, OGG, FLAC — visualized entirely in your browser</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
