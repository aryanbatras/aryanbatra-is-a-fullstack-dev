import { useInView, useMotionValue, useSpring } from "motion/react";
import { useCallback, useEffect, useRef } from "react";

interface CountUpProps {
  /** The target number to count up to. */
  to: number;
  /** The initial number from which the count starts. */
  from?: number;
  /** "down" reverses from/to so the counter counts down. */
  direction?: "up" | "down";
  /** Delay in seconds before the counting starts. */
  delay?: number;
  /** Duration of the count animation — maps onto the spring's stiffness
      and damping, exactly like the original React Bits behaviour. */
  duration?: number;
  className?: string;
  /** Whether the count should start once the span scrolls into view. */
  startWhen?: boolean;
  /** Character used as the thousands separator ("" disables grouping). */
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

/** Number of decimal places worth showing, if any. */
const countDecimals = (num: number): number => {
  const str = String(num);
  if (!str.includes(".")) return 0;
  const decimals = str.split(".")[1];
  return parseInt(decimals, 10) !== 0 ? decimals.length : 0;
};

export default function CountUp({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const descending = direction === "down";
  const startValue = descending ? to : from;
  const endValue = descending ? from : to;

  const motionValue = useMotionValue(startValue);
  const springValue = useSpring(motionValue, {
    damping: 20 + 40 * (1 / duration),
    stiffness: 100 * (1 / duration),
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const maxDecimals = Math.max(countDecimals(from), countDecimals(to));

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0;
      const formatted = new Intl.NumberFormat("en-US", {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      }).format(latest);
      return separator ? formatted.replace(/,/g, separator) : formatted;
    },
    [maxDecimals, separator],
  );

  // Prime the number with the starting value before the animation runs.
  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(startValue);
    }
  }, [startValue, formatValue]);

  // Kick the spring off once the span is in view.
  useEffect(() => {
    if (!isInView || !startWhen) return;
    onStart?.();
    const kick = window.setTimeout(
      () => motionValue.set(endValue),
      delay * 1000,
    );
    const done = window.setTimeout(
      () => onEnd?.(),
      delay * 1000 + duration * 1000,
    );
    return () => {
      window.clearTimeout(kick);
      window.clearTimeout(done);
    };
  }, [
    isInView,
    startWhen,
    motionValue,
    endValue,
    delay,
    duration,
    onStart,
    onEnd,
  ]);

  // Render every spring tick straight into the span.
  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });
    return unsubscribe;
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
}
