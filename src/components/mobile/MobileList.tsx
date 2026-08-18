"use client";

import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import styles from "@/styles/components/mobile/MobileList.module.css";

export interface ListItem {
  id: string;
  /** Left icon (optional) */
  icon?: ReactNode;
  /** Primary label */
  label: string;
  /** Secondary text (below label) */
  subtitle?: string;
  /** Right value text (before chevron) */
  value?: string;
  /** Right chevron (means "tap to navigate") */
  chevron?: boolean;
  /** Right control (toggle, switch, etc.) */
  control?: ReactNode;
  /** Tap callback */
  onTap?: () => void;
  /** Whether the row is destructive (red text) */
  destructive?: boolean;
  /** Whether the row is disabled */
  disabled?: boolean;
}

export interface ListSection {
  /** Section header text (13pt, uppercase, gray) */
  header?: string;
  /** Section footer text */
  footer?: string;
  /** Items in this section */
  items: ListItem[];
}

interface MobileListProps {
  sections: ListSection[];
  /** Extra content after all sections */
  children?: ReactNode;
}

/**
 * iOS-style grouped list.
 *
 * - Rounded rectangle sections (10pt corner radius)
 * - Section headers: 13pt, uppercase, gray
 * - Rows: 44pt height, icon + label + value/chevron
 * - Disclosure indicator: chevron on right
 * - Touch target: minimum 44pt
 * - Press feedback: background darkens
 */
export default function MobileList({ sections, children }: MobileListProps) {
  return (
    <div className={styles.listContainer}>
      {sections.map((section, si) => (
        <div key={si} className={styles.section}>
          {section.header && (
            <div className={styles.sectionHeader}>{section.header}</div>
          )}
          <div className={styles.sectionBody}>
            {section.items.map((item, ii) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.row} ${
                  item.destructive ? styles.rowDestructive : ""
                } ${item.disabled ? styles.rowDisabled : ""} ${
                  ii < section.items.length - 1 ? styles.rowBorder : ""
                }`}
                onClick={item.onTap}
                disabled={item.disabled}
              >
                {/* Left icon */}
                {item.icon && (
                  <span className={styles.rowIcon}>{item.icon}</span>
                )}

                {/* Label + subtitle */}
                <div className={styles.rowContent}>
                  <span className={styles.rowLabel}>{item.label}</span>
                  {item.subtitle && (
                    <span className={styles.rowSubtitle}>{item.subtitle}</span>
                  )}
                </div>

                {/* Right value */}
                {item.value && (
                  <span className={styles.rowValue}>{item.value}</span>
                )}

                {/* Right control */}
                {item.control}

                {/* Chevron */}
                {item.chevron && (
                  <ChevronRight
                    size={16}
                    strokeWidth={2}
                    className={styles.rowChevron}
                  />
                )}
              </button>
            ))}
          </div>
          {section.footer && (
            <div className={styles.sectionFooter}>{section.footer}</div>
          )}
        </div>
      ))}
      {children}
    </div>
  );
}
