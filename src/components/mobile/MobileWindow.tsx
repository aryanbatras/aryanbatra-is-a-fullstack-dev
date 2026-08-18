"use client";

import { type ReactNode } from "react";
import { X, ChevronLeft } from "lucide-react";
import styles from "@/styles/components/mobile/MobileWindow.module.css";

interface MobileWindowProps {
  /** App title shown in the nav bar. */
  title: string;
  /** Content to render inside the window. */
  children: ReactNode;
  /** Called when the user taps the close/back button. */
  onClose: () => void;
  /** Optional right-side action button. */
  rightAction?: ReactNode;
}

/**
 * iOS-style full-screen window for mobile.
 * No window chrome — just a nav bar at top and the content filling the rest.
 */
export default function MobileWindow({
  title,
  children,
  onClose,
  rightAction,
}: MobileWindowProps) {
  return (
    <div className={styles.mobileWindow}>
      {/* iOS-style status/nav bar */}
      <div className={styles.mobileNavBar}>
        <button
          type="button"
          className={styles.mobileNavBack}
          onClick={onClose}
          aria-label="Close"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
          <span>Back</span>
        </button>
        <span className={styles.mobileNavTitle}>{title}</span>
        <div className={styles.mobileNavRight}>
          {rightAction ?? <span style={{ width: 60 }} />}
        </div>
      </div>
      {/* Full-height content area */}
      <div className={styles.mobileWindowContent}>{children}</div>
    </div>
  );
}
