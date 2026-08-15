import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useControls } from "leva";
import { ScrollSmootherProvider } from "@/context/ScrollSmootherContext";
import VideoShowcase from "@/layout/new/segments/VideoShowcase";
import MacDesktop from "@/layout/new/segments/MacDesktop";
import LevaPanel from "@/components/utility/LevaPanel";
// OLD — FoldText (scrubbed externally via setFoldProgress on the video pin's
// onProgress). Replaced with React Bits ScrollFloat, which scrubs on its own
// ScrollTrigger across the same fold window of chapter one.
// import FoldText, { type FoldTextHandle } from "@/components/animations/FoldText";
import ScrollFloat from "@/components/animations/ScrollFloat";
import { ACT1_DURATION, ACT1_DURATIONS, SCRUB_POSTER_A, SCRUB_VIDEO_A } from "@/constants/video";
import showreel from "@/styles/components/new/VideoShowcase.module.css";
import styles from "@/styles/pages/new.module.css";

/** The fold starts ~10% into chapter one (the first film) and completes by
    ~32% of it — the "Hi, I'm Aryan" text unfolds as the user scrolls that
    window of the pin. Live-tunable from the Leva panel (nav settings icon). */
const FOLD_WINDOW_START = 0.05;
const FOLD_WINDOW_END = 0.55;

/** The video section's pin length — must match VideoShowcase's pinViewports. */
const PIN_VIEWPORTS = 20;

/**
 * The home page IS the machine: the film plays (greeting only, no other
 * text), the frozen last frame of the film — the finished desktop — zooms in,
 * and the moment we hit the rock bottom of video 004 the desktop boots
 * straight over it. No sections after the video, nothing on screen. The
 * classic portfolio lives at /legacy, embedded inside the desktop's browser.
 */
export default function Home() {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const open = useCallback(() => setDesktopOpen(true), []);
  // const foldRef = useRef<FoldTextHandle>(null);

  /* Viewport height — ScrollFloat's trigger positions are absolute content
     scroll px inside the pin, so they scale with the viewport. */
  const [vh, setVh] = useState(0);
  useEffect(() => {
    const measure = () => setVh(window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { foldWindowStart, foldWindowEnd, fontSize, fadeOut } = useControls({
    foldWindowStart: {
      value: FOLD_WINDOW_START,
      min: 0,
      max: 1,
      step: 0.01,
      label: "fold window start",
    },
    foldWindowEnd: {
      value: FOLD_WINDOW_END,
      min: 0,
      max: 1,
      step: 0.01,
      label: "fold window end",
    },
    fontSize: { value: 120, min: 60, max: 180, step: 5, label: "text size (desktop px)" },
    fadeOut: {
      value: 0.45,
      min: 0.1,
      max: 1,
      step: 0.01,
      label: "text fade-out (ch1)",
    },
  });

  /** The greeting unfolds inside chapter one (the first film). Chapter one
      spans `ACT1_DURATIONS[0] / ACT1_DURATION` of the whole 20-viewport pin;
      the fold window (fractions of chapter one) maps onto absolute content
      scroll positions that ScrollFloat scrubs across. */
  const chapterSpan = ACT1_DURATIONS[0] / ACT1_DURATION;
  const scrollStart =
    vh > 0 ? chapterSpan * foldWindowStart * PIN_VIEWPORTS * vh : null;
  const scrollEnd =
    vh > 0 ? chapterSpan * foldWindowEnd * PIN_VIEWPORTS * vh : null;

  return (
    <ScrollSmootherProvider>
      <main className={styles.page}>
        {/* Live-tuning panel — toggled by the settings icon in the nav. */}
        <LevaPanel />
        {/* Everything that scrolls must live inside the smoother's wrapper.
            position: fixed elements (the desktop overlay) stay outside. */}
        <div id="smooth-wrapper">
          <div id="smooth-content">
        {/* THE FILM — 001 + 002 + 003 + 004 as one continued sequence,
            its own pin. The greeting (bottom centre) unfolds character by
            character while the user scrolls the fold window of chapter
            one, then leaves before chapter two. As the film ends on the
            finished desktop it zooms in, and at rock bottom the desktop
            boots immediately (no text, no intermediate steps). */}
            <VideoShowcase
              video={SCRUB_VIDEO_A}
              poster={SCRUB_POSTER_A}
              durations={ACT1_DURATIONS}
              totalDuration={ACT1_DURATION}
              pinViewports={PIN_VIEWPORTS}
              showFullscreen
              onComplete={open}
              chapter0FadeOut={fadeOut}
            >
              <div
                data-chapter={0}
                className={`${showreel.block} ${showreel.ch1}`}
                style={
                  {
                    "--fold-size": `clamp(1.875rem, ${(fontSize / 118) * 11}vw, ${fontSize}px)`,
                    "--fold-weight": 800,
                    "--fold-color": "#f7f2e8",
                  } as CSSProperties
                }
              >
                {/* NEW — React Bits ScrollFloat, scrubbed on its own
                    ScrollTrigger across the fold window of chapter one
                    (the first ~14% of the video pin). */}
                {scrollStart !== null &&
                  scrollEnd !== null && (
                    <ScrollFloat
                      scrollStart={scrollStart}
                      scrollEnd={scrollEnd}
                      containerClassName={showreel.fold}
                    >
                      Hi, I&apos;m Aryan
                    </ScrollFloat>
                  )}

                {/* OLD — FoldText, scrubbed through onProgress →
                    setFoldProgress (see commented wiring above).
                <FoldText
                  ref={foldRef}
                  text="Hi, I'm Aryan"
                  splitBy="char"
                  hinge="bottom"
                  trigger="scroll"
                  duration={duration}
                  stagger={stagger}
                  ease="power3.out"
                  perspective={625}
                  creaseShading={0}
                  fontSize={`clamp(1.875rem, ${(fontSize / 118) * 11}vw, ${fontSize}px)`}
                  fontWeight={800}
                  color="#f7f2e8"
                  className={showreel.fold}
                  scrub
                />
                */}
              </div>
            </VideoShowcase>
          </div>
        </div>
        <MacDesktop open={desktopOpen} onClose={() => setDesktopOpen(false)} />
      </main>
    </ScrollSmootherProvider>
  );
}
