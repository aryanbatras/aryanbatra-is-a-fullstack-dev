import { useEffect, useRef, useState, type ReactNode } from "react";
import { useScrubVideo } from "@/hooks/useScrubVideo";
import { useScrollSmootherReady } from "@/context/ScrollSmootherContext";
import styles from "@/styles/components/new/VideoShowcase.module.css";

interface VideoShowcaseProps {
  /** All-intra scrub film for this section. */
  video: string;
  poster: string;
  /** Per-chapter durations within this film (drives the overlay timing). */
  durations: number[];
  totalDuration: number;
  /** Pin length in viewport-heights (e.g. 10 → +=1000%). */
  pinViewports?: number;
  /** Seconds the film position lags the scroll (lower = less lag). */
  scrub?: number;
  /** Browser fullscreen toggle — act one only. */
  showFullscreen?: boolean;
  /** Chapter overlay blocks, each carrying data-chapter="i". */
  children?: ReactNode;
}

/**
 * A pinned, scroll-scrubbed film section. ScrollSmoother lerps the native
 * scroll and this ScrollTrigger pins the section for `pinViewports` viewport
 * heights while `scrub` eases the film position toward the scroll — the
 * ultra-slow cinematic glide. Progress maps 0 → 100% of this section's
 * all-intra film, so scrubbing is frame-accurate.
 *
 * Overlay blocks (children with data-chapter) animate on the SAME scrubbed
 * timeline, so they stay in lockstep with the frame under them:
 *  - chapter 0: the name fades in whole (simple, no character splitting),
 *    then the role + sub fade in beneath it.
 *  - chapter 1: the experience stacks in one line at a time — each new role
 *    appears below while the one above slides away, in its own position.
 */
export default function VideoShowcase({
  video,
  poster,
  durations,
  totalDuration,
  pinViewports = 10,
  scrub = 3.8,
  showFullscreen = false,
  children,
}: VideoShowcaseProps) {
  const { videoRef, seekTo, ready } = useScrubVideo(totalDuration);
  const sectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const smootherReady = useScrollSmootherReady();

  useEffect(() => {
    if (!ready || !smootherReady) return;
    let cancelled = false;
    let trigger: { kill: () => void } | undefined;

    (async () => {
      const [{ default: gsap }, { default: ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled || !sectionRef.current || !videoRef.current) return;

      // Chapter boundaries as timeline progress (0..1).
      const bounds = durations.reduce<number[]>(
        (acc, d) => [...acc, (acc[acc.length - 1] ?? 0) + d],
        [0],
      ).map((t) => t / totalDuration);

      const fadeWindow = (i: number) => {
        const start = bounds[i];
        const end = bounds[i + 1] ?? 1;
        const span = end - start;
        return {
          fadeIn: start + span * 0.04,
          inEnd: start + span * 0.22,
          outStart: end - span * 0.16,
          fadeOut: end - span * 0.02,
        };
      };

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: `+=${pinViewports * 100}%`,
          pin: true,
          scrub,
          anticipatePin: 1,
          onUpdate: (self) => {
            // The whole pin is the film (no end-zoom anymore).
            seekTo(self.progress * totalDuration);
          },
        },
      });

      // Cinematic zoom-out: the film starts slightly magnified and settles.
      timeline.fromTo(
        videoRef.current,
        { scale: 1.08 },
        { scale: 1, ease: "none", duration: 0.9 },
        0,
      );

      const show = (el: HTMLElement | null, w: { fadeIn: number; inEnd: number }) => {
        if (!el) return;
        timeline.fromTo(
          el,
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, ease: "none", duration: w.inEnd - w.fadeIn },
          w.fadeIn,
        );
      };
      const hide = (el: HTMLElement | null, w: { outStart: number; fadeOut: number }) => {
        if (!el) return;
        timeline.to(
          el,
          { opacity: 0, y: -20, ease: "none", duration: w.fadeOut - w.outStart },
          w.outStart,
        );
      };

      // Chapter overlays — each enters with its chapter, leaves before the next.
      const blocks = overlayRef.current?.querySelectorAll<HTMLElement>("[data-chapter]") ?? [];
      blocks.forEach((el, i) => {
        const w = fadeWindow(i);
        show(el, w);
        hide(el, w);

        if (i === 0) {
          // Identity — the name reveals whole (a simple fade + rise, no
          // character splitting), then the role chip and sub fade in beneath.
          const name = el.querySelector<HTMLElement>("[data-split='name']");
          if (name) {
            timeline.fromTo(
              name,
              { autoAlpha: 0, y: 30 },
              { autoAlpha: 1, y: 0, ease: "none", duration: 0.14 },
              w.fadeIn + 0.02,
            );
          }
          const role = el.querySelector<HTMLElement>("[data-split='role']");
          const sub = el.querySelector<HTMLElement>("[data-split='sub']");
          timeline.fromTo(
            role,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, ease: "none", duration: 0.06 },
            0.28,
          );
          timeline.fromTo(
            sub,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, ease: "none", duration: 0.06 },
            0.35,
          );
        } else {
          // Experience — each role appears below the previous one, which
          // slides away above it, one at a time, in its own position.
          const items = el.querySelectorAll<HTMLElement>("[data-exp]");
          if (items.length) {
            const span = (w.outStart - w.fadeIn - 0.05) / items.length;
            items.forEach((item, k) => {
              const start = w.fadeIn + k * span;
              timeline.fromTo(
                item,
                { autoAlpha: 0, y: 34 },
                { autoAlpha: 1, y: 0, ease: "power1.out", duration: span * 0.45 },
                start,
              );
              timeline.to(
                item,
                { autoAlpha: 0, y: -26, ease: "power1.in", duration: span * 0.32 },
                start + span * 0.6,
              );
            });
          }
        }
      });

      trigger = { kill: () => timeline.scrollTrigger?.kill() };
    })();

    return () => {
      cancelled = true;
      trigger?.kill();
    };
  }, [ready, smootherReady, seekTo, durations, totalDuration, pinViewports, scrub]);

  return (
    <section ref={sectionRef} className={styles.section}>
      <video
        ref={videoRef}
        className={styles.video}
        src={video}
        poster={poster}
        muted
        playsInline
        preload="auto"
        aria-label="Scroll-scrubbed film"
      />

      {/* Cinematic letterbox + vignette — darken the edges of the film so the
          white overlays read without any text shadow. Purely decorative. */}
      <div className={styles.letterbox} aria-hidden />
      <div className={styles.vignette} aria-hidden />

      {/* Overlay layer — pointer-events off except the fullscreen button. */}
      <div ref={overlayRef} className={styles.overlay}>
        {children}
      </div>

      {/* Fullscreen toggle — small borderless icon, isolated in its own
          component so toggling state never re-renders (and un-splits) the
          chapter text. */}
      {showFullscreen && <FullscreenButton />}
    </section>
  );
}

/** Small icon-only fullscreen toggle (no borders, no inverted hover). */
function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {
        /* fullscreen denied — ignore */
      });
    }
  };

  return (
    <button
      type="button"
      className={styles.fullscreen}
      onClick={toggle}
      aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
    >
      <span className={styles.fullscreenGlyph} aria-hidden>
        {isFullscreen ? "⤢" : "⛶"}
      </span>
    </button>
  );
}
