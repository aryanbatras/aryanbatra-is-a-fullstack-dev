"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Wifi, Battery, Settings } from "lucide-react";
import { hapticLight } from "@/utils/touch";
import styles from "@/styles/components/mobile/MobileStatusBar.module.css";

interface MobileStatusBarProps {
  /** Open system settings. */
  onSettings?: () => void;
  /** Open notification center (swipe down on status bar). */
  onNotifications?: () => void;
}

/**
 * iOS-style status bar for mobile.
 * Fully transparent — no background, no blur, no borders.
 * Large icons and text for native feel.
 */
const MobileStatusBar = memo(function MobileStatusBar({
  onSettings,
  onNotifications,
}: MobileStatusBarProps) {
  const [time, setTime] = useState(() => new Date());
  const touchY = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const clockStr = time.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    touchY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchY.current === null) return;
    const dy = e.changedTouches[0].clientY - touchY.current;
    touchY.current = null;
    if (dy > 30 && onNotifications) { hapticLight(); onNotifications(); }
  };

  return (
    <div
      className={styles.mobileStatusBar}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <span className={styles.mobileStatusTime}>{clockStr}</span>
      <div className={styles.mobileStatusRight}>
        <Wifi size={18} strokeWidth={2.2} />
        <Battery size={22} strokeWidth={2} />
        {onNotifications && (
          <button
            type="button"
            className={styles.mobileStatusSettings}
            onClick={onNotifications}
            aria-label="Notifications"
          >
            <svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6a4 4 0 0 0-8 0c0 4-2 5-2 5h12s-2-1-2-5" />
              <path d="M9.15 13a2 2 0 0 1-3.3 0" />
            </svg>
          </button>
        )}
        {onSettings && (
          <button
            type="button"
            className={styles.mobileStatusSettings}
            onClick={onSettings}
            aria-label="Settings"
          >
            <Settings size={20} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
});

export default MobileStatusBar;
