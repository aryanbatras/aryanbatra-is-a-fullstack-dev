"use client";

import { useEffect, useState } from "react";
import { BatteryFull, Search, Wifi } from "lucide-react";
import { DESKTOP_APPS, WALLPAPERS } from "@/constants/desktop";
import AppIcon from "@/components/desktop/AppIcon";
import Dock from "@/components/desktop/Dock";
import WidgetStack from "@/components/desktop/WidgetStack";
import styles from "@/styles/components/new/DesktopPreview.module.css";

/**
 * The machine's screen — the same macOS Tahoe desktop the OS boots into,
 * rendered statically so the showreel can grow into it: wallpaper, menu bar,
 * desktop icons, widgets and the dock all drawn with the real components
 * (AppIcon, Dock, WidgetStack) and the real default wallpaper. Purely
 * decorative — pointer-events are off until the real desktop takes over.
 */
export default function DesktopPreview() {
  // Apple's classic "9:41" on first paint, then the live clock — avoids any
  // server/client mismatch while still feeling alive.
  const [time, setTime] = useState("9:41");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    tick();
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
  }, []);

  // A curated handful — the machine screen is decorative, and 11 icons would
  // overflow its 16:9 display. Everything is reachable on the real desktop.
  const icons = DESKTOP_APPS.filter((a) => a.onDesktop).slice(0, 6);

  return (
    <div className={styles.preview}>
      <img
        src={WALLPAPERS[0].src}
        alt=""
        aria-hidden
        className={styles.wallpaper}
        draggable={false}
      />

      {/* Menu bar — same translucent glass bar the OS uses. */}
      <div className={styles.menuBar}>
        <span className={styles.appleLogo}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        </span>
        <span className={styles.menuTitle}>Aryan Batra</span>
        <div className={styles.menuRight}>
          <Search className={styles.menuIcon} size={13} aria-hidden />
          <Wifi className={styles.menuIcon} size={14} aria-hidden />
          <BatteryFull className={styles.menuIcon} size={17} aria-hidden />
          <span className={styles.menuTime}>{time}</span>
        </div>
      </div>

      {/* Desktop icons — the same set the real desktop shows. */}
      <div className={styles.icons}>
        {icons.map((app) => (
          <div key={app.id} className={styles.iconTile}>
            <AppIcon app={app} size={44} />
            <span className={styles.iconLabel}>{app.title}</span>
          </div>
        ))}
      </div>

      {/* Widgets — the real glass cards (clock + weather). */}
      <div className={styles.widgets}>
        <WidgetStack widgetStyle="default" tint={null} ids={["clock", "weather"]} />
      </div>

      {/* The real dock, static. */}
      <div className={styles.dockWrap}>
        <Dock
          runningApps={[]}
          minimizedWindows={[]}
          onLaunch={() => {}}
          onQuit={() => {}}
          onRestore={() => {}}
          onEmptyTrash={() => {}}
          onEmptyTrashRequest={() => {}}
          dockSize={44}
          dockMagnify={false}
        />
      </div>
    </div>
  );
}
