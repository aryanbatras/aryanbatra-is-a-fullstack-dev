import { useCallback, useEffect, useRef, useState } from "react";
import { useControls } from "leva";
import { ScrollSmootherProvider } from "@/context/ScrollSmootherContext";
import VideoShowcase from "@/layout/new/segments/VideoShowcase";
import MacDesktop from "@/layout/new/segments/MacDesktop";
import LevaPanel from "@/components/utility/LevaPanel";
import FoldText, { type FoldTextHandle } from "@/components/animations/FoldText";
import { ACT1_DURATION, ACT1_DURATIONS, SCRUB_POSTER_A, SCRUB_VIDEO_A } from "@/constants/video";
import showreel from "@/styles/components/new/VideoShowcase.module.css";
import styles from "@/styles/pages/new.module.css";

/** The fold starts ~10% into chapter one (the first film) and completes by
    ~32% of it — the "Hi, I'm Aryan" text unfolds as the user scrolls that
    window of the pin. Live-tunable from the Leva panel (nav settings icon). */
const FOLD_WINDOW_START = 0.00;
const FOLD_WINDOW_END = 0.25;

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
  const foldRef = useRef<FoldTextHandle>(null);

  const { foldWindowStart, foldWindowEnd, duration, stagger, fontSize } = useControls({
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
    duration: { value: 5, min: 1, max: 8, step: 0.25, label: "unfold duration" },
    stagger: { value: 1, min: 0.25, max: 3, step: 0.15, label: "unfold stagger" },
    fontSize: { value: 118, min: 60, max: 180, step: 2, label: "text size (desktop px)" },
  });

  /** Mirror the fold window into a ref so the pin timeline is never rebuilt
      while the sliders move — onProgress stays referentially stable. */
  const foldWindowRef = useRef({ start: foldWindowStart, end: foldWindowEnd });
  useEffect(() => {
    foldWindowRef.current = { start: foldWindowStart, end: foldWindowEnd };
  }, [foldWindowStart, foldWindowEnd]);

  /** Map the section's scrub progress (0..1) onto the chapter-one fold window
      and drive the FoldText unfold in lockstep with the scroll. */
  const onProgress = useCallback((progress: number) => {
    const { start, end } = foldWindowRef.current;
    const chapterSpan = ACT1_DURATIONS[0] / ACT1_DURATION; // chapter one's slice
    const s = chapterSpan * start;
    const e = chapterSpan * end;
    const local = Math.min(1, Math.max(0, (progress - s) / (e - s)));
    foldRef.current?.setFoldProgress(local);
  }, []);

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
              pinViewports={20}
              showFullscreen
              onComplete={open}
              onProgress={onProgress}
            >
              <div data-chapter={0} className={`${showreel.block} ${showreel.ch1}`}>
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
              </div>
            </VideoShowcase>
          </div>
        </div>
        <MacDesktop open={desktopOpen} onClose={() => setDesktopOpen(false)} />
      </main>
    </ScrollSmootherProvider>
  );
}
