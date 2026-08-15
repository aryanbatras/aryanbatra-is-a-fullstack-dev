"use client";

import { useState } from "react";
import {
  BatteryFull,
  Check,
  Moon,
  PanelsTopLeft,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import useSystemInfo, { formatBytes } from "@/hooks/useSystemInfo";
import {
  DEFAULT_NOTIF_PREF,
  WALLPAPERS,
  type ClockStyle,
  type HotCornerAction,
  type NotifPref,
  type SystemState,
} from "@/constants/desktop";
import styles from "@/styles/components/desktop/apps.module.css";

interface SettingsAppProps {
  system: SystemState;
  onSystemChange: (patch: Partial<SystemState>) => void;
  wallpaperIndex: number;
  onWallpaper: (index: number) => void;
  onAbout: () => void;
}

/** Apps that can send notifications, as listed in Settings → Notifications. */
const NOTIF_APPS = [
  { id: "finder", name: "Finder", icon: "🗂️" },
  { id: "settings", name: "System Settings", icon: "⚙️" },
  { id: "safari", name: "Safari", icon: "🧭" },
  { id: "messages", name: "Messages", icon: "💬" },
  { id: "calendar", name: "Calendar", icon: "📅" },
  { id: "notes", name: "Notes", icon: "📝" },
];

const NOTIF_STYLES: Array<{ id: NotifPref["style"]; label: string }> = [
  { id: "none", label: "None" },
  { id: "banners", label: "Banners" },
  { id: "alerts", label: "Alerts" },
];

const HOT_CORNER_OPTIONS: Array<{ value: HotCornerAction; label: string }> = [
  { value: "none", label: "None" },
  { value: "mission-control", label: "Mission Control" },
  { value: "launchpad", label: "Launchpad" },
  { value: "show-desktop", label: "Show Desktop" },
  { value: "lock", label: "Lock Screen" },
  { value: "screensaver", label: "Screen Saver" },
  { value: "next-space", label: "Next Space" },
  { value: "prev-space", label: "Previous Space" },
];

const CORNERS: Array<[string, string]> = [
  ["tl", "Top Left"],
  ["tr", "Top Right"],
  ["bl", "Bottom Left"],
  ["br", "Bottom Right"],
];

export default function SettingsApp({
  system,
  onSystemChange,
  wallpaperIndex,
  onWallpaper,
  onAbout,
}: SettingsAppProps) {
  const [pane, setPane] = useState("network");
  const real = useSystemInfo();

  const {
    soundOn,
    volume,
    brightness,
    darkMode,
    clockStyle,
    reduceTransparency,
    showWidgets,
    widgetStyle,
    dockSize,
    dockMagnify,
    dockMagnifySize,
    dockPosition,
    minimizeEffect,
    dockAutoHide,
    stageManager,
    showBatteryPct,
    screensaverStyle,
    screensaverDelay,
    notifPrefs,
    hotCorners,
  } = system;

  const CLOCK_STYLES: Array<{ id: ClockStyle; label: string }> = [
    { id: "default", label: "Default" },
    { id: "numeric", label: "Numeric" },
    { id: "analog", label: "Analog" },
    { id: "world", label: "World" },
  ];

  const sections: Array<{ id: string; label: string; icon: React.ReactNode }> = [
    {
      id: "network",
      label: "Wi-Fi",
      icon: real.online ? <Wifi size={15} /> : <WifiOff size={15} />,
    },
    {
      id: "sound",
      label: "Sound",
      icon: soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />,
    },
    { id: "displays", label: "Displays", icon: <Sun size={15} /> },
    { id: "wallpaper", label: "Wallpaper", icon: <span>🖼️</span> },
    { id: "desktop-dock", label: "Desktop & Dock", icon: <PanelsTopLeft size={15} /> },
    { id: "storage", label: "Storage", icon: <span>💾</span> },
    { id: "battery", label: "Battery", icon: <BatteryFull size={15} /> },
    { id: "notifications", label: "Notifications", icon: <span>🔔</span> },
    { id: "accessibility", label: "Accessibility", icon: <span>♿</span> },
    { id: "about", label: "About", icon: <span>ℹ️</span> },
  ];

  /* ---- real data helpers ---- */

  const connLabel = (() => {
    const n = real.network;
    if (!real.online) return "Offline";
    if (!n) return "Connected";
    const type =
      n.effectiveType === "4g"
        ? "4G / LTE"
        : n.effectiveType === "3g"
          ? "3G"
          : n.effectiveType === "2g"
            ? "2G"
            : n.effectiveType === "slow-2g"
              ? "Slow 2G"
              : n.effectiveType;
    return `Connected · ${type}${n.downlink ? ` · ${n.downlink} Mbps` : ""}`;
  })();

  const batteryPct =
    real.battery != null ? Math.round(real.battery.level * 100) : null;

  const storagePct =
    real.storage && real.storage.quota > 0
      ? Math.min(100, (real.storage.usage / real.storage.quota) * 100)
      : 0;

  return (
    <div className={styles.settings}>
      <div className={styles.settingsSidebar}>
        <div className={styles.settingsSidebarTitle}>System Settings</div>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`${styles.settingsItem} ${
              pane === s.id ? styles.settingsItemActive : ""
            }`}
            onClick={() => setPane(s.id)}
          >
            {s.icon}
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.settingsContent}>
        {pane === "network" && (
          <>
            <h2>Wi-Fi</h2>
            <p className={styles.settingsSub}>Real network status from this browser</p>
            <div className={styles.battHealthCard}>
              <div className={styles.battHealthTop}>
                <span className={styles.battHealthLabel}>
                  {real.online ? "Connected" : "Not connected"}
                </span>
                <span className={styles.battHealthState}>
                  {real.online ? "Online" : "Offline"}
                </span>
              </div>
              <p className={styles.battHealthMeta}>{connLabel}</p>
            </div>
            {real.network && (
              <div className={styles.settingsList}>
                <div className={styles.storageItem}>
                  <span className={styles.storageName}>Connection type</span>
                  <span className={styles.storageSize}>{real.network.effectiveType}</span>
                </div>
                <div className={styles.storageItem}>
                  <span className={styles.storageName}>Downlink</span>
                  <span className={styles.storageSize}>
                    {real.network.downlink ? `${real.network.downlink} Mbps` : "—"}
                  </span>
                </div>
                <div className={styles.storageItem}>
                  <span className={styles.storageName}>Round-trip time</span>
                  <span className={styles.storageSize}>
                    {real.network.rtt ? `${real.network.rtt} ms` : "—"}
                  </span>
                </div>
              </div>
            )}
            <p className={styles.settingsSub} style={{ marginTop: 12 }}>
              Web pages can&apos;t see or control your Wi-Fi networks — this is
              the actual connection your browser reports.
            </p>
          </>
        )}

        {pane === "sound" && (
          <>
            <h2>Sound</h2>
            <p className={styles.settingsSub}>Output volume and effects</p>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Output volume</span>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                className={styles.settingsSlider}
                onChange={(e) => onSystemChange({ volume: Number(e.target.value) })}
                aria-label="Output volume"
              />
              <span className={styles.settingsRowStatus}>{volume}%</span>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Play sound effects</span>
              <button
                type="button"
                className={`${styles.setToggle} ${soundOn ? styles.setToggleOn : ""}`}
                onClick={() => onSystemChange({ soundOn: !soundOn })}
                aria-label="Toggle sound effects"
              >
                <span className={`${styles.setThumb} ${soundOn ? styles.setThumbOn : ""}`} />
              </button>
            </div>
          </>
        )}

        {pane === "displays" && (
          <>
            <h2>Displays</h2>
            <p className={styles.settingsSub}>Built-in Liquid Glass display</p>
            <div className={styles.battHealthCard}>
              <div className={styles.battHealthTop}>
                <span className={styles.battHealthLabel}>Display</span>
                <span className={styles.battHealthState}>
                  {real.screen.width && real.screen.height
                    ? `${real.screen.width} × ${real.screen.height}`
                    : "—"}
                </span>
              </div>
              <p className={styles.battHealthMeta}>
                {real.screen.dpr ? `${real.screen.dpr}× pixel ratio` : ""}
                {real.gpu ? ` · ${real.gpu}` : ""}
              </p>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Brightness</span>
              <input
                type="range"
                min={0}
                max={100}
                value={brightness}
                className={styles.settingsSlider}
                onChange={(e) => onSystemChange({ brightness: Number(e.target.value) })}
                aria-label="Brightness"
              />
              <span className={styles.settingsRowStatus}>{brightness}%</span>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Appearance</span>
              <button
                type="button"
                className={`${styles.setToggle} ${darkMode ? styles.setToggleOn : ""}`}
                onClick={() => onSystemChange({ darkMode: !darkMode })}
                aria-label="Toggle appearance"
              >
                <span className={`${styles.setThumb} ${darkMode ? styles.setThumbOn : ""}`} />
              </button>
            </div>
          </>
        )}

        {pane === "wallpaper" && (
          <>
            <h2>Wallpaper</h2>
            <p className={styles.settingsSub}>Choose a look for your desktop</p>
            <div className={styles.settingsThumbs}>
              {WALLPAPERS.map((wp, i) => (
                <button
                  key={wp.id}
                  type="button"
                  className={`${styles.settingsThumb} ${
                    i === wallpaperIndex ? styles.settingsThumbActive : ""
                  }`}
                  onClick={() => onWallpaper(i)}
                >
                  <span
                    className={styles.settingsThumbArt}
                    style={{
                      backgroundImage: `url(${wp.src})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <span className={styles.settingsThumbName}>{wp.name}</span>
                </button>
              ))}
            </div>

            <div className={styles.settingsSectionGap} />
            <h3 className={styles.settingsSectionTitle}>Clock Appearance</h3>
            <div className={styles.segmented}>
              {CLOCK_STYLES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.segmentedItem} ${
                    clockStyle === c.id ? styles.segmentedItemActive : ""
                  }`}
                  onClick={() => onSystemChange({ clockStyle: c.id })}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Desktop Widgets</span>
              <button
                type="button"
                className={`${styles.setToggle} ${showWidgets ? styles.setToggleOn : ""}`}
                onClick={() => onSystemChange({ showWidgets: !showWidgets })}
                aria-label="Toggle desktop widgets"
              >
                <span className={`${styles.setThumb} ${showWidgets ? styles.setThumbOn : ""}`} />
              </button>
            </div>

            <div className={styles.settingsSectionGap} />
            <h3 className={styles.settingsSectionTitle}>Icon &amp; Widget Style</h3>
            <div className={styles.segmented}>
              {(
                [
                  { id: "default", label: "Default" },
                  { id: "dark", label: "Dark" },
                  { id: "tinted", label: "Tinted" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`${styles.segmentedItem} ${
                    widgetStyle === s.id ? styles.segmentedItemActive : ""
                  }`}
                  onClick={() => onSystemChange({ widgetStyle: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className={styles.settingsSub}>Tinted matches widgets to your wallpaper.</p>
          </>
        )}

        {pane === "desktop-dock" && (
          <>
            <h2>Desktop &amp; Dock</h2>
            <p className={styles.settingsSub}>Dock</p>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Size</span>
              <input
                type="range"
                min={36}
                max={72}
                value={dockSize}
                className={styles.settingsSlider}
                onChange={(e) => onSystemChange({ dockSize: Number(e.target.value) })}
                aria-label="Dock size"
              />
              <span className={styles.settingsRowStatus}>{dockSize}px</span>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Magnification</span>
              <button
                type="button"
                className={`${styles.setToggle} ${dockMagnify ? styles.setToggleOn : ""}`}
                onClick={() => onSystemChange({ dockMagnify: !dockMagnify })}
                aria-label="Toggle magnification"
              >
                <span className={`${styles.setThumb} ${dockMagnify ? styles.setThumbOn : ""}`} />
              </button>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Magnified size</span>
              <input
                type="range"
                min={64}
                max={120}
                value={dockMagnifySize}
                className={styles.settingsSlider}
                disabled={!dockMagnify}
                onChange={(e) => onSystemChange({ dockMagnifySize: Number(e.target.value) })}
                aria-label="Magnified dock size"
              />
              <span className={styles.settingsRowStatus}>{dockMagnifySize}px</span>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Position on screen</span>
              <div className={styles.segmented}>
                {(
                  [
                    { id: "bottom", label: "Bottom" },
                    { id: "left", label: "Left" },
                    { id: "right", label: "Right" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`${styles.segmentedItem} ${
                      dockPosition === p.id ? styles.segmentedItemActive : ""
                    }`}
                    onClick={() => onSystemChange({ dockPosition: p.id })}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Minimize windows using</span>
              <div className={styles.segmented}>
                {(
                  [
                    { id: "genie", label: "Genie" },
                    { id: "scale", label: "Scale" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`${styles.segmentedItem} ${
                      minimizeEffect === m.id ? styles.segmentedItemActive : ""
                    }`}
                    onClick={() => onSystemChange({ minimizeEffect: m.id })}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>
                Automatically hide and show the Dock
              </span>
              <button
                type="button"
                className={`${styles.setToggle} ${dockAutoHide ? styles.setToggleOn : ""}`}
                onClick={() => onSystemChange({ dockAutoHide: !dockAutoHide })}
                aria-label="Toggle auto-hide dock"
              >
                <span className={`${styles.setThumb} ${dockAutoHide ? styles.setThumbOn : ""}`} />
              </button>
            </div>

            <div className={styles.settingsSectionGap} />
            <h3 className={styles.settingsSectionTitle}>Windows</h3>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>
                Stage Manager
                <span className={styles.settingsRowHint}>
                  Keep the current app front and center
                </span>
              </span>
              <button
                type="button"
                className={`${styles.setToggle} ${stageManager ? styles.setToggleOn : ""}`}
                onClick={() => onSystemChange({ stageManager: !stageManager })}
                aria-label="Toggle Stage Manager"
              >
                <span className={`${styles.setThumb} ${stageManager ? styles.setThumbOn : ""}`} />
              </button>
            </div>

            <div className={styles.settingsSectionGap} />
            <h3 className={styles.settingsSectionTitle}>Screen Saver</h3>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Start after</span>
              <div className={styles.segmented}>
                {(
                  [
                    { id: 0, label: "Never" },
                    { id: 1, label: "1 min" },
                    { id: 5, label: "5 min" },
                    { id: 10, label: "10 min" },
                    { id: 15, label: "15 min" },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`${styles.segmentedItem} ${
                      screensaverDelay === d.id ? styles.segmentedItemActive : ""
                    }`}
                    onClick={() => onSystemChange({ screensaverDelay: d.id })}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>Style</span>
              <div className={styles.segmented}>
                {(
                  [
                    { id: "flurry", label: "Flurry" },
                    { id: "aerial", label: "Aerial" },
                    { id: "clock", label: "Clock" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.segmentedItem} ${
                      screensaverStyle === s.id ? styles.segmentedItemActive : ""
                    }`}
                    onClick={() => onSystemChange({ screensaverStyle: s.id })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.settingsSectionGap} />
            <h3 className={styles.settingsSectionTitle}>Hot Corners</h3>
            <p className={styles.settingsSub}>
              Move the pointer to a corner of the screen to trigger an action
            </p>
            <div className={styles.hcGrid}>
              {CORNERS.map(([corner, label]) => (
                <div key={corner} className={styles.hcItem}>
                  <span className={styles.hcLabel}>{label}</span>
                  <select
                    className={styles.hcSelect}
                    value={hotCorners[corner as keyof typeof hotCorners] ?? "none"}
                    onChange={(e) =>
                      onSystemChange({
                        hotCorners: {
                          ...hotCorners,
                          [corner]: e.target.value as HotCornerAction,
                        },
                      })
                    }
                    aria-label={`${label} hot corner`}
                  >
                    {HOT_CORNER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        {pane === "storage" && (
          <>
            <h2>Storage</h2>
            <p className={styles.settingsSub}>
              Real storage this site uses in your browser
            </p>
            {real.storage ? (
              <>
                <div className={styles.storageBar}>
                  <span
                    className={styles.storageBarSeg}
                    style={{ width: `${storagePct}%`, background: "#0a84ff" }}
                  />
                </div>
                <div className={styles.storageList}>
                  <div className={styles.storageItem}>
                    <span className={styles.storageDot} style={{ background: "#0a84ff" }} />
                    <span className={styles.storageName}>Used</span>
                    <span className={styles.storageSize}>
                      {formatBytes(real.storage.usage)}
                    </span>
                  </div>
                  <div className={styles.storageItem}>
                    <span className={styles.storageDot} style={{ background: "#8e8e93" }} />
                    <span className={styles.storageName}>Quota</span>
                    <span className={styles.storageSize}>
                      {formatBytes(real.storage.quota)}
                    </span>
                  </div>
                </div>
                <p className={styles.settingsSub}>
                  Browsers give each site a storage quota. This is the actual
                  amount this portfolio has been granted and currently uses.
                </p>
              </>
            ) : (
              <p className={styles.settingsSub}>Storage estimate unavailable in this browser.</p>
            )}
          </>
        )}

        {pane === "battery" && (
          <>
            <h2>Battery</h2>
            <p className={styles.settingsSub}>Real battery from the Battery API</p>
            <div className={styles.battHealthCard}>
              <div className={styles.battHealthTop}>
                <span className={styles.battHealthLabel}>
                  {real.battery?.charging ? "Charging" : "Battery"}
                </span>
                <span className={styles.battHealthState}>
                  {batteryPct != null ? `${batteryPct}%` : "Unavailable"}
                </span>
              </div>
              <p className={styles.battHealthMeta}>
                {real.battery?.charging
                  ? real.battery.chargingTime !== Infinity && real.battery.chargingTime > 0
                    ? `Fully charged in ~${Math.round(real.battery.chargingTime / 60)} min`
                    : "On power"
                  : real.battery && real.battery.dischargingTime !== Infinity && real.battery.dischargingTime > 0
                    ? `~${Math.round(real.battery.dischargingTime / 60)} min remaining`
                    : "This device's battery status"}
              </p>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>
                Show percentage in menu bar
              </span>
              <button
                type="button"
                className={`${styles.setToggle} ${showBatteryPct ? styles.setToggleOn : ""}`}
                onClick={() => onSystemChange({ showBatteryPct: !showBatteryPct })}
                aria-label="Toggle battery percentage"
              >
                <span className={`${styles.setThumb} ${showBatteryPct ? styles.setThumbOn : ""}`} />
              </button>
            </div>
            <p className={styles.settingsSub}>
              {real.battery == null
                ? "This browser/device doesn't expose battery data, so the menu bar shows the real value when available."
                : "Battery level and charging state come from your actual device."}
            </p>
          </>
        )}

        {pane === "notifications" && (
          <>
            <h2>Notifications</h2>
            <p className={styles.settingsSub}>
              Choose how each app alerts you when unlocked
            </p>
            <div className={styles.notifList}>
              {NOTIF_APPS.map((app) => {
                const pref: NotifPref = notifPrefs[app.id] ?? DEFAULT_NOTIF_PREF;
                const setPref = (patch: Partial<NotifPref>) =>
                  onSystemChange({
                    notifPrefs: {
                      ...notifPrefs,
                      [app.id]: { ...pref, ...patch },
                    },
                  });
                return (
                  <div key={app.id} className={styles.notifApp}>
                    <div className={styles.notifAppHeader}>
                      <span className={styles.notifAppIcon}>{app.icon}</span>
                      <span className={styles.notifAppName}>{app.name}</span>
                      <button
                        type="button"
                        className={`${styles.setToggle} ${
                          pref.allow ? styles.setToggleOn : ""
                        }`}
                        onClick={() => setPref({ allow: !pref.allow })}
                        aria-label={`Allow notifications from ${app.name}`}
                      >
                        <span
                          className={`${styles.setThumb} ${
                            pref.allow ? styles.setThumbOn : ""
                          }`}
                        />
                      </button>
                    </div>
                    <div
                      className={`${styles.notifStyleRow} ${
                        pref.allow ? "" : styles.notifStyleRowDisabled
                      }`}
                    >
                      <span className={styles.notifStyleLabel}>
                        Alert style when unlocked
                      </span>
                      <div className={styles.segmented}>
                        {NOTIF_STYLES.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className={`${styles.segmentedItem} ${
                              pref.style === s.id ? styles.segmentedItemActive : ""
                            }`}
                            disabled={!pref.allow}
                            onClick={() => setPref({ style: s.id })}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {pane === "accessibility" && (
          <>
            <h2>Accessibility</h2>
            <p className={styles.settingsSub}>Display</p>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>
                Reduce Transparency
                <span className={styles.settingsRowHint}>
                  Replaces Liquid Glass with solid fills
                </span>
              </span>
              <button
                type="button"
                className={`${styles.setToggle} ${
                  reduceTransparency ? styles.setToggleOn : ""
                }`}
                onClick={() =>
                  onSystemChange({ reduceTransparency: !reduceTransparency })
                }
                aria-label="Toggle reduce transparency"
              >
                <span
                  className={`${styles.setThumb} ${
                    reduceTransparency ? styles.setThumbOn : ""
                  }`}
                />
              </button>
            </div>
          </>
        )}

        {pane === "about" && (
          <>
            <h2>About</h2>
            <p className={styles.settingsSub}>This Mac — real hardware, read from the browser</p>
            <div className={styles.settingsAbout}>
              <div className={styles.settingsAboutIcon}>
                <svg width="46" height="46" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </div>
              <div className={styles.settingsAboutRows}>
                <div className={styles.settingsAboutRow}>
                  <span>Name</span>
                  <strong>Aryan OS — Portfolio Edition</strong>
                </div>
                <div className={styles.settingsAboutRow}>
                  <span>Platform</span>
                  <strong>
                    {real.platform}
                    {real.platformVersion ? ` ${real.platformVersion}` : ""}
                  </strong>
                </div>
                <div className={styles.settingsAboutRow}>
                  <span>Processor</span>
                  <strong>
                    {real.cpuCores != null
                      ? `${real.cpuCores} ${real.cpuCores === 1 ? "core" : "cores"}`
                      : "Not reported"}
                  </strong>
                </div>
                <div className={styles.settingsAboutRow}>
                  <span>Memory</span>
                  <strong>
                    {real.memoryGB != null ? `${real.memoryGB} GB` : "Not reported"}
                  </strong>
                </div>
                <div className={styles.settingsAboutRow}>
                  <span>Graphics</span>
                  <strong>{real.gpu ?? "Not reported"}</strong>
                </div>
                <div className={styles.settingsAboutRow}>
                  <span>Storage</span>
                  <strong>
                    {real.storage ? formatBytes(real.storage.usage) : "—"}
                  </strong>
                </div>
                <div className={styles.settingsAboutRow}>
                  <span>Battery</span>
                  <strong>{batteryPct != null ? `${batteryPct}%` : "—"}</strong>
                </div>
                <div className={styles.settingsAboutRow}>
                  <span>Owner</span>
                  <strong>Aryan Batra</strong>
                </div>
              </div>
              <button
                type="button"
                className={styles.settingsAboutMore}
                onClick={onAbout}
              >
                More Info…
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
