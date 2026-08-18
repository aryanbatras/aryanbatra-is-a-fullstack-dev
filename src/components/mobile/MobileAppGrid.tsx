"use client";

import { memo, useCallback, useRef, useState } from "react";
import { Search } from "lucide-react";
import { DESKTOP_APPS } from "@/constants/desktop";
import AppIcon from "@/components/desktop/AppIcon";
import { hapticMedium } from "@/utils/touch";
import styles from "@/styles/components/mobile/MobileAppGrid.module.css";

interface MobileAppGridProps {
  /** Apps to display in the grid (filtered for onDesktop). */
  apps?: typeof DESKTOP_APPS;
  /** Callback when an app icon is tapped. */
  onLaunch: (appId: string) => void;
}

/**
 * iOS-style home screen app grid for mobile.
 * Shows app icons in a 4-column grid with labels, search bar at top.
 * Pull-to-refresh gesture at the top.
 */
const MobileAppGrid = memo(function MobileAppGrid({
  apps = DESKTOP_APPS.filter((a) => a.onDesktop),
  onLaunch,
}: MobileAppGridProps) {
  const [query, setQuery] = useState("");
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = query
    ? DESKTOP_APPS.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.id.toLowerCase().includes(query.toLowerCase()),
      )
    : apps;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (el && el.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) setPullY(Math.min(dy, 80));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullY > 50) {
      hapticMedium();
      setRefreshing(true);
      // Simulate refresh
      setTimeout(() => {
        setRefreshing(false);
        setPullY(0);
      }, 800);
    } else {
      setPullY(0);
    }
    touchStartY.current = null;
  }, [pullY]);

  return (
    <div className={styles.mobileAppGrid} ref={scrollRef}>
      {/* Search bar */}
      {/* <div className={styles.mobileSearchWrap}>
        <Search size={16} className={styles.mobileSearchIcon} />
        <input
          className={styles.mobileSearchInput}
          type="text"
          placeholder="Search apps..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </div> */}

      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && (
        <div
          className={styles.pullRefresh}
          style={{ height: refreshing ? 36 : pullY * 0.5 }}
        >
          <div
            className={`${styles.pullRefreshSpinner} ${refreshing ? styles.pullRefreshSpinning : ""}`}
            style={!refreshing ? { transform: `rotate(${pullY * 3}deg)` } : undefined}
          >
            ↻
          </div>
        </div>
      )}

      {/* App grid */}
      <div
        className={styles.mobileAppGridInner}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={pullY > 0 && !refreshing ? { transform: `translateY(${pullY * 0.3}px)` } : undefined}
      >
        {filtered.map((app) => (
          <button
            key={app.id}
            type="button"
            className={styles.mobileAppGridItem}
            onClick={() => { hapticMedium(); onLaunch(app.id); }}
            aria-label={app.title}
          >
            <span className={styles.mobileAppGridIcon}>
              <AppIcon app={app} size={56} />
            </span>
            <span className={styles.mobileAppGridLabel}>{app.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

export default MobileAppGrid;
