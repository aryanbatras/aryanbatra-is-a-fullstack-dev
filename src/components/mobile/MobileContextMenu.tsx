"use client";

import { memo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { hapticMedium } from "@/utils/touch";
import styles from "@/styles/components/mobile/MobileContextMenu.module.css";

export interface ContextMenuItem {
  /** Display label. */
  label: string;
  /** Optional icon (lucide name or emoji). */
  icon?: string;
  /** Whether this is a destructive action (red text). */
  destructive?: boolean;
  /** Whether this item is disabled. */
  disabled?: boolean;
  /** Callback when tapped. */
  onClick: () => void;
}

interface MobileContextMenuProps {
  /** Whether the menu is visible. */
  open: boolean;
  /** Menu title (optional). */
  title?: string;
  /** Items to display. */
  items: ContextMenuItem[];
  /** Called when the menu should close. */
  onClose: () => void;
}

/**
 * iOS-style bottom sheet context menu for mobile.
 * Slides up from the bottom with a drag handle, backdrop, and action items.
 * Replaces right-click / context menu on touch devices.
 */
const MobileContextMenu = memo(function MobileContextMenu({
  open,
  title,
  items,
  onClose,
}: MobileContextMenuProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid the opening tap closing it immediately
    const id = window.setTimeout(() => {
      window.addEventListener("pointerdown", handler);
    }, 100);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointerdown", handler);
    };
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.mobileContextMenuBackdrop}>
      <div
        ref={sheetRef}
        className={styles.mobileContextMenuSheet}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className={styles.mobileContextMenuHandle} />

        {title && (
          <div className={styles.mobileContextMenuTitle}>{title}</div>
        )}

        {/* Action items */}
        <div className={styles.mobileContextMenuItems}>
          {items.map((item, i) => (
            <button
              key={`${item.label}-${i}`}
              type="button"
              className={`${styles.mobileContextMenuItem} ${
                item.destructive ? styles.mobileContextMenuItemDestructive : ""
              } ${item.disabled ? styles.mobileContextMenuItemDisabled : ""}`}
              onClick={() => {
                if (!item.disabled) {
                  hapticMedium();
                  item.onClick();
                  onClose();
                }
              }}
              disabled={item.disabled}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <div className={styles.mobileContextMenuCancel}>
          <button
            type="button"
            className={styles.mobileContextMenuCancelBtn}
            onClick={() => { hapticMedium(); onClose(); }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

export default MobileContextMenu;
