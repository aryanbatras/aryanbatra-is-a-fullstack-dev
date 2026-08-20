"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { DESKTOP_APPS } from "@/constants/desktop";
import { projects } from "@/data/projects";
import AppIcon from "@/components/desktop/AppIcon";
import { hapticMedium } from "@/utils/touch";
import styles from "@/styles/components/mobile/MobileAppGrid.module.css";

interface MobileAppGridProps {
  /** Apps to display in the grid (filtered for onDesktop). */
  apps?: typeof DESKTOP_APPS;
  /** Callback when an app icon is tapped. */
  onLaunch: (appId: string) => void;
  /** Callback to open a URL in the browser. */
  onOpenUrl?: (url: string, name: string) => void;
}

/**
 * iOS-style home screen app grid for mobile.
 * Shows search bar + welcome header + app icons + page dots + all projects.
 */
const MobileAppGrid = memo(function MobileAppGrid({
  apps = DESKTOP_APPS.filter((a) => a.onDesktop),
  onLaunch,
  onOpenUrl,
}: MobileAppGridProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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
      setTimeout(() => {
        setRefreshing(false);
        setPullY(0);
      }, 800);
    } else {
      setPullY(0);
    }
    touchStartY.current = null;
  }, [pullY]);

  /** Filter apps by search query. */
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return apps;
    const q = searchQuery.toLowerCase();
    return apps.filter((a) => a.title.toLowerCase().includes(q));
  }, [apps, searchQuery]);

  /** All projects with a live URL, sorted newest first. */
  const allProjects = useMemo(
    () =>
      projects
        .filter((p) => p.liveUrl || p.githubUrl)
        .sort((a, b) => (b.sortDate ?? "").localeCompare(a.sortDate ?? "")),
    [],
  );

  return (
    <div className={styles.mobileAppGrid} ref={scrollRef}>
      {/* Welcome header */}
      <div className={styles.welcomeHeader}>
        <img
          src="/aryan/aryan_avatar.jpg"
          alt="Aryan Batra"
          className={styles.welcomeAvatar}
          draggable={false}
        />
        <div className={styles.welcomeText}>
          <h1 className={styles.welcomeName}>Aryan Batra</h1>
          <p className={styles.welcomeTitle}>Software Engineer</p>
        </div>
      </div>

      {/* Search bar — iOS Spotlight style */}
      <div className={`${styles.searchBar} ${searchFocused ? styles.searchBarFocused : ""}`}>
        <Search size={14} className={styles.searchIcon} />
        <input
          ref={searchRef}
          className={styles.searchInput}
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => { if (!searchQuery) setSearchFocused(false); }}
        />
        {searchQuery && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Pull-to-refresh */}
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
        {filteredApps.map((app) => (
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
        {filteredApps.length === 0 && (
          <div className={styles.searchEmpty}>No apps found</div>
        )}
      </div>

      {/* Page dots — iOS style indicator */}
      {!searchQuery && (
        <div className={styles.pageDots}>
          <span className={`${styles.pageDot} ${styles.pageDotActive}`} />
          <span className={styles.pageDot} />
        </div>
      )}

      {/* All Projects — vertical 1-column scrollable list */}
      {!searchQuery && allProjects.length > 0 && (
        <div className={styles.projectsSection}>
          <h2 className={styles.projectsTitle}>Projects</h2>
          <div className={styles.projectsList}>
            {allProjects.map((proj) => (
              <button
                key={proj.id}
                type="button"
                className={styles.projectCard}
                onClick={() => {
                  hapticMedium();
                  const url = proj.liveUrl ?? proj.githubUrl ?? "";
                  if (onOpenUrl) onOpenUrl(url, proj.title);
                  else window.open(url, "_blank");
                }}
              >
                <div className={styles.projectCardBody}>
                  <span className={styles.projectCardTitle}>{proj.title}</span>
                  {proj.shortDescription && (
                    <span className={styles.projectCardTagline}>{proj.shortDescription}</span>
                  )}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className={styles.projectCardTech}>
                      {proj.technologies.slice(0, 4).map((t) => (
                        <span key={t} className={styles.projectCardChip}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" className={styles.projectCardArrow}>
                  <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default MobileAppGrid;
