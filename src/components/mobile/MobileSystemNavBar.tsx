"use client";

import { memo } from "react";
import { hapticLight } from "@/utils/touch";
import styles from "@/styles/components/mobile/MobileSystemNavBar.module.css";

interface MobileSystemNavBarProps {
  /** Go back / close current app. */
  onBack: () => void;
  /** Go to home screen (close all apps). */
  onHome: () => void;
  /** Show recent apps (mission control or app switcher). */
  onRecent: () => void;
}

/**
 * Android-style system navigation bar.
 * Always visible at the very bottom of the screen on mobile.
 * Provides Back (◁), Home (○), and Recent (□) buttons.
 * Separated from the app dock — this is the OS-level navigation.
 */
const MobileSystemNavBar = memo(function MobileSystemNavBar({
  onBack,
  onHome,
  onRecent,
}: MobileSystemNavBarProps) {
  return (
    <nav className={styles.systemNavBar} aria-label="System navigation">
      <button
        type="button"
        className={styles.navButton}
        onClick={() => { hapticLight(); onBack(); }}
        aria-label="Back"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="11 4 6 9 11 14" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.navButton}
        onClick={() => { hapticLight(); onHome(); }}
        aria-label="Home"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="9" r="6" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.navButton}
        onClick={() => { hapticLight(); onRecent(); }}
        aria-label="Recent apps"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="10" height="10" rx="1.5" />
        </svg>
      </button>
    </nav>
  );
});

export default MobileSystemNavBar;
