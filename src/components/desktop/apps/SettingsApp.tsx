"use client";

import { useState } from "react";
import {
  Accessibility,
  BatteryFull,
  Bell,
  Check,
  HardDrive,
  Image,
  Info,
  LayoutGrid,
  Moon,
  Wallpaper,
  Palette,
  PanelsTopLeft,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  ACCENT_COLORS,
  CONTROL_TILE_IDS,
  type AccentColorId,
  type ControlTileId,
} from "@/constants/desktop";
import Glyph from "@/components/desktop/Glyph";
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
  /** Set via Finder → Set as Wallpaper; shown so it can be reset. */
  customWallpaperName?: string;
  onAbout: () => void;
}

/** Apps that can send notifications, as listed in Settings → Notifications. */
const NOTIF_APPS = [
  { id: "finder", name: "Finder", icon: "folder" },
  { id: "settings", name: "System Settings", icon: "settings" },
  { id: "safari", name: "Safari", icon: "compass" },
  { id: "messages", name: "Messages", icon: "message-square" },
  { id: "calendar", name: "Calendar", icon: "calendar" },
  { id: "notes", name: "Notes", icon: "sticky-note" },
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
  customWallpaperName,
  onAbout,
}: SettingsAppProps) {
  const [pane, setPane] = useState("network");
  const real = useSystemInfo();

  const {
    soundOn,
    volume,
    brightness,
    darkMode,
    accentColor,
    clockStyle,
    clockSource,
    reduceTransparency,
    showWidgets,
    slideshow,
    slideshowInterval,
    wallpaperFit,
    widgetStyle,
    dockSize,
    dockMagnify,
    dockMagnifySize,
    dockPosition,
    minimizeEffect,
    dockAutoHide,
    autoHideMenuBar,
    menuBarStyle,
    stageManager,
    showBatteryPct,
    screensaverStyle,
    screensaverDelay,
    notifPrefs,
    hotCorners,
    pinchLaunchpad,
    swipeMissionControl,
    desktopSort,
    desktopIconSize,
    desktopIconReset,
  } = system;

  const CLOCK_STYLES: Array<{ id: ClockStyle; label: string }> = [
    { id: "default", label: "Default" },
    { id: "numeric", label: "Numeric" },
    { id: "analog", label: "Analog" },
    { id: "world", label: "World" },
  ];

  /* macOS Tahoe System Settings sidebar — grouped into the same sections as
     the real app (Network / Notifications & Focus / Sound / General), each
     with a small section header above its icon rows. The real app also has
     Apps + Internet Accounts groups; this machine's settings map to General. */
  const sidebarGroups: Array<{
    label: string;
    items: Array<{ id: string; label: string; icon: React.ReactNode }>;
  }> = [
    {
      label: "Network",
      items: [
        {
          id: "network",
          label: "Wi-Fi",
          icon: real.online ? <Wifi size={15} /> : <WifiOff size={15} />,
        },
      ],
    },
    {
      label: "Notifications & Focus",
      items: [{ id: "notifications", label: "Notifications", icon: <Bell size={15} /> }],
    },
    {
      label: "Sound",
      items: [
        {
          id: "sound",
          label: "Sound",
          icon: soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />,
        },
      ],
    },
    {
      label: "General",
      items: [
        { id: "appearance", label: "Appearance", icon: <Palette size={15} /> },
        { id: "wallpaper", label: "Wallpaper", icon: <Image size={15} /> },
        { id: "displays", label: "Displays", icon: <Sun size={15} /> },
        { id: "desktop-dock", label: "Desktop & Dock", icon: <PanelsTopLeft size={15} /> },
        { id: "trackpad", label: "Trackpad & Mouse", icon: <PanelsTopLeft size={15} /> },
        { id: "control-center", label: "Control Center", icon: <LayoutGrid size={15} /> },
        { id: "battery", label: "Battery", icon: <BatteryFull size={15} /> },
        { id: "storage", label: "Storage", icon: <HardDrive size={15} /> },
        { id: "accessibility", label: "Accessibility", icon: <Accessibility size={15} /> },
        { id: "about", label: "About", icon: <Info size={15} /> },
      ],
    },
  ];

  // Tahoe's sidebar search field — filters the groups live as you type.
  const [sidebarQuery, setSidebarQuery] = useState("");
  const query = sidebarQuery.trim().toLowerCase();
  const filteredGroups = query
    ? sidebarGroups
        .map((g) => ({
          ...g,
          items: g.items.filter((i) => i.label.toLowerCase().includes(query)),
        }))
        .filter((g) => g.items.length > 0)
    : sidebarGroups;

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
        {/* Tahoe sidebar search — filters the grouped navigation as you type. */}
        <div className={styles.settingsSearchWrap}>
          <svg
            viewBox="0 0 16 16"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="6.8" cy="6.8" r="4.6" />
            <path d="m10.2 10.2 3 3" />
          </svg>
          <input
            className={styles.settingsSearch}
            placeholder="Search"
            value={sidebarQuery}
            onChange={(e) => setSidebarQuery(e.target.value)}
            aria-label="Search settings"
          />
        </div>
        {filteredGroups.map((g) => (
          <div key={g.label} className={styles.settingsGroup}>
            <div className={styles.settingsGroupLabel}>{g.label}</div>
            {g.items.map((s) => (
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
        ))}
        {filteredGroups.length === 0 && (
          <p className={styles.settingsNoResults}>No Results</p>
        )}
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
            <div className={styles.formGroup}>
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
            <div className={styles.formGroup}>
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
            </div>
          </>
        )}

        {pane === "appearance" && (
          <>
            <h2>Appearance</h2>
            <p className={styles.settingsSub}>
              macOS Tahoe theme — pick the accent “Color” that drives buttons,
              selections and highlights system-wide.
            </p>

            <div className={styles.formGroup}>
              <div className={styles.settingsRow}>
                <span className={styles.settingsRowLabel}>Color</span>
              </div>
              <div className={styles.accentRow}>
                {(Object.keys(ACCENT_COLORS) as AccentColorId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={`${styles.accentSwatch} ${
                      (accentColor ?? "blue") === id ? styles.accentSwatchActive : ""
                    }`}
                    style={{ backgroundColor: ACCENT_COLORS[id].swatch }}
                    onClick={() => onSystemChange({ accentColor: id })}
                    aria-label={`Accent color ${id}`}
                    aria-pressed={(accentColor ?? "blue") === id}
                    title={id.charAt(0).toUpperCase() + id.slice(1)}
                  >
                    {(accentColor ?? "blue") === id && <Check size={13} color="#fff" />}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.settingsSectionGap} />
            <div className={styles.formGroup}>
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
            </div>
          </>
        )}

        {pane === "wallpaper" && (
          <>
            <h2>Wallpaper</h2>
            <p className={styles.settingsSub}>Choose a look for your desktop</p>
            {customWallpaperName && (
              <div className={styles.settingsNote}>
                <Wallpaper size={13} /> Using “{customWallpaperName}” from Finder — pick a
                wallpaper below to reset.
              </div>
            )}
            <div className={styles.settingsThumbs}>
              {WALLPAPERS.map((wp, i) => (
                <button
                  key={wp.id}
                  type="button"
                  className={`${styles.settingsThumb} ${
                    !customWallpaperName && i === wallpaperIndex
                      ? styles.settingsThumbActive
                      : ""
                  }`}
                  onClick={() => onWallpaper(i)}
                >
                  <span
                    className={styles.settingsThumbArt}
                    style={{
                      backgroundImage: wp.src ? `url(${wp.src})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <span className={styles.settingsThumbName}>{wp.name}</span>
                </button>
              ))}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.settingsRow}>
                <div className={styles.settingsRowText}>
                  <span className={styles.settingsRowLabel}>Wallpaper Slideshow</span>
                  <span className={styles.settingsRowSub}>
                    Automatically rotate through the wallpapers
                  </span>
                </div>
                <button
                  type="button"
                  className={`${styles.setToggle} ${slideshow ? styles.setToggleOn : ""}`}
                  onClick={() => onSystemChange({ slideshow: !slideshow })}
                  aria-label="Toggle wallpaper slideshow"
                >
                  <span className={`${styles.setThumb} ${slideshow ? styles.setThumbOn : ""}`} />
                </button>
              </div>
              {slideshow && (
                <div className={styles.settingsRow}>
                  <span className={styles.settingsRowLabel}>Change every</span>
                  <div className={styles.segmented}>
                    {[10, 20, 30, 60].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`${styles.segmentedItem} ${
                          slideshowInterval === s ? styles.segmentedItemActive : ""
                        }`}
                        onClick={() => onSystemChange({ slideshowInterval: s })}
                      >
                        {s}s
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.settingsRow}>
                <div className={styles.settingsRowText}>
                  <span className={styles.settingsRowLabel}>Wallpaper Fit</span>
                  <span className={styles.settingsRowSub}>
                    How the image fills the screen
                  </span>
                </div>
                <div className={styles.segmented}>
                {(
                  [
                    ["fill", "Fill"],
                    ["fit", "Fit"],
                    ["stretch", "Stretch"],
                    ["tile", "Tile"],
                    ["center", "Center"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`${styles.segmentedItem} ${
                      wallpaperFit === id ? styles.segmentedItemActive : ""
                    }`}
                    onClick={() => onSystemChange({ wallpaperFit: id })}
                  >
                    {label}
                  </button>
                ))}
                </div>
              </div>
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

            <div className={styles.formGroup}>
              <div className={styles.settingsRow}>
                <span className={styles.settingsRowLabel}>
                  Menu Bar
                  <em className={styles.settingsRowNote}>
                    Transparent (macOS 26) or the frosted Sequoia look
                  </em>
                </span>
              </div>
              <div className={styles.segmented}>
                {(
                  [
                    { id: "transparent", label: "Transparent" },
                    { id: "semi", label: "Semi-transparent" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.segmentedItem} ${
                      menuBarStyle === s.id ? styles.segmentedItemActive : ""
                    }`}
                    onClick={() => onSystemChange({ menuBarStyle: s.id })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.settingsRow}>
                <span className={styles.settingsRowLabel}>
                  Menu Bar Clock — NTP Time
                  <em className={styles.settingsRowNote}>
                    Sync the clock to an NTP server instead of your device
                  </em>
                </span>
                <button
                  type="button"
                  className={`${styles.setToggle} ${clockSource === "ntp" ? styles.setToggleOn : ""}`}
                  onClick={() =>
                    onSystemChange({
                      clockSource: clockSource === "ntp" ? "local" : "ntp",
                    })
                  }
                  aria-label="Toggle NTP clock"
                >
                  <span className={`${styles.setThumb} ${clockSource === "ntp" ? styles.setThumbOn : ""}`} />
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
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
            <div className={styles.formGroup}>
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
              <div className={styles.macRadioGroup}>
                {(
                  [
                    { id: "genie", label: "Genie" },
                    { id: "scale", label: "Scale" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`${styles.macRadio} ${
                      minimizeEffect === m.id ? styles.macRadioOn : ""
                    }`}
                    onClick={() => onSystemChange({ minimizeEffect: m.id })}
                  >
                    <span className={styles.macRadioOuter}>
                      {minimizeEffect === m.id && <span className={styles.macRadioDot} />}
                    </span>
                    <span>{m.label}</span>
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
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>
                Automatically hide and show the menu bar
                <span className={styles.settingsRowHint}>
                  Hover the top of the screen to reveal it
                </span>
              </span>
              <button
                type="button"
                className={`${styles.setToggle} ${autoHideMenuBar ? styles.setToggleOn : ""}`}
                onClick={() => onSystemChange({ autoHideMenuBar: !autoHideMenuBar })}
                aria-label="Toggle auto-hide menu bar"
              >
                <span className={`${styles.setThumb} ${autoHideMenuBar ? styles.setThumbOn : ""}`} />
              </button>
            </div>
            </div>

            <div className={styles.settingsSectionGap} />
            <h3 className={styles.settingsSectionTitle}>Desktop</h3>
            <div className={styles.formGroup}>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>
                Icon size
                <span className={styles.settingsRowHint}>
                  Icon size on the wallpaper — the grid spacing scales with it
                </span>
              </span>
              <input
                type="range"
                min={44}
                max={84}
                value={desktopIconSize}
                className={styles.settingsSlider}
                onChange={(e) =>
                  onSystemChange({ desktopIconSize: Number(e.target.value) })
                }
                aria-label="Desktop icon size"
              />
              <span className={styles.settingsRowStatus}>{desktopIconSize}px</span>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>
                Sort icons by
                <span className={styles.settingsRowHint}>
                  Persisted per desktop; change it anytime from the wallpaper's
                  right-click menu too
                </span>
              </span>
              <div className={styles.segmented}>
                {(
                  [
                    { id: "none", label: "Grid" },
                    { id: "name", label: "Name" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.segmentedItem} ${
                      desktopSort === s.id ? styles.segmentedItemActive : ""
                    }`}
                    onClick={() => {
                      onSystemChange({ desktopSort: s.id });
                      onSystemChange({ desktopIconReset: desktopIconReset + 1 });
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.settingsRow}>
              <span className={styles.settingsRowLabel}>
                Clean Up
                <span className={styles.settingsRowHint}>
                  Return every icon to its grid cell
                </span>
              </span>
              <button
                type="button"
                className={styles.settingsSmallBtn}
                onClick={() =>
                  onSystemChange({ desktopIconReset: desktopIconReset + 1 })
                }
              >
                Clean Up Icons…
              </button>
            </div>
            </div>

            <div className={styles.settingsSectionGap} />
            <h3 className={styles.settingsSectionTitle}>Windows</h3>
            <div className={styles.formGroup}>
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
            </div>

            <div className={styles.settingsSectionGap} />
            <h3 className={styles.settingsSectionTitle}>Screen Saver</h3>
            <div className={styles.formGroup}>
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
                    { id: "matrix", label: "Matrix" },
                    { id: "pipes", label: "Pipes" },
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

        {pane === "trackpad" && (
          <>
            <h2>Trackpad &amp; Mouse</h2>
            <p className={styles.settingsSub}>Gestures</p>
            <div className={styles.formGroup}>
              <div className={styles.settingsRow}>
                <span className={styles.settingsRowLabel}>
                  Pinch to show Launchpad
                </span>
                <button
                  type="button"
                  className={`${styles.setToggle} ${pinchLaunchpad ? styles.setToggleOn : ""}`}
                  onClick={() => onSystemChange({ pinchLaunchpad: !pinchLaunchpad })}
                  aria-label="Toggle pinch to Launchpad"
                >
                  <span
                    className={`${styles.setThumb} ${pinchLaunchpad ? styles.setThumbOn : ""}`}
                  />
                </button>
              </div>
              <div className={styles.settingsRow}>
                <span className={styles.settingsRowLabel}>
                  Swipe up for Mission Control
                </span>
                <button
                  type="button"
                  className={`${styles.setToggle} ${swipeMissionControl ? styles.setToggleOn : ""}`}
                  onClick={() =>
                    onSystemChange({ swipeMissionControl: !swipeMissionControl })
                  }
                  aria-label="Toggle swipe up for Mission Control"
                >
                  <span
                    className={`${styles.setThumb} ${swipeMissionControl ? styles.setThumbOn : ""}`}
                  />
                </button>
              </div>
            </div>
            <p className={styles.settingsSub}>
              Pinch with two fingers (or ⌃ scroll) to open Launchpad, and swipe
              up with two fingers over the wallpaper for Mission Control. Both
              replace the browser&apos;s zoom — the desktop gestures win.
            </p>
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
                    style={{ width: `${storagePct}%`, background: "var(--accent, #0a84ff)" }}
                  />
                </div>
                <div className={styles.storageList}>
                  <div className={styles.storageItem}>
                    <span className={styles.storageDot} style={{ background: "var(--accent, #0a84ff)" }} />
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
            <div className={styles.formGroup}>
              <div className={styles.settingsRow}>
                <span className={styles.settingsRowLabel}>
                  Show percentage in menu bar
                </span>
                <button
                  type="button"
                  className={`${styles.macCheckbox} ${showBatteryPct ? styles.macCheckboxOn : ""}`}
                  onClick={() => onSystemChange({ showBatteryPct: !showBatteryPct })}
                  aria-label="Show battery percentage in menu bar"
                >
                  <span className={styles.macCheckboxBox}>
                    {showBatteryPct && (
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M1 4.2 3.6 6.8 9 1.4" />
                      </svg>
                    )}
                  </span>
                </button>
              </div>
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
                      <span className={styles.notifAppIcon}>
                        <Glyph id={app.icon} size={16} />
                      </span>
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

        {pane === "control-center" && (
          <>
            <h2>Control Center</h2>
            <p className={styles.settingsSub}>
              Choose which controls appear in the Control Center and menu bar.
            </p>
            <div className={styles.settingsList}>
              {CONTROL_TILE_IDS.map((tileId) => {
                const tile = tileId as ControlTileId;
                const enabled = system.controlTiles.includes(tile);
                const label = {
                  wifi: "Wi-Fi",
                  focus: "Focus",
                  display: "Display",
                  sound: "Sound",
                  music: "Music",
                  "stage-manager": "Stage Manager",
                  "mission-control": "Mission Control",
                  "app-switcher": "App Switcher",
                }[tile];
                const hint = {
                  wifi: "Current network status",
                  focus: "Do Not Disturb",
                  display: "Brightness",
                  sound: "Volume",
                  music: "Now Playing",
                  "stage-manager": "Focus one app at a time",
                  "mission-control": "All open windows",
                  "app-switcher": "Switch between apps",
                }[tile];
                return (
                  <div key={tile} className={styles.storageItem}>
                    <div className={styles.storageItemMain}>
                      <strong>{label}</strong>
                      <span className={styles.settingsRowHint}>{hint}</span>
                    </div>
                    <button
                      type="button"
                      className={`${styles.setToggle} ${
                        enabled ? styles.setToggleOn : ""
                      }`}
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`Show ${label} in Control Center`}
                      onClick={() =>
                        onSystemChange({
                          controlTiles: enabled
                            ? system.controlTiles.filter((t) => t !== tile)
                            : [...system.controlTiles, tile],
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
            <p className={styles.settingsRowHint} style={{ marginTop: 10 }}>
              Tip: you can also reorder or remove tiles right inside the Control
              Center — click Edit.
            </p>
          </>
        )}

        {pane === "accessibility" && (
          <>
            <h2>Accessibility</h2>
            <p className={styles.settingsSub}>Display</p>
            <div className={styles.formGroup}>
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
