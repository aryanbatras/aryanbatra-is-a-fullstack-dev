"use client";

import { type ReactNode } from "react";
import styles from "@/styles/components/mobile/MobileCard.module.css";

interface MobileCardProps {
  /** Card title */
  title: string;
  /** Card subtitle / description */
  subtitle?: string;
  /** Left icon or image */
  icon?: ReactNode;
  /** Right action or badge */
  badge?: ReactNode;
  /** Tap callback */
  onTap?: () => void;
  /** Children content */
  children?: ReactNode;
  /** Card variant */
  variant?: "default" | "featured" | "compact";
}

/**
 * iOS-style card for featured content (projects, resume highlights, etc.)
 *
 * - Rounded rectangle (12pt corner radius)
 * - Subtle background
 * - Touch feedback on press
 * - Supports icon, title, subtitle, badge, and custom content
 */
export default function MobileCard({
  title,
  subtitle,
  icon,
  badge,
  onTap,
  children,
  variant = "default",
}: MobileCardProps) {
  const Tag = onTap ? "button" : "div";

  return (
    <Tag
      className={`${styles.card} ${styles[`card_${variant}`]} ${
        onTap ? styles.cardInteractive : ""
      }`}
      onClick={onTap}
      type={onTap ? "button" : undefined}
    >
      <div className={styles.cardHeader}>
        {icon && <span className={styles.cardIcon}>{icon}</span>}
        <div className={styles.cardContent}>
          <span className={styles.cardTitle}>{title}</span>
          {subtitle && <span className={styles.cardSubtitle}>{subtitle}</span>}
        </div>
        {badge && <span className={styles.cardBadge}>{badge}</span>}
      </div>
      {children && <div className={styles.cardBody}>{children}</div>}
    </Tag>
  );
}
