import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Initialises GSAP ScrollSmoother for the /new experience and exposes a
 * `ready` flag plus a `scrollTo` action. ScrollSmoother must be created BEFORE
 * any ScrollTrigger-based animation (its effects scan happens at create-time),
 * and React runs child effects before parent effects — so sections gate their
 * animations on this flag instead of racing the smoother.
 *
 * Smooth scrolling + `scrub` on the video trigger is what makes the pinned
 * showreel feel ultra-smooth: the browser scroll is lerped by ScrollSmoother
 * and the video position eases toward it via ScrollTrigger's scrub.
 */
const ScrollSmootherReadyContext = createContext(false);
const ScrollSmootherScrollToContext = createContext<
  (target: number | string | Element, smooth?: boolean) => void
>(() => {});

export function ScrollSmootherProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const smootherRef = useRef<{ scrollTo: (t: number | string | Element, s: boolean, p: string) => void } | null>(null);

  /**
   * Smooth-scroll the page. Uses the ScrollSmoother instance when available
   * (so the lerp keeps the scrub silky); falls back to native smooth scroll.
   */
  const scrollTo = useCallback(
    (target: number | string | Element, smooth = true) => {
      const s = smootherRef.current;
      if (s) {
        s.scrollTo(target, smooth, "top");
        return;
      }
      window.scrollTo({
        top: typeof target === "number" ? target : 0,
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [],
  );

  /* ----- Viewport-size changes (browser fullscreen) -----
     Entering/exiting fullscreen changes innerHeight, which silently breaks
     the pinned sections: their pin distances and spacers were measured against
     the old viewport, so the tail of each pin becomes a dead blank zone.
     Re-measure (multiple passes — the fullscreen transition spans frames)
     whenever the viewport size changes. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    let timers: number[] = [];
    const refresh = () => {
      void import("gsap/ScrollTrigger").then(({ default: ScrollTrigger }) => {
        ScrollTrigger.refresh();
      });
    };
    const onViewportChange = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [0, 150, 500].map((d) => window.setTimeout(refresh, d));
    };
    document.addEventListener("fullscreenchange", onViewportChange);
    window.addEventListener("resize", onViewportChange);
    return () => {
      document.removeEventListener("fullscreenchange", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  /* ----- Keep the scroll gutter Tahoe-dark on /new (any measure mismatch
     would otherwise flash white behind the pinned sections). ----- */
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background =
      "linear-gradient(180deg, #0a0e1f 0%, #0d0a1e 48%, #12071f 100%)";
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let smoother: { kill: () => void } | null = null;

    const mobileOrReduced =
      typeof window !== "undefined" &&
      (window.matchMedia("(max-width: 767px)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    if (mobileOrReduced) {
      // Skip smoothing on small screens / reduced motion — native scroll is
      // better there. Animations still run (ready is still set).
      setReady(true);
      return;
    }

    (async () => {
      const [{ default: gsap }, { default: ScrollTrigger }, { default: ScrollSmoother }] =
        await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
          import("gsap/ScrollSmoother"),
        ]);
      gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
      if (cancelled) return;

      // Don't stretch time after heavy frames (scrubbed video decode is bursty):
      // lag-smoothing would otherwise make subsequent scroll frames feel slow.
      gsap.ticker.lagSmoothing(0);

      smoother = ScrollSmoother.create({
        smooth: 0.85, // seconds to catch up to the native scroll position
        effects: true, // honour data-speed / data-lag attributes (parallax)
        normalizeScroll: true,
        smoothTouch: 0.1,
      });
      smootherRef.current = smoother as never;

      setReady(true);
    })();

    return () => {
      cancelled = true;
      smoother?.kill();
      smootherRef.current = null;
    };
  }, []);

  return (
    <ScrollSmootherScrollToContext.Provider value={scrollTo}>
      <ScrollSmootherReadyContext.Provider value={ready}>
        {children}
      </ScrollSmootherReadyContext.Provider>
    </ScrollSmootherScrollToContext.Provider>
  );
}

export function useScrollSmootherReady() {
  return useContext(ScrollSmootherReadyContext);
}

export function useScrollSmootherScrollTo() {
  return useContext(ScrollSmootherScrollToContext);
}
