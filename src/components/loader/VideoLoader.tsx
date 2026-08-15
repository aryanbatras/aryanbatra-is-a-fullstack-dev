import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import CountUp from "./CountUp";
import styles from "@/styles/components/loader/VideoLoader.module.css";

interface VideoLoaderProps {
  /** True once the film + smoother are ready to scrub. */
  ready: boolean;
}

/** The loader is compulsory for at least MIN_S and never holds longer than
    MAX_S, whatever happens to the network: */
const MIN_S = 2; // film ready early -> the counter still runs out to here
const MAX_S = 5; // film not ready yet -> reveal here regardless

/** StaggeredMenu underlays, exactly as the reference. They sit hidden
    behind the black counter sheet and only appear during the exit. */
const LAYER_COLORS = ["#B497CF", "#5227FF"];

export default function VideoLoader({ ready }: VideoLoaderProps) {
  const mountedAtRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [gone, setGone] = useState(false);

  /* Reveal when BOTH the minimum wait has passed AND the film is loaded —
     or, if the film never loads, at the hard cap so the loader can never
     block the page forever. */
  useEffect(() => {
    mountedAtRef.current ??= Date.now();
    if (revealed) return;
    const check = () => {
      const elapsed = (Date.now() - (mountedAtRef.current as number)) / 1000;
      if (elapsed >= MAX_S || (elapsed >= MIN_S && ready)) setRevealed(true);
    };
    check();
    const iv = window.setInterval(check, 100);
    return () => window.clearInterval(iv);
  }, [ready, revealed]);

  /* EXIT — once the counter ends, the curtain rises very slowly: the number
     dissolves upward, the black sheet glides away on a long power4.inOut,
     and the color sheets follow, staggered far apart so each layer trails
     beautifully into view on the way up. */
  useEffect(() => {
    if (!revealed) return;
    const layers = Array.from(
      (rootRef.current as HTMLElement).querySelectorAll(
        `[data-loader-layer]`,
      ),
    );
    const tl = gsap.timeline({ onComplete: () => setGone(true) });
    tl.to(
      counterRef.current,
      { yPercent: -120, opacity: 0, ease: "power2.inOut", duration: 1.3 },
      0,
    );
    tl.to(
      sheetRef.current,
      { yPercent: -100, duration: 1.8, ease: "power4.inOut" },
      0,
    );
    layers.forEach((el, i) => {
      tl.to(
        el,
        { yPercent: -100, duration: 1.8, ease: "power4.inOut" },
        (i + 1) * 0.18,
      );
    });
    return () => {
      tl.kill();
    };
  }, [revealed]);

  if (gone) return null;

  return (
    <div
      className={`${styles.overlay} loader-overlay`}
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-hidden={revealed}
    >
      <div className={styles.layers} aria-hidden="true">
        {LAYER_COLORS.map((color) => (
          <div
            key={color}
            className={styles.layer}
            data-loader-layer
            style={{ background: color }}
          />
        ))}
      </div>
      <div className={styles.sheet} ref={sheetRef}>
        <div className={styles.counter} ref={counterRef}>
          <CountUp
            from={0}
            to={100}
            separator=","
            direction="up"
            duration={5}
            delay={0}
            className={`${styles.number} loader-number`}
          />
        </div>
      </div>
    </div>
  );
}
