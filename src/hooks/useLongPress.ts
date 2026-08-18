"use client";

import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  /** Callback when long press is detected. */
  onLongPress: (e: React.PointerEvent) => void;
  /** Duration in ms before long press fires (default: 500). */
  delay?: number;
  /** Whether long press is enabled (default: true). */
  enabled?: boolean;
}

/**
 * Detects long-press on touch devices.
 * Returns pointer event handlers to spread on the target element.
 * On desktop (hover capable), does nothing — right-click handles it.
 *
 * Usage:
 *   const longPress = useLongPress({ onLongPress: (e) => openMenu(e) });
 *   <div {...longPress}>...</div>
 */
export function useLongPress({
  onLongPress,
  delay = 500,
  enabled = true,
}: UseLongPressOptions) {
  const timerRef = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPos.current = null;
  }, []);

  if (!enabled) return {};

  return {
    onPointerDown: (e: React.PointerEvent) => {
      // Only on touch devices
      if (window.matchMedia("(hover: none)").matches === false) return;
      startPos.current = { x: e.clientX, y: e.clientY };
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        onLongPress(e);
      }, delay);
    },
    onPointerMove: (e: React.PointerEvent) => {
      // Cancel if finger moves too much (10px threshold)
      if (!startPos.current) return;
      const dx = Math.abs(e.clientX - startPos.current.x);
      const dy = Math.abs(e.clientY - startPos.current.y);
      if (dx > 10 || dy > 10) clear();
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
  };
}
