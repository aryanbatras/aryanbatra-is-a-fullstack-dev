"use client";

import { memo } from "react";
import styles from "@/styles/components/mobile/MobileTabBar.module.css";

export interface TabItem {
  id: string;
  label: string;
  /** Lucide icon name or SVG path */
  icon: React.ReactNode;
  /** Badge count (optional) */
  badge?: number;
}

interface MobileTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * iOS-style bottom tab bar.
 *
 * - Always visible (never hides on scroll)
 * - 56px height + safe area padding
 * - Liquid Glass background (translucent, blurred)
 * - Active tab: filled icon + accent color label
 * - Inactive tab: outline icon + gray label
 * - Touch target: minimum 44×44pt
 * - Badge: red circle with count
 */
const MobileTabBar = memo(function MobileTabBar({
  tabs,
  activeTab,
  onTabChange,
}: MobileTabBarProps) {
  return (
    <div className={styles.tabBar}>
      <div className={styles.tabBarInner}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              aria-selected={isActive}
              role="tab"
            >
              <span className={styles.tabIcon}>
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={styles.tabBadge}>{tab.badge > 99 ? "99+" : tab.badge}</span>
                )}
              </span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default MobileTabBar;
