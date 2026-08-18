"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "@/styles/components/mobile/MobileNavBar.module.css";

interface MobileNavBarProps {
  /** Large title text (shown when scrolled to top) */
  title: string;
  /** Whether to show a back button */
  showBack?: boolean;
  /** Back button callback */
  onBack?: () => void;
  /** Right-side action buttons */
  actions?: ReactNode;
  /** Scroll container to observe for collapse */
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  /** Whether this is the root screen (no back button) */
  isRoot?: boolean;
}

/**
 * iOS-style collapsible navigation bar.
 *
 * - Large title (34pt, bold) when scrolled to top
 * - Collapses to small title (17pt) on scroll
 * - Back button: chevron + previous screen title
 * - Right actions: icons
 * - Liquid Glass background (translucent, blurred)
 * - Safe area padding for notch
 */
export default function MobileNavBar({
  title,
  showBack = false,
  onBack,
  actions,
  scrollRef,
  isRoot = false,
}: MobileNavBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;
    const handler = () => {
      setCollapsed(el.scrollTop > 10);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [scrollRef]);

  return (
    <div
      className={`${styles.navBar} ${collapsed ? styles.navBarCollapsed : ""}`}
      ref={navRef}
    >
      <div className={styles.navBarInner}>
        {/* Left side: back button or spacer */}
        <div className={styles.navLeft}>
          {showBack && onBack && (
            <button
              type="button"
              className={styles.backButton}
              onClick={onBack}
              aria-label="Go back"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
              <span className={styles.backLabel}>Back</span>
            </button>
          )}
        </div>

        {/* Center: title */}
        <div className={styles.navCenter}>
          <span className={`${styles.largeTitle} ${collapsed ? styles.largeTitleHidden : ""}`}>
            {title}
          </span>
          <span className={`${styles.smallTitle} ${collapsed ? styles.smallTitleVisible : ""}`}>
            {title}
          </span>
        </div>

        {/* Right: actions */}
        <div className={styles.navRight}>
          {actions}
        </div>
      </div>
    </div>
  );
}
