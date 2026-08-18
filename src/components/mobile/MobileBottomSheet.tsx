"use client";

import { useEffect, useRef } from "react";
import styles from "@/styles/components/mobile/MobileBottomSheet.module.css";

interface MobileBottomSheetProps {
  /** Whether the sheet is visible */
  open: boolean;
  /** Close callback */
  onClose: () => void;
  /** Sheet title (optional) */
  title?: string;
  /** Sheet content */
  children: React.ReactNode;
}

/**
 * iOS-style bottom sheet.
 *
 * - Slides up from bottom
 * - Drag handle at top
 * - Dimmed backdrop
 * - Tap backdrop to dismiss
 * - Content scrolls if needed
 */
export default function MobileBottomSheet({
  open,
  onClose,
  title,
  children,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.sheet}
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className={styles.handle} />

        {/* Title */}
        {title && <div className={styles.title}>{title}</div>}

        {/* Content */}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
