"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { PHOTOS } from "@/constants/video";
import { readDroppedPhotos } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

export default function PhotosApp() {
  const [selected, setSelected] = useState<string | null>(null);
  const dropped = readDroppedPhotos();

  if (selected) {
    return <PhotoViewer src={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className={styles.photos}>
      <div className={styles.photosHeader}>
        <strong>Showreel Frames</strong>
        <span>
          {PHOTOS.length + dropped.length} photos
          {dropped.length > 0 && ` · ${dropped.length} imported`}
        </span>
      </div>
      {dropped.length > 0 && (
        <>
          <div className={styles.photosSection}>Imported from your device</div>
          <div className={styles.photoGrid}>
            {dropped.map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.photoTile}
                onClick={() => setSelected(p.dataUrl)}
              >
                <img src={p.dataUrl} alt={p.name} loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
      <div className={styles.photosSection}>Showreel Frames</div>
      <div className={styles.photoGrid}>
        {PHOTOS.map((src, i) => (
          <button key={src} type="button" className={styles.photoTile} onClick={() => setSelected(src)}>
            <img src={src} alt={`Showreel frame ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Full-screen frame viewer with wheel zoom, drag-to-pan and zoom controls. */
function PhotoViewer({ src, onBack }: { src: string; onBack: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const apply = (s: number, p: { x: number; y: number }) => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transform = `translate(${p.x}px, ${p.y}px) scale(${s})`;
  };

  useEffect(() => {
    const img = imgRef.current;
    if (img) img.style.transform = "translate(0px, 0px) scale(1)";
  }, [src]);

  const zoom = (delta: number, point?: { x: number; y: number }) => {
    setScale((prev) => {
      const next = Math.min(6, Math.max(1, prev * (delta > 0 ? 1.25 : 0.8)));
      let p = pan;
      if (point && stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const mx = point.x - rect.left;
        const my = point.y - rect.top;
        // keep the point under the cursor
        p = {
          x: mx - ((mx - pan.x) * next) / prev,
          y: my - ((my - pan.y) * next) / prev,
        };
        setPan(p);
      }
      apply(next, p);
      return next;
    });
  };

  const reset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    apply(1, { x: 0, y: 0 });
  };

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!stageRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      zoom(e.deltaY < 0 ? 1 : -1, { x: e.clientX, y: e.clientY });
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pan]);

  return (
    <div className={styles.photosViewer}>
      <div className={styles.photosTopbar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← Gallery
        </button>
        <span>Showreel frame · scroll to zoom · drag to pan</span>
        <div className={styles.photosZoomControls}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => zoom(-1)}
            aria-label="Zoom out"
            disabled={scale <= 1}
          >
            <Minus size={14} />
          </button>
          <span className={styles.photosZoomPct}>{Math.round(scale * 100)}%</span>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => zoom(1)}
            aria-label="Zoom in"
            disabled={scale >= 6}
          >
            <Plus size={14} />
          </button>
          <button type="button" className={styles.backBtn} onClick={reset} aria-label="Reset zoom">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
      <div
        ref={stageRef}
        className={styles.photosStage}
        style={{ cursor: scale > 1 ? "grab" : "default", overflow: "hidden" }}
        onPointerDown={(e) => {
          if (scale <= 1) return;
          dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragRef.current || scale <= 1) return;
          const dx = e.clientX - dragRef.current.x;
          const dy = e.clientY - dragRef.current.y;
          const p = { x: dragRef.current.px + dx, y: dragRef.current.py + dy };
          setPan(p);
          apply(scale, p);
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt="Showreel frame"
          draggable={false}
          className={styles.photosStageImg}
          style={{ transformOrigin: "0 0", willChange: "transform" }}
        />
      </div>
    </div>
  );
}
