import { useCallback, useState } from "react";
import { ScrollSmootherProvider } from "@/context/ScrollSmootherContext";
import VideoShowcase from "@/layout/new/segments/VideoShowcase";
import MacDesktop from "@/layout/new/segments/MacDesktop";
import { ACT1_DURATION, ACT1_DURATIONS, SCRUB_POSTER_A, SCRUB_VIDEO_A } from "@/constants/video";
import showreel from "@/styles/components/new/VideoShowcase.module.css";
import styles from "@/styles/pages/new.module.css";

/**
 * The home page IS the machine: the film plays (name only, no other text),
 * the frozen last frame of the film — the finished desktop — zooms in, and
 * the moment we hit the rock bottom of video 004 the desktop boots straight
 * over it. No sections after the video, nothing on screen. The classic
 * portfolio lives at /legacy, embedded inside the desktop's browser.
 */
export default function Home() {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const open = useCallback(() => setDesktopOpen(true), []);

  return (
    <ScrollSmootherProvider>
      <main className={styles.page}>
        {/* Everything that scrolls must live inside the smoother's wrapper.
            position: fixed elements (the desktop overlay) stay outside. */}
        <div id="smooth-wrapper">
          <div id="smooth-content">
            {/* THE FILM — 001 + 002 + 003 + 004 as one continued sequence,
                its own pin. Only "ARYAN BATRA" appears — bottom centre, GTA
                style, during chapter one. Nothing else. As the film ends on
                the finished desktop it zooms in, and at rock bottom the
                desktop boots immediately (no text, no intermediate steps). */}
            <VideoShowcase
              video={SCRUB_VIDEO_A}
              poster={SCRUB_POSTER_A}
              durations={ACT1_DURATIONS}
              totalDuration={ACT1_DURATION}
              pinViewports={20}
              showFullscreen
              onComplete={open}
            >
              <div data-chapter={0} className={`${showreel.block} ${showreel.ch1}`}>
                <h1 data-split="name" className={showreel.name}>
                  <span className={showreel.nameLine}>Aryan</span>
                  <span className={showreel.nameLine}>Batra</span>
                </h1>
              </div>
            </VideoShowcase>
          </div>
        </div>
        <MacDesktop open={desktopOpen} onClose={() => setDesktopOpen(false)} />
      </main>
    </ScrollSmootherProvider>
  );
}
