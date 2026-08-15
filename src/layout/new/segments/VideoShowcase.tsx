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
  /** Pin length in viewport-heights (e.g. 20 → +=2000%). */
  pinViewports?: number;
  /** Seconds the film position lags the scroll (lower = less lag). */
  scrub?: number;
  /** Fraction (0..1) of chapter one where the greeting starts fading out. */
  chapter0FadeOut?: number;
  /** Browser fullscreen toggle. */
  showFullscreen?: boolean;
  /** Fired once at the rock bottom of the film — the desktop boots then. */
  onComplete?: () => void;
  /** Fired once when the film + smoother are ready to scrub (loader reveal). */
  onReady?: () => void;
  /** Fired on every scrub update with the section's progress (0..1). */
  onProgress?: (progress: number) => void;
  /** Chapter overlay blocks, each carrying data-chapter="i". */
  children?: ReactNode;
}

/**
 * A pinned, scroll-scrubbed film section. ScrollSmoother lerps the native
 * scroll and this ScrollTrigger pins the section for `pinViewports` viewport
 * heights while `scrub` eases the film position toward the scroll — a smooth
 * cinematic glide that still tracks the scrollbar tightly. Progress maps
 * 0 → 100% of this section's all-intra film, so scrubbing is frame-accurate.
 *
 * Overlay blocks (children with data-chapter) animate on the SAME scrubbed
 * timeline, so they stay in lockstep with the frame under them. Today there
 * is exactly one block: the greeting — Vercel-style wordmark typography
 * (FoldText), anchored bottom-centre, appearing in place as soon as chapter
 * one starts and leaving before chapter two. Its unfold is scrubbed to the
 * scroll through onProgress, opening character by character across the first
 * half of chapter one.
 *
 * The end of the film IS the finished desktop. As progress enters the final
 * frames the film zooms into that desktop and fades to black; at rock bottom
 * `onComplete` fires so the OS can boot straight over the black.
 */
export default function VideoShowcase({
  video,
  poster,
  durations,
  totalDuration,
  pinViewports = 20,
  scrub = 1.5,
  chapter0FadeOut = 0.55,
  showFullscreen = false,
  onComplete,
  onReady,
  onProgress,
  children,
}: VideoShowcaseProps) {
  const { videoRef, seekTo, ready } = useScrubVideo(totalDuration);
  const sectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);
  const smootherReady = useScrollSmootherReady();

  /* The 23MB all-intra film is the site's heaviest resource. It starts in the
     background AFTER first paint (idle callback) so it never races the
     critical CSS/JS — the loader counter paints first, the film pulls in
     behind it and gates the reveal through `ready`. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let cancelled = false;
    const start = () => {
      if (cancelled || v.src) return;
      v.src = video;
      v.load();
    };
    const useIdle = typeof window.requestIdleCallback === "function";
    const id = useIdle
      ? window.requestIdleCallback(start, { timeout: 1200 })
      : window.setTimeout(start, 300);
    return () => {
      cancelled = true;
      if (useIdle) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [video, videoRef]);

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

      // The loader curtain slides up the instant the experience is live.
      onReady?.();

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
          start,
          end,
          span,
          fadeIn: start + span * 0.04,
          inEnd: start + span * 0.22,
          outStart: end - span * 0.16,
          fadeOut: end - span * 0.02,
        };
      };

      // Where the film stops being a film: the final ~6% of the pin IS the
      // desktop zoom. These are progress values, not seconds.
      const ZOOM_START = 0.94;
      const FADE_START = 0.955;
      const FADE_END = 0.995;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: `+=${pinViewports * 100}%`,
          pin: true,
          scrub,
          anticipatePin: 1,
          onUpdate: (self) => {
            seekTo(self.progress * totalDuration);
            onProgress?.(self.progress);
            // Rock bottom — the desktop boots the instant the zoom blacks out.
            if (self.progress >= FADE_END && !completedRef.current) {
              completedRef.current = true;
              onComplete?.();
            } else if (self.progress < 0.9) {
              completedRef.current = false;
            }
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

      // Desktop hand-off: the last frames of video 004 are the finished
      // desktop — zoom straight into it, then fade to black so the OS boot
      // appears out of nothing.
      timeline.fromTo(
        videoRef.current,
        { scale: 1, opacity: 1 },
        {
          scale: 2.4,
          opacity: 0,
          ease: "none",
          duration: 1 - ZOOM_START,
        },
        ZOOM_START,
      );
      timeline.to(
        videoRef.current,
        { opacity: 0, ease: "none", duration: FADE_END - FADE_START },
        FADE_START,
      );

      // Overlays — each enters with its chapter, leaves before the next.
      const blocks = overlayRef.current?.querySelectorAll<HTMLElement>("[data-chapter]") ?? [];
      blocks.forEach((el, i) => {
        const w = fadeWindow(i);
        if (i === 0) {
          // The name — appears in place (no rise, no fade) as soon as chapter
          // one starts; the FoldText character unfold IS the entrance. It
          // fades out where chapter0FadeOut says (fraction of chapter one).
          const fadeStart = w.start + w.span * chapter0FadeOut;
          const fadeDuration = Math.max(0.005, w.span * 0.06);
          timeline.set(el, { autoAlpha: 1 }, w.fadeIn);
          timeline.to(
            el,
            { autoAlpha: 0, ease: "none", duration: fadeDuration },
            fadeStart,
          );
        } else {
          // Future chapters (no text today) — simple fade to keep the rhythm.
          timeline.fromTo(
            el,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.05 },
            w.fadeIn,
          );
          timeline.to(el, { autoAlpha: 0, duration: 0.05 }, w.outStart);
        }
      });

      trigger = { kill: () => timeline.scrollTrigger?.kill() };
    })();

    return () => {
      cancelled = true;
      trigger?.kill();
    };
  }, [ready, smootherReady, seekTo, durations, totalDuration, pinViewports, scrub, chapter0FadeOut, onComplete, onReady, onProgress, videoRef]);

  return (
    <section ref={sectionRef} className={styles.section}>
      <video
        ref={videoRef}
        className={styles.video}
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
          component so toggling state never re-renders the chapter text. */}
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
