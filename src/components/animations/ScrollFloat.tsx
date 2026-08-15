import {
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { useScrollSmootherReady } from "@/context/ScrollSmootherContext";
import styles from "@/styles/components/animation/ScrollFloat.module.css";

gsap.registerPlugin(ScrollTrigger);

interface ScrollFloatProps {
  /** The content to animate. If a string, it is split into characters. */
  children?: ReactNode;
  /** Optional ref to the scroll container. Defaults to window if not provided. */
  scrollContainerRef?: RefObject<HTMLElement | null>;
  /** Additional Tailwind classes for the container element. */
  containerClassName?: string;
  /** Additional Tailwind classes for the text element. */
  textClassName?: string;
  /** Duration (in seconds) of the animation. */
  animationDuration?: number;
  /** Easing function used for the animation. */
  ease?: string;
  /** The ScrollTrigger start position. */
  scrollStart?: string | number;
  /** The ScrollTrigger end position. */
  scrollEnd?: string | number;
  /** Delay between the animation start of each character. */
  stagger?: number;
}

/**
 * React Bits — ScrollFloat. Splits a string into characters and floats each
 * one up into place as the user scrolls (scrubbed, with a staggered
 * back.inOut bounce). Runs on its own ScrollTrigger; used here for the
 * "Hi, I'm Aryan" greeting over the pinned video film.
 */
const ScrollFloat = ({
  children,
  scrollContainerRef,
  containerClassName = "",
  textClassName = "",
  animationDuration = 1,
  ease = "back.inOut(2)",
  scrollStart = "center bottom+=50%",
  scrollEnd = "bottom bottom-=40%",
  stagger = 0.03,
}: ScrollFloatProps) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const smootherReady = useScrollSmootherReady();

  const splitText = useMemo(() => {
    const text = typeof children === "string" ? children : "";
    return text.split("").map((char, index) => (
      <span className={styles.char} key={index}>
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !smootherReady) return;

    // Only pin to an explicit container when one is given. Omitting `scroller`
    // lets GSAP use its default — which, in this app, is the ScrollSmoother's
    // #smooth-wrapper proxy. Passing `window` here would bypass the smoother
    // and the scrub would never advance (normalizeScroll keeps the native
    // scroll at rest).
    const scroller =
      scrollContainerRef && scrollContainerRef.current
        ? scrollContainerRef.current
        : null;

    const charElements = el.querySelectorAll(`.${styles.char}`);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        charElements,
        {
          willChange: "opacity, transform",
          opacity: 0,
          yPercent: 120,
          scaleY: 2.3,
          scaleX: 0.7,
          transformOrigin: "50% 0%",
        },
        {
          duration: animationDuration,
          ease,
          opacity: 1,
          yPercent: 0,
          scaleY: 1,
          scaleX: 1,
          stagger,
          scrollTrigger: {
            trigger: el,
            ...(scroller ? { scroller } : {}),
            start: scrollStart,
            end: scrollEnd,
            scrub: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger, smootherReady]);

  return (
    <h2
      ref={containerRef}
      className={`${styles.float} ${containerClassName}`.trim()}
    >
      <span className={`${styles.text} ${textClassName}`.trim()}>
        {splitText}
      </span>
    </h2>
  );
};

export default ScrollFloat;
