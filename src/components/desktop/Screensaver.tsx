import { useEffect, useRef, useState } from "react";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

export type ScreensaverStyle = "flurry" | "aerial" | "clock";

interface ScreensaverProps {
  style?: ScreensaverStyle;
  onDismiss: () => void;
}

/** "Aerial" style — slow drone-style pans across the Tahoe beach wallpapers. */
const AERIAL_FRAMES = [
  "/aryan/wallpapers/tahoe-beach-Day.jpg",
  "/aryan/wallpapers/tahoe-beach-Dusk.jpg",
  "/aryan/wallpapers/tahoe-beach-Night.jpg",
];

/** Flurry: drifting glowing orbs on a dark canvas (macOS classic). */
function Flurry() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#080a12";
      ctx.fillRect(0, 0, w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    interface Orb {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      hue: number;
    }
    const orbs: Orb[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 8 + Math.random() * 34,
      hue: 190 + Math.random() * 140,
    }));
    const cx = w / 2;
    const cy = h / 2;

    const tick = () => {
      ctx.fillStyle = "rgba(8, 10, 18, 0.16)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of orbs) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx += (cx - p.x) * 0.00002;
        p.vy += (cy - p.y) * 0.00002;
        if (p.x < -80) p.x = w + 80;
        if (p.x > w + 80) p.x = -80;
        if (p.y < -80) p.y = h + 80;
        if (p.y > h + 80) p.y = -80;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `hsla(${p.hue}, 90%, 66%, 0.5)`);
        g.addColorStop(1, `hsla(${p.hue}, 90%, 55%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.screenSaver} />;
}

/** Aerial: slow Ken Burns crossfade between the beach wallpapers. */
function Aerial() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % AERIAL_FRAMES.length);
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={styles.saverAerial} aria-hidden>
      {AERIAL_FRAMES.map((src, i) => (
        <div
          key={src}
          className={`${styles.saverAerialFrame} ${
            i === frame ? styles.saverAerialFrameActive : ""
          }`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      <div className={styles.saverAerialVignette} />
    </div>
  );
}

/** Clock: a huge thin-numeral clock on black (macOS Clock screensaver). */
function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const date = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.saverClock}>
      <div className={styles.saverClockTime}>{time}</div>
      <div className={styles.saverClockDate}>{date}</div>
    </div>
  );
}

export default function Screensaver({
  style = "flurry",
  onDismiss,
}: ScreensaverProps) {
  useEffect(() => {
    const dismiss = () => onDismiss();
    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", dismiss);
    return () => {
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
  }, [onDismiss]);

  if (style === "aerial") return <Aerial />;
  if (style === "clock") return <Clock />;
  return <Flurry />;
}
