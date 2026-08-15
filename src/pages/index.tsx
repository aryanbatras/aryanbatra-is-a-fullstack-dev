import { useCallback, useRef, useState } from "react";
import { ScrollSmootherProvider } from "@/context/ScrollSmootherContext";
import VideoShowcase from "@/layout/new/segments/VideoShowcase";
import MacDesktop from "@/layout/new/segments/MacDesktop";
import FoldText, { type FoldTextHandle } from "@/components/animations/FoldText";
import { ACT1_DURATION, ACT1_DURATIONS, SCRUB_POSTER_A, SCRUB_VIDEO_A } from "@/constants/video";
import showreel from "@/styles/components/new/VideoShowcase.module.css";
import styles from "@/styles/pages/new.module.css";

/** The fold starts ~5% into chapter one (the first film) and completes by
    ~50% of it — the "Hi, I'm Aryan" text unfolds as the user scrolls that
    window of the pin. */
const FOLD_WINDOW_START = 0.10;
const FOLD_WINDOW_END = 0.32;

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

  /** Map the section's scrub progress (0..1) onto the chapter-one fold window
      and drive the FoldText unfold in lockstep with the scroll. */
  const onProgress = useCallback((progress: number) => {
    const chapterSpan = ACT1_DURATIONS[0] / ACT1_DURATION; // chapter one's slice
    const start = chapterSpan * FOLD_WINDOW_START;
    const end = chapterSpan * FOLD_WINDOW_END;
    const local = Math.min(1, Math.max(0, (progress - start) / (end - start)));
    foldRef.current?.setFoldProgress(local);
  }, []);

  return (
    <ScrollSmootherProvider>
      <main className={styles.page}>
        {/* Everything that scrolls must live inside the smoother's wrapper.
            position: fixed elements (the desktop overlay) stay outside. */}
        <div id="smooth-wrapper">
          <div id="smooth-content">
            {/* THE FILM — 001 + 002 + 003 + 004 as one continued sequence,
                its own pin. The greeting (bottom centre) unfolds character by
                character while the user scrolls the first half of chapter one,
                then leaves before chapter two. As the film ends on the
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
                  duration={5}
                  stagger={1}
                  ease="power3.out"
                  perspective={625}
                  creaseShading={0}
                  fontSize={100}
                  fontWeight={800}
                  color="#f7f2e8"
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
