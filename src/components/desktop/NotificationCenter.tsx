import { useEffect, useState } from "react";
import { Moon, X } from "lucide-react";
import Glyph from "@/components/desktop/Glyph";
import WidgetStack from "@/components/desktop/WidgetStack";
import useLiveWeather, { WEATHER_DESC } from "@/hooks/useLiveWeather";
import type { WidgetStyle } from "@/constants/desktop";
import type { WallpaperTint } from "@/hooks/useWallpaperTint";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

export interface OsNotification {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  /** Alerts stay on screen until dismissed (Settings → Notifications). */
  persistent?: boolean;
}

interface NotificationCenterProps {
  notifications: OsNotification[];
  dndOn: boolean;
  widgetStyle?: WidgetStyle;
  tint?: WallpaperTint | null;
  onToggleDnd: () => void;
  onDismiss: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

/** Slide-in Notification Center: today's date, a live mini calendar, weather, and notifications. */
export default function NotificationCenter({
  notifications,
  dndOn,
  widgetStyle = "default",
  tint = null,
  onToggleDnd,
  onDismiss,
  onClear,
  onClose,
}: NotificationCenterProps) {
  const { w: weather, failed: weatherFailed } = useLiveWeather();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.ncBackdrop} onClick={onClose}>
      <div className={styles.ncPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.ncScroll}>
          <div className={styles.ncDate}>
            <h3>{dateLabel}</h3>
            <span>{now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
          </div>

          {/* Tahoe Smart Stack — widgets rotate automatically, pause on hover. */}
          <div className={styles.smartStack}>
            <WidgetStack smart widgetStyle={widgetStyle} tint={tint} />
          </div>

          <div className={styles.ncDnd}>
            <span className={styles.ncDndIcon}>
              <Moon size={15} strokeWidth={1.8} />
            </span>
            <span className={styles.ncDndLabel}>Do Not Disturb</span>
            <button
              type="button"
              className={styles.ccToggle}
              onClick={onToggleDnd}
              aria-label="Toggle Do Not Disturb"
            >
              <span className={`${styles.ccThumb} ${dndOn ? styles.ccThumbOn : ""}`} />
            </button>
          </div>

          <div className={styles.ncCard}>
            <div className={styles.ncCardTitle}>
              <strong>{now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
            </div>
            <div className={styles.ncWeek}>
              {WEEKDAYS.map((d, i) => (
                <span key={i} className={styles.ncWeekDay}>
                  {d}
                </span>
              ))}
            </div>
            <div className={styles.ncGrid}>
              {cells.map((day, i) => (
                <span
                  key={i}
                  className={`${styles.ncDay} ${
                    day === today ? styles.ncDayToday : ""
                  } ${day === null ? styles.ncDayEmpty : ""}`}
                >
                  {day ?? ""}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.ncCard}>
            <div className={styles.ncWeather}>
              <span className={styles.ncWeatherIcon}>
                {weather ? (WEATHER_DESC[weather.code] ?? { emoji: "🌡️" }).emoji : weatherFailed ? "—" : "⋯"}
              </span>
              <div>
                <strong>{weather ? `${weather.temp}°` : weatherFailed ? "—" : "…"}</strong>
                <span>
                  {weather
                    ? `${(WEATHER_DESC[weather.code] ?? { label: "Weather" }).label} · ${weather.place}`
                    : weatherFailed
                      ? "Offline — no data"
                      : "Loading…"}
                </span>
              </div>
            </div>
          </div>

          <div className={`${styles.ncCard} ${styles.ncCardList}`}>
            <div className={styles.ncCardTitle}>
              <strong>Notifications</strong>
              {notifications.length > 0 && (
                <button type="button" className={styles.ncClear} onClick={onClear}>
                  Clear All
                </button>
              )}
            </div>
            {notifications.length === 0 && (
              <p className={styles.ncEmpty}>You're all caught up.</p>
            )}
            {notifications.map((n) => (
              <div key={n.id} className={styles.ncNotif}>
                <span className={styles.ncNotifIcon}>
                  <Glyph id={n.icon} size={16} />
                </span>
                <div className={styles.ncNotifText}>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                </div>
                <span className={styles.ncNotifTime}>{n.time}</span>
                <button
                  type="button"
                  className={styles.ncDismiss}
                  onClick={() => onDismiss(n.id)}
                  aria-label="Dismiss notification"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
