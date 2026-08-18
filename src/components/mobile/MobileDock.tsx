"use client";

import { memo, useState } from "react";
import { DESKTOP_APPS } from "@/constants/desktop";
import AppIcon from "@/components/desktop/AppIcon";
import { hapticMedium } from "@/utils/touch";
import styles from "@/styles/components/mobile/MobileDock.module.css";

interface MobileDockProps {
  /** Currently running apps (shown with active dot). */
  runningApps: string[];
  /** Whether the dock is visible (hidden when app is open full-screen). */
  visible?: boolean;
  /** Callback when an app icon is tapped. */
  onLaunch: (appId: string) => void;
  /** Callback when an app should be quit (long-press menu). */
  onQuit?: (appId: string) => void;
  /** Callback to open the app drawer (Launchpad). */
  onAppDrawer?: () => void;
}

/**
 * iOS/macOS-style dock for mobile.
 * Layout: [Terminal, VS Code] — [Finder (big), App Drawer (big)] — [Safari, Settings]
 * Finder and App Drawer are centered and larger.
 */
const MobileDock = memo(function MobileDock({
  runningApps,
  visible = true,
  onLaunch,
  onQuit,
  onAppDrawer,
}: MobileDockProps) {
  // Left group: Terminal, VS Code
  const leftApps = ["terminal", "monaco"];
  // Right group: Safari, Settings
  const rightApps = ["website", "settings"];
  // Center: Finder (always), App Drawer (special button)

  const getApp = (id: string) => DESKTOP_APPS.find((a) => a.id === id);

  const [longPressMenu, setLongPressMenu] = useState<string | null>(null);
  const timerRef = useState<ReturnType<typeof setTimeout> | null>(null);

  const handlePointerDown = (appId: string) => {
    if (!onQuit) return;
    const id = setTimeout(() => setLongPressMenu(appId), 500);
    timerRef[1](id);
  };

  const handlePointerUp = () => {
    if (timerRef[0]) clearTimeout(timerRef[0]);
    timerRef[1](null);
  };

  if (!visible) return null;

  const renderDockItem = (appId: string, size: number = 48) => {
    const app = getApp(appId);
    if (!app) return null;
    const running = runningApps.includes(appId);
    return (
      <button
        key={appId}
        type="button"
        className={styles.mobileDockItem}
        onClick={() => { hapticMedium(); onLaunch(appId); }}
        onPointerDown={() => handlePointerDown(appId)}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label={app.title}
      >
        <span className={styles.mobileDockIconWrap}>
          <AppIcon app={app} size={size} />
          {running && <span className={styles.mobileDockDot} />}
        </span>
        <span className={styles.mobileDockLabel}>{app.title}</span>
      </button>
    );
  };

  return (
    <nav className={styles.mobileDock} role="navigation" aria-label="Dock">
      <div className={styles.mobileDockInner}>
        {/* Left: Terminal, VS Code (smaller) */}
        {leftApps.map((id) => renderDockItem(id, 44))}

        {/* Center divider */}
        <div className={styles.mobileDockDivider} />

        {/* Center: Finder (large) */}
        {renderDockItem("finder", 56)}

        {/* Center: App Drawer (large) */}
        {onAppDrawer && (
          <button
            type="button"
            className={`${styles.mobileDockItem} ${styles.mobileDockAppDrawer}`}
            onClick={() => { hapticMedium(); onAppDrawer(); }}
            aria-label="All Apps"
          >
            <span className={styles.mobileDockIconWrap}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <rect x="4" y="4" width="20" height="20" rx="5" fill="rgba(255,255,255,0.85)" />
                <rect x="32" y="4" width="20" height="20" rx="5" fill="rgba(255,255,255,0.85)" />
                <rect x="4" y="32" width="20" height="20" rx="5" fill="rgba(255,255,255,0.85)" />
                <rect x="32" y="32" width="20" height="20" rx="5" fill="rgba(255,255,255,0.85)" />
              </svg>
            </span>
            <span className={styles.mobileDockLabel}>Apps</span>
          </button>
        )}

        {/* Center divider */}
        <div className={styles.mobileDockDivider} />

        {/* Right: Safari, Settings (smaller) */}
        {rightApps.map((id) => renderDockItem(id, 44))}
      </div>

      {/* Long-press context menu */}
      {longPressMenu && (
        <div className={styles.mobileDockMenu} onClick={() => setLongPressMenu(null)}>
          <div
            className={styles.mobileDockMenuSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.mobileDockMenuHandle} />
            <div className={styles.mobileDockMenuTitle}>
              {DESKTOP_APPS.find((a) => a.id === longPressMenu)?.title}
            </div>
            <button
              type="button"
              className={styles.mobileDockMenuItem}
              onClick={() => { setLongPressMenu(null); onLaunch(longPressMenu); }}
            >
              Open
            </button>
            {runningApps.includes(longPressMenu) && onQuit && (
              <button
                type="button"
                className={`${styles.mobileDockMenuItem} ${styles.mobileDockMenuItemDestructive}`}
                onClick={() => { setLongPressMenu(null); onQuit(longPressMenu); }}
              >
                Quit
              </button>
            )}
            <button
              type="button"
              className={styles.mobileDockMenuCancel}
              onClick={() => setLongPressMenu(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </nav>
  );
});

export default MobileDock;
