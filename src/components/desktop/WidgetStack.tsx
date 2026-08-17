import { useEffect, useState } from "react";
import Glyph from "@/components/desktop/Glyph";
import type { WidgetId, WidgetStyle } from "@/constants/desktop";
import { WIDGET_IDS } from "@/constants/desktop";
import type { WallpaperTint } from "@/hooks/useWallpaperTint";
import useLiveWeather, { WEATHER_DESC } from "@/hooks/useLiveWeather";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface WidgetStackProps {
  /** Tahoe Icon & Widget Style — default glass, solid dark, or wallpaper-tinted. */
  widgetStyle?: WidgetStyle;
  /** Average wallpaper color, for the Tinted style. */
  tint?: WallpaperTint | null;
  /** Smart Stack mode — one card at a time, rotating (Notification Center). */
  smart?: boolean;
  /** Ordered visible widget ids (desktop column). */
  ids?: WidgetId[];
  /** Edit mode — cards show a remove button and drag handle. */
  editing?: boolean;
  onRemove?: (id: WidgetId) => void;
  onReorder?: (from: number, to: number) => void;
}

/** Widget label + icon key, shared by the picker and the cards. */
export const WIDGET_META: Record<WidgetId, { label: string; icon: string }> = {
  clock: { label: "Clock", icon: "clock" },
  weather: { label: "Weather", icon: "cloud-sun" },
  calendar: { label: "Calendar", icon: "calendar" },
};

/**
 * macOS Tahoe widget cards (clock / weather / calendar). Rendered by
 * the desktop column (ordered + editable), the lock-screen widget panel, and
 * the Notification Center Smart Stack. Client-only — live time is
 * hydration-safe because these mount after the desktop boots.
 */
export default function WidgetStack({
  widgetStyle = "default",
  tint = null,
  smart = false,
  ids = [...WIDGET_IDS],
  editing = false,
  onRemove,
  onReorder,
}: WidgetStackProps) {
  const { w: liveWeather, failed: liveWeatherFailed } = useLiveWeather();

  const [now, setNow] = useState(() => new Date());
  // This stack renders both inside DesktopPreview (SSR'd in the machine
  // screen) and inside the desktop after boot — locale-formatted strings
  // differ between Node and the browser, so defer them until after mount.
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragId, setDragId] = useState<WidgetId | null>(null);

  useEffect(() => {
    setMounted(true);
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!smart || paused) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % ids.length), 4000);
    return () => window.clearInterval(id);
  }, [smart, paused, ids.length]);

  // Stable placeholders until mount — identical on server and client, so the
  // preview and the real desktop never mismatch during hydration.
  const time = mounted
    ? now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : "9:41";
  const date = mounted
    ? now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "Friday, January 9";
  const dayNum = mounted ? now.getDate() : 9;
  const monthYear = mounted
    ? now.toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "January 2026";
  const weekday = mounted
    ? now.toLocaleDateString(undefined, { weekday: "long" })
    : "Friday";

  const tintVar = tint
    ? ({ "--widget-tint": `rgba(${tint.r}, ${tint.g}, ${tint.b}, 0.4)` } as React.CSSProperties)
    : undefined;

  const rootClass = `${styles.widgetColumn} ${
    widgetStyle === "dark" ? styles.widgetsDark : ""
  } ${widgetStyle === "tinted" ? styles.widgetsTinted : ""}`;

  const card = (id: WidgetId) => {
    switch (id) {
      case "weather":
        return (
          <div className={styles.widget}>
            <p className={styles.widgetLabel}>Weather</p>
            <div className={styles.widgetWeather}>
              <span className={styles.widgetWeatherIcon}>
                {liveWeather
                  ? (WEATHER_DESC[liveWeather.code] ?? { emoji: "🌡️" }).emoji
                  : liveWeatherFailed
                    ? "—"
                    : "⋯"}
              </span>
              <div>
                <div className={styles.widgetWeatherTemp}>
                  {liveWeather ? `${liveWeather.temp}°` : liveWeatherFailed ? "—" : "…"}
                </div>
                <div className={styles.widgetWeatherDesc}>
                  {liveWeather
                    ? `${(WEATHER_DESC[liveWeather.code] ?? { label: "Weather" }).label} · ${liveWeather.place}`
                    : liveWeatherFailed
                      ? "Offline — no data"
                      : "Loading…"}
                </div>
              </div>
            </div>
          </div>
        );
      case "calendar":
        return (
          <div className={styles.widget}>
            <p className={styles.widgetLabel}>Calendar</p>
            <div className={styles.widgetCalDay}>{dayNum}</div>
            <div className={styles.widgetCalInfo}>
              {weekday} · {monthYear}
            </div>
          </div>
        );
      default:
        return (
          <div className={styles.widget}>
            <p className={styles.widgetLabel}>Clock</p>
            <div className={styles.widgetClockTime}>{time}</div>
            <div className={styles.widgetClockDate}>{date}</div>
          </div>
        );
    }
  };

  if (smart) {
    const visible = ids.length ? ids : [...WIDGET_IDS];
    return (
      <div
        className={`${rootClass} ${styles.widgetStack}`}
        style={tintVar}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <div key={visible[index % visible.length]} className={styles.widgetStackCard}>
          {card(visible[index % visible.length])}
        </div>
        <div className={styles.smartDots}>
          {visible.map((id, i) => (
            <button
              key={id}
              type="button"
              className={`${styles.smartDot} ${
                i === index % visible.length ? styles.smartDotActive : ""
              }`}
              onClick={() => setIndex(i)}
              aria-label={`Show ${id} widget`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass} style={tintVar} data-widget-column>
      {ids.map((id, i) => (
        <div
          key={id}
          className={`${styles.widgetSlot} ${
            dragId === id ? styles.widgetDragging : ""
          }`}
          draggable={editing}
          onDragStart={(e) => {
            setDragId(id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragEnd={() => setDragId(null)}
          onDragOver={(e) => {
            if (!editing || !dragId || dragId === id) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (!editing || !dragId || dragId === id || !onReorder) return;
            onReorder(ids.indexOf(dragId), i);
            setDragId(null);
          }}
        >
          {editing && (
            <button
              type="button"
              className={styles.widgetRemove}
              aria-label={`Remove ${WIDGET_META[id].label} widget`}
              onClick={() => onRemove?.(id)}
            >
              ×
            </button>
          )}
          {editing && (
            <span className={styles.widgetDragHandle} aria-hidden>
              ⠿
            </span>
          )}
          {card(id)}
        </div>
      ))}
    </div>
  );
}
