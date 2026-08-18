"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Upload, Download, RotateCw, Maximize2, Minimize2, Palette } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Image Lab — client-side image processing using Canvas API.
 * Resize, rotate, apply filters, convert formats — all in the browser.
 */

interface ImageInfo {
  name: string;
  width: number;
  height: number;
  type: string;
  size: number;
}

const FILTERS = [
  { id: "none", name: "None", css: "none" },
  { id: "grayscale", name: "Grayscale", css: "grayscale(100%)" },
  { id: "sepia", name: "Sepia", css: "sepia(100%)" },
  { id: "blur", name: "Blur", css: "blur(3px)" },
  { id: "brightness", name: "Bright", css: "brightness(1.5)" },
  { id: "contrast", name: "Contrast", css: "contrast(1.5)" },
  { id: "saturate", name: "Saturate", css: "saturate(2)" },
  { id: "hue-rotate", name: "Hue Rotate", css: "hue-rotate(90deg)" },
  { id: "invert", name: "Invert", css: "invert(100%)" },
] as const;

const RESIZE_PRESETS = [
  { label: "50%", scale: 0.5 },
  { label: "75%", scale: 0.75 },
  { label: "150%", scale: 1.5 },
  { label: "200%", scale: 2 },
  { label: "640×480", width: 640, height: 480 },
  { label: "1280×720", width: 1280, height: 720 },
  { label: "1920×1080", width: 1920, height: 1080 },
];

const EXPORT_FORMATS = [
  { id: "png", mime: "image/png", ext: "png" },
  { id: "jpeg", mime: "image/jpeg", ext: "jpg" },
  { id: "webp", mime: "image/webp", ext: "webp" },
];

export default function ImageLabApp() {
  const [image, setImage] = useState<ImageInfo | null>(null);
  const [filter, setFilter] = useState("none");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [exportFormat, setExportFormat] = useState("png");
  const [status, setStatus] = useState("Drop an image or click Open");
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        setImage({
          name: file.name,
          width: img.width,
          height: img.height,
          type: file.type,
          size: file.size,
        });
        setFilter("none");
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setStatus(`${file.name} — ${img.width}×${img.height}`);
        renderImage(img, "none", 0, false, false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const renderImage = useCallback((
    img: HTMLImageElement,
    currentFilter: string,
    currentRotation: number,
    currentFlipH: boolean,
    currentFlipV: boolean,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const radians = (currentRotation * Math.PI) / 180;
    const isVertical = currentRotation % 180 !== 0;
    canvas.width = isVertical ? img.height : img.width;
    canvas.height = isVertical ? img.width : img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.scale(currentFlipH ? -1 : 1, currentFlipV ? -1 : 1);

    const filterCSS = FILTERS.find((f) => f.id === currentFilter)?.css ?? "none";
    ctx.filter = filterCSS;

    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }, []);

  useEffect(() => {
    if (originalImageRef.current) {
      renderImage(originalImageRef.current, filter, rotation, flipH, flipV);
    }
  }, [filter, rotation, flipH, flipV, renderImage]);

  const handleFile = (f: File) => {
    if (f.type.startsWith("image/")) loadImage(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const resize = (preset: typeof RESIZE_PRESETS[number]) => {
    if (!originalImageRef.current) return;
    const img = originalImageRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    let newW: number, newH: number;
    if ("scale" in preset) {
      newW = Math.round(img.width * preset.scale);
      newH = Math.round(img.height * preset.scale);
    } else {
      newW = preset.width;
      newH = preset.height;
    }

    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, newW, newH);
    setImage((prev) => prev ? { ...prev, width: newW, height: newH } : prev);
    setStatus(`Resized to ${newW}×${newH}`);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const fmt = EXPORT_FORMATS.find((f) => f.id === exportFormat) ?? EXPORT_FORMATS[0];
    const dataUrl = canvas.toDataURL(fmt.mime, 0.92);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${image.name.replace(/\.[^.]+$/, "")}_processed.${fmt.ext}`;
    a.click();
    setStatus(`Exported as ${fmt.ext.toUpperCase()}`);
  };

  return (
    <div className={styles.ffmpeg}>
      {/* Sidebar */}
      <div className={styles.pgliteSidebar}>
        <div className={styles.pgliteSection}>
          <Palette size={12} /> Filters
        </div>
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`${styles.pgliteQueryBtn} ${filter === f.id ? styles.pgliteQueryBtnActive : ""}`}
            onClick={() => setFilter(f.id)}
            disabled={!image}
          >
            {f.name}
          </button>
        ))}

        <div className={styles.pgliteSection} style={{ marginTop: 12 }}>
          <Maximize2 size={12} /> Resize
        </div>
        {RESIZE_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={styles.pgliteQueryBtn}
            onClick={() => resize(p)}
            disabled={!image}
          >
            {p.label}
          </button>
        ))}

        <div className={styles.pgliteSection} style={{ marginTop: 12 }}>
          <Image size={12} /> Export
        </div>
        <select
          className={styles.esbuildMode}
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value)}
          style={{ margin: "4px 8px" }}
        >
          {EXPORT_FORMATS.map((f) => (
            <option key={f.id} value={f.id}>{f.ext.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Main */}
      <div className={styles.pgliteMain}>
        <div className={styles.pgliteToolbar}>
          <button
            type="button"
            className={styles.pgliteRunBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={12} /> Open Image
          </button>
          <button
            type="button"
            className={styles.esbuildDownload}
            onClick={() => setRotation((r) => (r + 90) % 360)}
            disabled={!image}
          >
            <RotateCw size={12} /> Rotate 90°
          </button>
          <button
            type="button"
            className={styles.esbuildDownload}
            onClick={() => setFlipH((f) => !f)}
            disabled={!image}
          >
            ↔ Flip H
          </button>
          <button
            type="button"
            className={styles.esbuildDownload}
            onClick={() => setFlipV((f) => !f)}
            disabled={!image}
          >
            ↕ Flip V
          </button>
          {image && (
            <button type="button" className={styles.esbuildDownload} onClick={exportImage}>
              <Download size={12} /> Export
            </button>
          )}
          <span className={styles.pgliteStatus}>{status}</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
          style={{ background: image ? "repeating-conic-gradient(#2a2a4a 0% 25%, #1a1a2e 0% 50%) 50% / 20px 20px" : undefined }}
        >
          {image ? (
            <canvas
              ref={canvasRef}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <div className={styles.ffmpegDropContent}>
              <Image size={30} />
              <p>Drop an image here or click "Open Image"</p>
              <p className={styles.emuDropSub}>PNG, JPEG, WebP, GIF, SVG — processed entirely in your browser</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
