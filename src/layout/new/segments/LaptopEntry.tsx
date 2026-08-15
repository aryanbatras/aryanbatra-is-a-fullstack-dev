"use client";

import { useEffect, useRef } from "react";
import { useScrollSmootherReady } from "@/context/ScrollSmootherContext";
import DesktopPreview from "@/layout/new/segments/DesktopPreview";
import styles from "@/styles/components/new/LaptopEntry.module.css";

interface LaptopEntryProps {
  /** Opens the macOS desktop (boot → lock screen → password), fullscreen. */
  onEnter: () => void;
}

/**
 * The machine — the actual macOS Tahoe desktop (rendered by DesktopPreview
 * with the real wallpaper, icons, widgets and dock) sits inside a curved
 * MacBook bezel. Pinned and scroll-scrubbed: the machine is already peeking
 * up from the bottom edge (no dead dark space after the film), glides to the
 * centre, then expands until it covers the whole screen — its rounded
 * display flattening into the real display. Right as it fills, the system
 * starts (boot → lock screen → password) over the top.
 */
export default function LaptopEntry({ onEnter }: LaptopEntryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bezelRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const notchRef = useRef<HTMLSpanElement>(null);
  const enteredRef = useRef(false);
  const smootherReady = useScrollSmootherReady();

  useEffect(() => {
    if (!smootherReady) return;
    let cancelled = false;
    let trigger: { kill: () => void } | undefined;

    (async () => {
      const [{ default: gsap }, { default: ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      gsap.registerPlugin(ScrollTrigger);
      if (cancelled || !sectionRef.current || !stageRef.current || !bezelRef.current) return;

      // How much must the machine scale so its display covers the viewport?
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const bw = bezelRef.current.offsetWidth;
      const bh = bezelRef.current.offsetHeight;
      const fill = Math.max(vw / bw, vh / bh) * 1.05;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=170%",
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
          onUpdate: (self) => {
            // Fire right as the machine covers the whole viewport so the
            // system boots seamlessly over the top of the full-screen desktop.
            if (self.progress > 0.93 && !enteredRef.current) {
              enteredRef.current = true;
              onEnter();
            } else if (self.progress < 0.5) {
              enteredRef.current = false;
            }
          },
        },
      });

      gsap.set(stageRef.current, { xPercent: -50, yPercent: -50 });

      // 1) The machine is already peeking up from the bottom edge of the
      //    viewport (no dead dark space) and glides up to the centre…
      tl.fromTo(
        stageRef.current,
        { y: vh * 0.55, scale: 0.9 },
        { y: 0, scale: 1, ease: "none", duration: 0.4 },
        0,
      )
        // 2) …then expands until it covers the whole screen.
        .to(stageRef.current, { scale: fill, ease: "none", duration: 0.54 }, 0.4)
        // 3) As it takes over, the display's curves flatten and the notch
        //    fades — the laptop becomes the actual screen you are looking at.
        .to(bezelRef.current, { borderRadius: 0, ease: "none", duration: 0.3 }, 0.52)
        .to(screenRef.current, { borderRadius: 0, ease: "none", duration: 0.3 }, 0.52)
        .to(notchRef.current, { autoAlpha: 0, ease: "none", duration: 0.2 }, 0.55)
        .to(bezelRef.current, { boxShadow: "0 0 0 rgba(0,0,0,0)", ease: "none", duration: 0.3 }, 0.52);

      trigger = { kill: () => tl.scrollTrigger?.kill() };
    })();

    return () => {
      cancelled = true;
      trigger?.kill();
    };
  }, [smootherReady, onEnter]);

  return (
    <section ref={sectionRef} className={`${styles.section} dark`}>
      {/* The machine — a MacBook whose screen is the real macOS desktop. */}
      <div ref={stageRef} className={styles.stage}>
        <div ref={bezelRef} className={styles.bezel}>
          <div ref={screenRef} className={styles.screen}>
            <DesktopPreview />
          </div>
          <span ref={notchRef} className={styles.notch} aria-hidden />
        </div>
      </div>
    </section>
  );
}
