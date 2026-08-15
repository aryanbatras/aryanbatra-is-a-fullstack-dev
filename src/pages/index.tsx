import { useCallback, useState } from "react";
import { ScrollSmootherProvider } from "@/context/ScrollSmootherContext";
import VideoShowcase from "@/layout/new/segments/VideoShowcase";
import LaptopEntry from "@/layout/new/segments/LaptopEntry";
import MacDesktop from "@/layout/new/segments/MacDesktop";
import { ACT1_DURATION, ACT1_DURATIONS, SCRUB_POSTER_A, SCRUB_VIDEO_A } from "@/constants/video";
import showreel from "@/styles/components/new/VideoShowcase.module.css";
import styles from "@/styles/pages/new.module.css";

/**
 * The home page IS the machine: the showreel plays, the film's frozen last
 * frame (a 16:9 photo) rises from the bottom and expands to fill the screen,
 * then the desktop boots (lock screen → password → desktop). The classic
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
            {/* ACT ONE — 001 + 002 as one continued sequence, its own pin.
                The film plays while the name fades in whole and the
                experience stacks in, one line at a time. */}
            <VideoShowcase
              video={SCRUB_VIDEO_A}
              poster={SCRUB_POSTER_A}
              durations={ACT1_DURATIONS}
              totalDuration={ACT1_DURATION}
              pinViewports={10}
              showFullscreen
            >
              <div data-chapter={0} className={`${showreel.block} ${showreel.ch1}`}>
                <div>
                  <h1 data-split="name" className={showreel.name}>
                    Aryan Batra
                  </h1>
                  <p data-split="role" className={showreel.role}>
                    Software Engineer
                  </p>
                  <p data-split="sub" className={showreel.sub}>
                    Full-Stack Development · Distributed Systems · 3D &amp; Motion
                  </p>
                </div>
              </div>
              <div data-chapter={1} className={`${showreel.block} ${showreel.ch2}`}>
                <div>
                  <p className={showreel.blockLabel}>Experience</p>
                  <ul className={showreel.exp}>
                    <li data-exp className={showreel.expItem}>
                      <span className={showreel.expRole}>Founder</span>
                      <span className={showreel.expOrg}>JU Learning</span>
                      <span className={showreel.expMeta}>2026 — Now</span>
                    </li>
                    <li data-exp className={showreel.expItem}>
                      <span className={showreel.expRole}>Founder · Lead Systems Engineer</span>
                      <span className={showreel.expOrg}>100xsystems</span>
                      <span className={showreel.expMeta}>2026 — Now</span>
                    </li>
                    <li data-exp className={showreel.expItem}>
                      <span className={showreel.expRole}>Software Engineer Intern</span>
                      <span className={showreel.expOrg}>A2B Digital Solutions</span>
                      <span className={showreel.expMeta}>2026</span>
                    </li>
                    <li data-exp className={showreel.expItem}>
                      <span className={showreel.expRole}>Software Engineer</span>
                      <span className={showreel.expOrg}>Sashel</span>
                      <span className={showreel.expMeta}>2025</span>
                    </li>
                    <li data-exp className={showreel.expItem}>
                      <span className={showreel.expRole}>Automation Engineer</span>
                      <span className={showreel.expOrg}>Polarions · Sweden</span>
                      <span className={showreel.expMeta}>2025</span>
                    </li>
                    <li data-exp className={showreel.expItem}>
                      <span className={showreel.expRole}>Robotics Engineer</span>
                      <span className={showreel.expOrg}>e-Yantra · IIT Bombay</span>
                      <span className={showreel.expMeta}>2025</span>
                    </li>
                    <li data-exp className={showreel.expItem}>
                      <span className={showreel.expRole}>Technical Writer</span>
                      <span className={showreel.expOrg}>CodeVeda</span>
                      <span className={showreel.expMeta}>2025</span>
                    </li>
                  </ul>
                </div>
              </div>
            </VideoShowcase>

            {/* THE MACHINE — the macOS desktop preview rises from the bottom
                inside its curved MacBook bezel, expands until it fills the
                screen, then the system boots. Everything else (projects,
                resume, photos) lives inside the desktop itself. */}
            <LaptopEntry onEnter={open} />
          </div>
        </div>
        <MacDesktop open={desktopOpen} onClose={() => setDesktopOpen(false)} />
      </main>
    </ScrollSmootherProvider>
  );
}
