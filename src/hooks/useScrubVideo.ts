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
 * Two rules keep the scrub cheap:
 *  1. ONE seek in flight, never two. A new request while a seek is decoding
 *     only updates the pending target; when the `seeked` event lands, the
 *     engine jumps straight to the LATEST target. That caps the media
 *     pipeline at a single decode (no backlog that janks the scroll) and
 *     skips the intermediate frames a fast scroll would otherwise force.
 *  2. Micro-seeks are dropped — targets within ~half a video frame (24fps ≈
 *     42ms) never re-decode the same frame.
 *
 * Usage:
 *   const { videoRef, seekTo, ready } = useScrubVideo(durationSeconds);
 *   // render one <video> element with that ref
 *   // on scroll: seekTo(progress * durationSeconds)
 */

export function useScrubVideo(totalDuration = 16) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingRef = useRef<number | null>(null);
  const seekingRef = useRef(false);
  const appliedRef = useRef(0);
  const watchdogRef = useRef(0);
  const pumpRef = useRef<(v: HTMLVideoElement) => void>(() => {});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pumpRef.current = (v) => {
      const target = pendingRef.current;
      if (v.readyState < 2 || target === null) return;
      // Micro-seek guard — re-decode only when the target moved at least
      // ~half a video frame (24fps). Keeps slow scrolls decode-free.
      if (Math.abs(target - appliedRef.current) < 0.02) {
        appliedRef.current = target;
        return;
      }
      const max =
        Number.isFinite(v.duration) && v.duration > 0
          ? v.duration - 0.05
          : totalDuration;
      const t = Math.min(target, max);
      const onSeeked = () => {
        window.clearTimeout(watchdogRef.current);
        v.removeEventListener("seeked", onSeeked);
        seekingRef.current = false;
        appliedRef.current = t;
        // Scroll kept moving while the frame decoded — jump to the latest
        // request instead of wasting another decode on the intermediate one.
        pumpRef.current(v);
      };
      seekingRef.current = true;
      v.addEventListener("seeked", onSeeked, { once: true });
      // Watchdog: if a seek ever stalls (e.g. buffering over a slow network),
      // release the engine so the next scroll input can re-request the target.
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = window.setTimeout(() => {
        if (!seekingRef.current) return;
        seekingRef.current = false;
        appliedRef.current = t;
        v.removeEventListener("seeked", onSeeked);
        pumpRef.current(v);
      }, 400);
      try {
        v.currentTime = t;
      } catch {
        seekingRef.current = false;
        v.removeEventListener("seeked", onSeeked);
      }
    };
    return () => window.clearTimeout(watchdogRef.current);
  }, [totalDuration]);

  /** Coalesced seek: only one decode in flight, always to the latest target. */
  const seekTo = useCallback(
    (time: number) => {
      pendingRef.current = Math.min(Math.max(time, 0), totalDuration);
      if (seekingRef.current) return;
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      pumpRef.current(v);
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
      window.clearTimeout(watchdogRef.current);
    };
  }, []);

  return { videoRef, seekTo, ready };
}
