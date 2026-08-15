import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
  type Ref,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type SplitBy = "char" | "word" | "line";
type Hinge = "top" | "bottom" | "left" | "right";
type Trigger = "mount" | "hover" | "scroll" | "loop";

const HINGE_CONFIG: Record<Hinge, { origin: string; rotateX: number; rotateY: number }> = {
  top: { origin: "50% 0%", rotateX: -92, rotateY: 0 },
  bottom: { origin: "50% 100%", rotateX: 92, rotateY: 0 },
  left: { origin: "0% 50%", rotateX: 0, rotateY: 92 },
  right: { origin: "100% 50%", rotateX: 0, rotateY: -92 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export interface FoldTextHandle {
  /** Scrub the unfold to a 0..1 progress — 0 fully folded, 1 fully unfolded. */
  setFoldProgress: (progress: number) => void;
}

interface FoldTextProps {
  text?: string;
  splitBy?: SplitBy;
  hinge?: Hinge;
  duration?: number;
  stagger?: number;
  ease?: string;
  perspective?: number;
  creaseShading?: number;
  trigger?: Trigger;
  fontSize?: string | number;
  fontWeight?: string | number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  /** External scrub mode: the unfold is driven through the setFoldProgress
      handle (synced to a parent's scrubbed timeline) instead of an internal
      trigger. Panels render folded until the parent drives them open. */
  scrub?: boolean;
  ref?: Ref<FoldTextHandle>;
}

const renderWhitespace = (value: string, key: string) =>
  value.split(/(\n)/).map((part, index) => {
    if (part === "\n") return <br key={`${key}-br-${index}`} />;
    if (!part) return null;

    return (
      <span className="fold-text-whitespace" key={`${key}-space-${index}`}>
        {part.replace(/ /g, "\u00A0")}
      </span>
    );
  });

const FoldText = ({
  text = "Design unfolds",
  splitBy = "char",
  hinge = "bottom",
  duration = 0.65,
  stagger = 0.55,
  ease = "power3.out",
  perspective = 700,
  creaseShading = 0.55,
  trigger = "mount",
  fontSize = 100,
  fontWeight = 800,
  color = "#f7f2e8",
  className = "",
  style = {},
  scrub = true,
  ref,
}: FoldTextProps) => {
  const rootRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const hingeConfig = HINGE_CONFIG[hinge] || HINGE_CONFIG.top;
  const safeCrease = clamp(creaseShading, 0, 1);
  const safePerspective = Math.max(120, perspective);

  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const fromVars = useMemo<gsap.TweenVars>(
    () => ({
      opacity: 0,
      rotateX: reduceMotion ? 0 : hingeConfig.rotateX,
      rotateY: reduceMotion ? 0 : hingeConfig.rotateY,
      "--fold-crease": reduceMotion ? 0 : safeCrease,
      transformOrigin: hingeConfig.origin,
      force3D: true,
    }),
    [reduceMotion, hingeConfig.origin, hingeConfig.rotateX, hingeConfig.rotateY, safeCrease],
  );

  const toVars = useMemo<gsap.TweenVars>(
    () => ({
      opacity: 1,
      rotateX: 0,
      rotateY: 0,
      "--fold-crease": 0,
      duration: reduceMotion ? Math.min(duration, 0.22) : duration,
      ease: reduceMotion ? "power1.out" : ease,
      stagger: reduceMotion ? Math.min(stagger, 0.02) : stagger,
      clearProps: "willChange",
    }),
    [reduceMotion, duration, ease, stagger],
  );

  const segments = useMemo(() => {
    let segmentIndex = 0;

    const renderSegment = (content: string, key: string, split: SplitBy = splitBy) => {
      segmentIndex += 1;
      return (
        <span
          className="fold-text-segment"
          data-fold-split={split}
          key={key}
          style={{ "--fold-perspective": `${safePerspective}px` } as CSSProperties}
        >
          <span
            className="fold-text-piece"
            data-fold-hinge={hinge}
            style={{ transformOrigin: hingeConfig.origin, "--fold-crease": 0 } as CSSProperties}
          >
            {content || "\u00A0"}
          </span>
        </span>
      );
    };

    if (splitBy === "line") {
      return text.split("\n").map((line, index) => (
        <span className="fold-text-line" key={`line-${index}`}>
          {renderSegment(line || "\u00A0", `segment-line-${index}`, "line")}
        </span>
      ));
    }

    if (splitBy === "word") {
      return text.split(/(\s+)/).flatMap((part, index) => {
        if (!part) return [];
        if (/^\s+$/.test(part)) return renderWhitespace(part, `ws-${index}`);
        return renderSegment(part, `segment-word-${segmentIndex}`);
      });
    }

    return Array.from(text).map((char, index) => {
      if (char === "\n") return <br key={`br-${index}`} />;
      return renderSegment(char === " " ? "\u00A0" : char, `segment-char-${index}`);
    });
  }, [text, splitBy, hinge, hingeConfig.origin, safePerspective]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const root = rootRef.current;
    if (!root) return undefined;

    const pieces = Array.from(root.querySelectorAll(".fold-text-piece"));
    if (!pieces.length) return undefined;

    if (scrub) {
      // External scrub mode — park the panels folded and let the parent drive
      // the unfold through setFoldProgress on its scrubbed timeline.
      gsap.set(pieces, fromVars);
      return undefined;
    }

    const killTimeline = () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      gsap.killTweensOf(pieces);
    };

    const play = (repeat: boolean) => {
      killTimeline();
      timelineRef.current = gsap.timeline({
        repeat: repeat ? -1 : 0,
        repeatDelay: repeat ? 0.75 : 0,
      });
      timelineRef.current.fromTo(pieces, fromVars, toVars);
      return timelineRef.current;
    };

    let scrollTrigger: ScrollTrigger | undefined;
    let hoverHandler: (() => void) | undefined;

    if (trigger === "hover") {
      gsap.set(pieces, {
        opacity: 1,
        rotateX: 0,
        rotateY: 0,
        "--fold-crease": 0,
        transformOrigin: hingeConfig.origin,
      });
      hoverHandler = () => play(false);
      root.addEventListener("mouseenter", hoverHandler);
    } else if (trigger === "scroll") {
      gsap.set(pieces, fromVars);
      scrollTrigger = ScrollTrigger.create({
        trigger: root,
        start: "top 82%",
        once: true,
        onEnter: () => play(false),
      });
    } else if (trigger === "loop") {
      play(true);
    } else {
      play(false);
    }

    return () => {
      if (hoverHandler) root.removeEventListener("mouseenter", hoverHandler);
      scrollTrigger?.kill();
      killTimeline();
    };
  }, [
    scrub,
    trigger,
    hinge,
    hingeConfig.origin,
    hingeConfig.rotateX,
    hingeConfig.rotateY,
    fromVars,
    toVars,
  ]);

  /** Scrub the unfold to 0..1 — creates the paused tween on first use. */
  const setFoldProgress = useCallback(
    (progress: number) => {
      if (typeof window === "undefined") return;
      if (!tweenRef.current) {
        const root = rootRef.current;
        if (!root) return;
        const pieces = Array.from(root.querySelectorAll(".fold-text-piece"));
        if (!pieces.length) return;
        tweenRef.current = gsap.fromTo(pieces, fromVars, {
          ...toVars,
          paused: true,
          ease: "none",
        });
      }
      tweenRef.current.progress(clamp(progress, 0, 1));
    },
    [fromVars, toVars],
  );

  useImperativeHandle(ref, () => ({ setFoldProgress }), [setFoldProgress]);

  // Clean up the scrub tween on unmount.
  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
      tweenRef.current = null;
    };
  }, []);

  const rootStyle = {
    "--fold-text-font-size": typeof fontSize === "number" ? `${fontSize}px` : fontSize,
    "--fold-text-font-weight": fontWeight,
    "--fold-text-color": color,
    ...style,
  };

  return (
    <span ref={rootRef} className={`fold-text ${className}`.trim()} style={rootStyle as CSSProperties}>
      <span className="fold-text-sr-only">{text}</span>
      <span className="fold-text-visual" aria-hidden="true">
        {segments}
      </span>
    </span>
  );
};

export default FoldText;
