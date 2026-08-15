import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Scroll-scrub video engine.
 *
 * Drives ONE <video> element by setting currentTime to match the scroll
 * position. This is only smooth because the films are encoded ALL-INTRA
 * (keyframe at every frame — see scripts/build-showreel.sh): every seek
 * decodes exactly one frame, so there is no buffering, no black frames and
 * no flicker. Each act is its own separate file, pinned in its own section —
 * they are never stitched together.
 *
 * To keep the scrub light, seeks are coalesced to one per animation frame
 * AND quantized to ~1 video frame (24fps ≈ 42ms): micro-seeks from slow
 * scrolling are dropped instead of re-decoding the same frame repeatedly.
 *
 * Usage:
 *   const { videoRef, seekTo, ready } = useScrubVideo(durationSeconds);
 *   // render one <video> element with that ref
 *   // on scroll: seekTo(progress * durationSeconds)
 */

export function useScrubVideo(totalDuration = 16) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef(0);
  const targetRef = useRef(0);
  const lastTargetRef = useRef(0);
  const [ready, setReady] = useState(false);

  /** Coalesced + quantized seek: only one meaningful target per frame. */
  const seekTo = useCallback(
    (time: number) => {
      targetRef.current = Math.min(Math.max(time, 0), totalDuration);
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const v = videoRef.current;
        if (!v || v.readyState < 2) return;
        // Skip micro-seeks — re-decode only when the target moved at least
        // ~half a video frame (24fps). Keeps slow scrolls decode-free.
        if (Math.abs(targetRef.current - lastTargetRef.current) < 0.02) return;
        lastTargetRef.current = targetRef.current;
        const max =
          Number.isFinite(v.duration) && v.duration > 0
            ? v.duration - 0.05
            : totalDuration;
        try {
          v.currentTime = Math.min(targetRef.current, max);
        } catch {
          /* ignore */
        }
      });
    },
    [totalDuration],
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onReady = () => setReady(true);
    if (v.readyState >= 2) onReady();
    else v.addEventListener("loadeddata", onReady, { once: true });
    return () => {
      v.removeEventListener("loadeddata", onReady);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { videoRef, seekTo, ready };
}
