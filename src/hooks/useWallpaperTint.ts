import { useEffect, useState } from "react";

export interface WallpaperTint {
  r: number;
  g: number;
  b: number;
}

/**
 * macOS Tahoe "Tinted" widget style samples the wallpaper and tints widget
 * surfaces with its dominant color. Loads the image, downsamples it to a
 * 16×16 canvas and averages the pixels. Client-only — returns null until
 * (and unless) the image can be decoded.
 */
export default function useWallpaperTint(src: string | undefined) {
  const [tint, setTint] = useState<WallpaperTint | null>(null);

  useEffect(() => {
    if (!src || typeof window === "undefined") return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 16;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        const n = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        if (!cancelled) {
          setTint({ r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) });
        }
      } catch {
        /* cross-origin or decode failure — fall back to default glass */
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return tint;
}
