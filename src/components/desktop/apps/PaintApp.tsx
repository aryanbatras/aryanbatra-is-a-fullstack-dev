"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/desktop/apps.module.css";

const TOOLS = [
  { id: "brush", label: "Brush", icon: "🖌" },
  { id: "eraser", label: "Eraser", icon: "🧽" },
  { id: "line", label: "Line", icon: "╱" },
  { id: "rect", label: "Rectangle", icon: "▭" },
  { id: "ellipse", label: "Ellipse", icon: "⬭" },
  { id: "fill", label: "Fill", icon: "🪣" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

const COLORS = [
  "#000000", "#7c7c7c", "#a0a0a0", "#ffffff",
  "#ff3b30", "#ff9500", "#ffcc00", "#34c759",
  "#00c7be", "#30b0c7", "#32ade6", "#007aff",
  "#5856d6", "#af52de", "#ff2d55", "#ff647f",
];

/** Paint — a little canvas editor: brush, eraser, shapes, fill, undo, save. */
export default function PaintApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<ToolId>("brush");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [drawing, setDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const snapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setUndoStack((s) => [...s.slice(-24), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const pos = getPos(e);
    snapshot();
    setDrawing(true);
    startRef.current = pos;
    lastRef.current = pos;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.fillStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "brush" || tool === "eraser") {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    if (tool === "brush" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(lastRef.current!.x, lastRef.current!.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === "line") {
      redrawPreview((ctx2) => {
        const s = startRef.current!;
        ctx2.beginPath();
        ctx2.moveTo(s.x, s.y);
        ctx2.lineTo(pos.x, pos.y);
        ctx2.stroke();
      });
    } else if (tool === "rect") {
      redrawPreview((ctx2) => {
        const s = startRef.current!;
        ctx2.strokeRect(s.x, s.y, pos.x - s.x, pos.y - s.y);
      });
    } else if (tool === "ellipse") {
      redrawPreview((ctx2) => {
        const s = startRef.current!;
        ctx2.beginPath();
        ctx2.ellipse(s.x, s.y, Math.abs(pos.x - s.x), Math.abs(pos.y - s.y), 0, 0, Math.PI * 2);
        ctx2.stroke();
      });
    }
    lastRef.current = pos;
  };

  const redrawPreview = (draw: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const saved = undoStack[undoStack.length - 1];
    if (saved) ctx.putImageData(saved, 0, 0);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.fillStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = size;
    draw(ctx);
  };

  const onUp = () => {
    setDrawing(false);
    startRef.current = null;
    lastRef.current = null;
  };

  const onFill = (e: React.PointerEvent) => {
    if (tool !== "fill") return;
    const pos = getPos(e);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    snapshot();
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const w = canvas.width;
    const h = canvas.height;
    const px = Math.floor(pos.x);
    const py = Math.floor(pos.y);
    if (px < 0 || py < 0 || px >= w || py >= h) return;
    const target = (py * w + px) * 4;
    const tR = data[target];
    const tG = data[target + 1];
    const tB = data[target + 2];
    const tA = data[target + 3];
    const match = (i: number) =>
      data[i] === tR && data[i + 1] === tG && data[i + 2] === tB && data[i + 3] === tA;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const stack = [px, py];
    const seen = new Uint8Array(w * h);
    while (stack.length) {
      const y = stack.pop()!;
      const x = stack.pop()!;
      const i = (y * w + x) * 4;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      if (seen[y * w + x] || !match(i)) continue;
      seen[y * w + x] = 1;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }
    ctx.putImageData(img, 0, 0);
  };

  const undo = () => {
    setUndoStack((s) => {
      if (!s.length) return s;
      const next = s.slice(0, -1);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d")!;
        const last = next[next.length - 1];
        if (last) ctx.putImageData(last, 0, 0);
        else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      return next;
    });
  };

  const clear = () => {
    snapshot();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "artwork.png";
    a.click();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className={styles.paint} data-game="paint">
      <div className={styles.paintToolbar}>
        <div className={styles.paintTools}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.paintTool} ${tool === t.id ? styles.paintToolActive : ""}`}
              onClick={() => setTool(t.id)}
              title={t.label}
              aria-label={t.label}
            >
              <span aria-hidden>{t.icon}</span>
            </button>
          ))}
        </div>

        <div className={styles.paintColors}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.paintColor} ${color === c ? styles.paintColorActive : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>

        <input
          type="range"
          min={1}
          max={24}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className={styles.paintSize}
          aria-label="Brush size"
        />
        <span className={styles.paintSizeLabel}>{size}px</span>

        <div className={styles.paintActions}>
          <button type="button" className={styles.gameBtn} onClick={undo} disabled={!undoStack.length}>
            Undo
          </button>
          <button type="button" className={styles.gameBtn} onClick={clear}>
            Clear
          </button>
          <button type="button" className={styles.gameBtn} onClick={save}>
            Save PNG
          </button>
        </div>
      </div>

      <div className={styles.paintCanvasWrap}>
        <canvas
          ref={canvasRef}
          width={700}
          height={460}
          className={styles.paintCanvas}
          onPointerDown={(e) => {
            if (tool === "fill") onFill(e);
            else onDown(e);
          }}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          style={{ cursor: tool === "fill" ? "cell" : "crosshair", touchAction: "none" }}
        />
      </div>
    </div>
  );
}
