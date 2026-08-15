import { useEffect, useRef, useState } from "react";
import {
  AppWindow,
  BatteryFull,
  Layers,
  LayoutGrid,
  Moon,
  Music,
  Pause,
  Play,
  Search,
  SlidersHorizontal,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import useSystemInfo from "@/hooks/useSystemInfo";
import { sounds, setSoundEnabled } from "@/utils/sounds";
import * as music from "@/utils/music";
import {
  CONTROL_TILE_IDS,
  type ControlTileId,
  type SystemState,
} from "@/constants/desktop";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface MenuAction {
  label: string;
  action?: () => void;
  separator?: boolean;
  shortcut?: string;
  bold?: boolean;
  disabled?: boolean;
}

interface MenuDef {
  label: string;
  items: MenuAction[];
}

export interface MenuBarActions {
  onAbout: () => void;
  onQuit: () => void;
  onLock: () => void;
  onRestart: () => void;
  onShutDown: () => void;
  onSleep: () => void;
  onSpotlight: () => void;
  onRun: () => void;
  onOpenApp: (id: string) => void;
  onNewWindow: () => void;
  onCloseFocused: () => void;
  onMinimizeFocused: () => void;
  onZoomFocused: () => void;
  onNotifications: () => void;
  onMissionControl: () => void;
  onAppSwitcher: () => void;
  onBringAllToFront: () => void;
}

interface MenuBarProps {
  focusedAppTitle: string | null;
  system: SystemState;
  onSystemChange: (patch: Partial<SystemState>) => void;
  windows: Array<{ id: string; appId: string; title: string }>;
  focusedWindowId: string | null;
  onFocusWindow: (id: string) => void;
  actions: MenuBarActions;
  /** Do Not Disturb — the Tahoe Control Center Focus tile mirrors it. */
  dndOn?: boolean;
  onToggleDnd?: () => void;
}

const FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif";

interface CCTileProps {
  icon: React.ReactNode;
  label: string;
  status?: string;
  on?: boolean;
  active?: boolean;
  onClick: () => void;
  /** Edit mode (Tahoe's customization): wiggle, remove badge, reorder arrows. */
  editing?: boolean;
  onRemove?: () => void;
  onMove?: (delta: number) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

/** macOS Tahoe Control Center tile — a rounded Liquid Glass module in the grid. */
function CCTile({
  icon,
  label,
  status,
  on,
  active,
  onClick,
  editing = false,
  onRemove,
  onMove,
  onDragStart,
  onDragEnd,
}: CCTileProps) {
  return (
    <button
      type="button"
      data-tile={label}
      className={`${styles.ccTile} ${on ? styles.ccTileOn : ""} ${
        active ? styles.ccTileActive : ""
      } ${editing ? styles.ccTileEditing : ""}`}
      onClick={() => {
        if (editing) return; // taps rearrange, they don't open, in edit mode
        onClick();
      }}
      draggable={editing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      aria-label={label}
    >
      <span className={styles.ccTileIcon}>{icon}</span>
      <span className={styles.ccTileLabel}>{label}</span>
      {status && <span className={styles.ccTileStatus}>{status}</span>}
      {editing && (
        <>
          <span
            role="button"
            tabIndex={-1}
            className={styles.ccTileBadge}
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            aria-label={`Remove ${label}`}
          >
            −
          </span>
          <span className={styles.ccTileArrows}>
            <span
              role="button"
              tabIndex={-1}
              className={styles.ccTileArrow}
              onClick={(e) => {
                e.stopPropagation();
                onMove?.(-1);
              }}
              aria-label={`Move ${label} left`}
            >
              ◀
            </span>
            <span
              role="button"
              tabIndex={-1}
              className={styles.ccTileArrow}
              onClick={(e) => {
                e.stopPropagation();
                onMove?.(1);
              }}
              aria-label={`Move ${label} right`}
            >
              ▶
            </span>
          </span>
        </>
      )}
    </button>
  );
}

export default function MenuBar({
  focusedAppTitle,
  system,
  onSystemChange,
  windows,
  focusedWindowId,
  onFocusWindow,
  actions,
  dndOn = false,
  onToggleDnd,
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [controlCenter, setControlCenter] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [volOpen, setVolOpen] = useState(false);
  const [wifiMenu, setWifiMenu] = useState(false);
  const [battMenu, setBattMenu] = useState(false);
  const [npOpen, setNpOpen] = useState(false);
  const [np, setNp] = useState(music.getState());
  const [editing, setEditing] = useState(false);
  const dragId = useRef<string | null>(null);
  const [time, setTime] = useState("");
  const lastTick = useRef(0);

  // Keep the Now Playing chip + popover in sync with the music engine.
  useEffect(() => music.subscribe(() => setNp(music.getState())), []);

  const { darkMode, soundOn, volume, brightness } = system;
  // REAL system state: battery, network and online status come from the
  // visitor's actual device/browser, not a scripted simulation.
  const real = useSystemInfo();
  const batteryPct =
    real.battery != null ? Math.round(real.battery.level * 100) : null;

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
          "  " +
          now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      );
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!openMenu && !controlCenter && !volOpen && !wifiMenu && !battMenu) return;
    const close = () => {
      setOpenMenu(null);
      setControlCenter(false);
      setExpanded(null);
      setEditing(false);
      setNpOpen(false);
      setVolOpen(false);
      setWifiMenu(false);
      setBattMenu(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenu, controlCenter, volOpen, wifiMenu, battMenu]);

  const toggleMenu = (label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setControlCenter(false);
    setVolOpen(false);
    setOpenMenu(openMenu === label ? null : label);
  };

  const toggleSound = () => {
    const next = !soundOn;
    onSystemChange({ soundOn: next });
    setSoundEnabled(next);
    if (next) sounds.pop();
  };

  const onVolume = (v: number) => {
    onSystemChange({ volume: v });
    music.setMusicVolume(v / 100);
    const now = Date.now();
    if (now - lastTick.current > 140) {
      lastTick.current = now;
      sounds.tick();
    }
  };

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  /* ----- Control Center customization (Tahoe: reorder/remove, persisted) ----- */
  const tileList = (): ControlTileId[] =>
    system.controlTiles.length ? system.controlTiles : [...CONTROL_TILE_IDS];

  const moveTile = (id: ControlTileId, delta: number) => {
    const list = [...tileList()];
    const i = list.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;
    const next = [...list];
    next.splice(i, 1);
    next.splice(j, 0, id);
    onSystemChange({ controlTiles: next });
  };

  const removeTile = (id: ControlTileId) =>
    onSystemChange({ controlTiles: tileList().filter((t) => t !== id) });

  const addTile = (id: ControlTileId) =>
    onSystemChange({ controlTiles: [...tileList(), id] });

  const handleGridDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragId.current;
    dragId.current = null;
    if (!from) return;
    const el = (e.target as HTMLElement).closest("[data-tile]");
    const to = el?.getAttribute("data-tile");
    if (!to || to === from) return;
    const list = tileList();
    const i = list.indexOf(from as ControlTileId);
    const j = list.indexOf(to as ControlTileId);
    if (i < 0 || j < 0 || i === j) return;
    const next = [...list];
    next.splice(i, 1);
    next.splice(j, 0, from as ControlTileId);
    onSystemChange({ controlTiles: next });
  };

  interface TileDef {
    id: ControlTileId;
    label: string;
    icon: React.ReactNode;
    status?: string;
    on?: boolean;
    active?: boolean;
    onClick: () => void;
  }

  const tileDefs: TileDef[] = [
    {
      id: "wifi",
      label: "Wi-Fi",
      icon: real.online ? <Wifi size={18} /> : <WifiOff size={18} />,
      status: real.online ? "Connected" : "Offline",
      on: real.online,
      active: expanded === "wifi",
      onClick: () => setExpanded(expanded === "wifi" ? null : "wifi"),
    },
    {
      id: "focus",
      label: "Focus",
      icon: <Moon size={18} />,
      status: dndOn ? "On" : "Off",
      on: dndOn,
      active: expanded === "focus",
      onClick: () => setExpanded(expanded === "focus" ? null : "focus"),
    },
    {
      id: "display",
      label: "Display",
      icon: <Sun size={18} />,
      status: `${brightness}%`,
      active: expanded === "display",
      onClick: () => setExpanded(expanded === "display" ? null : "display"),
    },
    {
      id: "sound",
      label: "Sound",
      icon: soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />,
      status: volume > 0 ? `${volume}%` : "Muted",
      active: expanded === "sound",
      onClick: () => setExpanded(expanded === "sound" ? null : "sound"),
    },
    {
      id: "music",
      label: "Music",
      icon: <Music size={18} />,
      status: np.playing ? "Now Playing" : "Paused",
      on: np.playing,
      active: expanded === "music",
      onClick: () => setExpanded(expanded === "music" ? null : "music"),
    },
    {
      id: "stage-manager",
      label: "Stage Manager",
      icon: <Layers size={18} />,
      status: system.stageManager ? "On" : "Off",
      on: system.stageManager,
      onClick: () => onSystemChange({ stageManager: !system.stageManager }),
    },
    {
      id: "mission-control",
      label: "Mission Control",
      icon: <LayoutGrid size={18} />,
      status: "F3",
      onClick: () => {
        setControlCenter(false);
        actions.onMissionControl();
      },
    },
    {
      id: "app-switcher",
      label: "App Switcher",
      icon: <AppWindow size={18} />,
      status: "⌘Tab",
      onClick: () => {
        setControlCenter(false);
        actions.onAppSwitcher();
      },
    },
  ];

  const visibleTiles = tileList()
    .map((id) => tileDefs.find((t) => t.id === id))
    .filter((t): t is TileDef => Boolean(t));
  const hiddenTiles = tileDefs.filter((t) => !tileList().includes(t.id));

  const menus: MenuDef[] = [
    {
      label: "File",
      items: [
        { label: "New Window", action: actions.onNewWindow, shortcut: "⌘N" },
        { label: "", separator: true },
        { label: "Close Window", action: actions.onCloseFocused, shortcut: "⌘W" },
      ],
    },
    {
      label: "View",
      items: [{ label: "Enter Full Screen", action: actions.onZoomFocused }],
    },
    {
      label: "Window",
      items: [
        { label: "Minimize", action: actions.onMinimizeFocused, shortcut: "⌘M" },
        { label: "Zoom", action: actions.onZoomFocused },
        ...(windows.length
          ? [{ label: "", separator: true } as MenuAction]
          : []),
        ...windows.map(
          (w): MenuAction => ({
            label: w.title,
            action: () => onFocusWindow(w.id),
            bold: w.id === focusedWindowId,
          }),
        ),
        ...(windows.length
          ? [{ label: "", separator: true } as MenuAction]
          : []),
        {
          label: "Bring All to Front",
          action: actions.onBringAllToFront,
        },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Aryan OS Help", action: () => actions.onOpenApp("readme"), shortcut: "⌘?" },
      ],
    },
  ];

  const appleMenu: MenuAction[] = [
    { label: "About This Mac", action: actions.onAbout, bold: true },
    { label: "", separator: true },
    { label: "System Settings…", action: () => actions.onOpenApp("settings"), shortcut: "⌘," },
    { label: "Run…", action: actions.onRun, shortcut: "⌘⇧R" },
    { label: "", separator: true },
    { label: "Force Quit…", action: () => actions.onOpenApp("terminal"), shortcut: "⌥⌘⎋" },
    { label: "", separator: true },
    { label: "Sleep", action: actions.onSleep },
    { label: "Restart…", action: actions.onRestart },
    { label: "Shut Down…", action: actions.onShutDown },
    { label: "", separator: true },
    { label: "Lock Screen", action: actions.onLock, shortcut: "⌃⌘Q" },
    { label: "", separator: true },
    { label: "Quit Aryan OS", action: actions.onQuit, shortcut: "⌘Q" },
  ];

  return (
    <div className={styles.menuBar} style={{ fontFamily: FONT }}>
      <div className={styles.menuLeft}>
        <button
          type="button"
          className={styles.appleMenu}
          style={{ fontFamily: FONT }}
          onClick={(e) => toggleMenu("__apple", e)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        </button>

        <span className={styles.appName}>{focusedAppTitle ?? "Finder"}</span>

        {menus.map((m) => (
          <div key={m.label} className={styles.menuWrap}>
            <button
              type="button"
              className={`${styles.menuTitle} ${openMenu === m.label ? styles.menuTitleOpen : ""}`}
              onClick={(e) => toggleMenu(m.label, e)}
            >
              {m.label}
            </button>
            {openMenu === m.label && (
              <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                {m.items.map((item, i) =>
                  item.separator ? (
                    <div key={i} className={styles.dropdownSeparator} />
                  ) : (
                    <button
                      key={i}
                      type="button"
                      className={`${styles.dropdownItem} ${
                        item.bold ? styles.dropdownItemBold : ""
                      }`}
                      disabled={item.disabled}
                      onClick={() => {
                        setOpenMenu(null);
                        item.action?.();
                      }}
                    >
                      <span className={styles.dropdownLabel}>{item.label}</span>
                      {item.shortcut && <span className={styles.dropdownShortcut}>{item.shortcut}</span>}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        ))}

        {openMenu === "__apple" && (
          <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
            {appleMenu.map((item, i) =>
              item.separator ? (
                <div key={i} className={styles.dropdownSeparator} />
              ) : (
                <button
                  key={i}
                  type="button"
                  className={`${styles.dropdownItem} ${
                    item.bold ? styles.dropdownItemBold : ""
                  }`}
                  onClick={() => {
                    setOpenMenu(null);
                    item.action?.();
                  }}
                >
                  <span className={styles.dropdownLabel}>{item.label}</span>
                  {item.shortcut && <span className={styles.dropdownShortcut}>{item.shortcut}</span>}
                </button>
              ),
            )}
          </div>
        )}
      </div>

      <div className={styles.menuRight}>
        {/* Now Playing — appears in the menu bar while music is playing. */}
        {np.playing && (
          <button
            type="button"
            className={styles.npChip}
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenu(null);
              setControlCenter(false);
              setVolOpen(false);
              setNpOpen((v) => !v);
            }}
            aria-label="Now Playing"
          >
            <Music size={13} strokeWidth={2} />
            <span className={styles.npChipTitle}>{np.track.title}</span>
          </button>
        )}
        {npOpen && (
          <div className={styles.npPopover} onClick={(e) => e.stopPropagation()}>
            <div
              className={styles.npArt}
              style={{
                background: `linear-gradient(135deg, hsl(${np.track.hue[0]} 82% 64%), hsl(${np.track.hue[1]} 68% 36%))`,
              }}
            >
              <Music size={24} strokeWidth={1.6} />
            </div>
            <div className={styles.npInfo}>
              <strong className={styles.npTitle}>{np.track.title}</strong>
              <span className={styles.npArtist}>
                {np.track.artist} — {np.track.album}
              </span>
            </div>
            <div className={styles.npProgressRow}>
              <span className={styles.npTime}>{fmtTime(np.elapsed)}</span>
              <button
                type="button"
                className={styles.npProgress}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
                  music.seekTo(frac * np.duration);
                }}
                aria-label="Seek"
              >
                <span
                  className={styles.npProgressFill}
                  style={{ width: `${(np.elapsed / np.duration) * 100}%` }}
                />
              </button>
              <span className={styles.npTime}>{fmtTime(np.duration)}</span>
            </div>
            <div className={styles.npControls}>
              <button
                type="button"
                className={styles.npBtn}
                onClick={music.prev}
                aria-label="Previous track"
              >
                <Play size={14} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button
                type="button"
                className={styles.npPlay}
                onClick={music.toggle}
                aria-label={np.playing ? "Pause" : "Play"}
              >
                {np.playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                type="button"
                className={styles.npBtn}
                onClick={music.next}
                aria-label="Next track"
              >
                <Play size={14} />
              </button>
            </div>
            <div className={styles.npVolRow}>
              <Volume2 size={13} />
              <input
                type="range"
                min={0}
                max={100}
                value={np.volume * 100}
                className={styles.ccSlider}
                onChange={(e) => music.setMusicVolume(Number(e.target.value) / 100)}
                aria-label="Music volume"
              />
            </div>
          </div>
        )}
        <button
          type="button"
          className={styles.statusBtn}
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenu(null);
            setVolOpen(false);
            setControlCenter((c) => !c);
          }}
          aria-label="Control Center"
        >
          <SlidersHorizontal size={15} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          className={styles.statusBtn}
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenu(null);
            setControlCenter(false);
            setVolOpen((v) => !v);
          }}
          aria-label="Volume"
        >
          {soundOn ? (
            <Volume2 size={15} strokeWidth={1.8} />
          ) : (
            <VolumeX size={15} strokeWidth={1.8} className={styles.statusDim} />
          )}
        </button>
        {volOpen && (
          <div className={styles.volPopover} onClick={(e) => e.stopPropagation()}>
            <div className={styles.volRow}>
              {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                className={styles.ccSlider}
                onChange={(e) => onVolume(Number(e.target.value))}
                aria-label="Volume"
              />
            </div>
            <button type="button" className={styles.volMute} onClick={toggleSound}>
              {soundOn ? "Mute" : "Unmute"}
            </button>
          </div>
        )}
        <button
          type="button"
          className={styles.statusBtn}
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenu(null);
            setControlCenter(false);
            setVolOpen(false);
            setWifiMenu((v) => !v);
          }}
          aria-label="Network menu"
        >
          {real.online ? (
            <Wifi size={15} strokeWidth={1.8} />
          ) : (
            <WifiOff size={15} strokeWidth={1.8} className={styles.statusDim} />
          )}
        </button>
        {wifiMenu && (
          <div className={styles.wifiMenu} onClick={(e) => e.stopPropagation()}>
            <div className={styles.wifiMenuHeader}>Network</div>
            <div className={styles.wifiRow}>
              <span className={styles.wifiRowLabel}>Status</span>
              <span className={styles.wifiRowStatus}>
                {real.online ? "Connected" : "Offline"}
              </span>
            </div>
            <div className={styles.dropdownSeparator} />
            <div className={styles.wifiNetwork}>
              <Wifi size={13} />
              <span className={styles.wifiNetworkName}>
                {real.network?.effectiveType ?? "unknown"}
                {real.network?.downlink ? ` · ${real.network.downlink} Mbps` : ""}
              </span>
            </div>
            <div className={styles.wifiNetwork}>
              <span className={styles.wifiNetworkName}>
                Round-trip {real.network?.rtt ? `${real.network.rtt} ms` : "—"}
              </span>
            </div>
            <div className={styles.dropdownSeparator} />
            <button
              type="button"
              className={styles.wifiOpen}
              onClick={() => {
                setWifiMenu(false);
                actions.onOpenApp("settings");
              }}
            >
              Open Network Settings…
            </button>
          </div>
        )}
        <button
          type="button"
          className={styles.battery}
          title="Battery"
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenu(null);
            setControlCenter(false);
            setVolOpen(false);
            setWifiMenu(false);
            setBattMenu((v) => !v);
          }}
          aria-label="Battery menu"
        >
          <BatteryFull size={16} strokeWidth={1.6} className={styles.batteryIcon} />
          {system.showBatteryPct && batteryPct != null && (
            <span className={styles.batteryPct}>{batteryPct}%</span>
          )}
        </button>
        {battMenu && (
          <div className={styles.batteryMenu} onClick={(e) => e.stopPropagation()}>
            <div className={styles.battHeader}>
              <BatteryFull size={18} strokeWidth={1.6} />
              <strong>{batteryPct != null ? `${batteryPct}%` : "—"}</strong>
              <span className={styles.battCharge}>
                {real.battery?.charging ? "Charging" : "Battery"}
              </span>
            </div>
            <div className={styles.battRow}>
              <span>Source</span>
              <span>{real.battery?.charging ? "Power adapter" : "Battery"}</span>
            </div>
            <div className={styles.battRow}>
              <span>Remaining</span>
              <span>
                {real.battery && real.battery.dischargingTime !== Infinity && real.battery.dischargingTime > 0
                  ? `~${Math.round(real.battery.dischargingTime / 60)} min`
                  : real.battery?.charging && real.battery.chargingTime !== Infinity && real.battery.chargingTime > 0
                    ? `~${Math.round(real.battery.chargingTime / 60)} min to full`
                    : "—"}
              </span>
            </div>
            <div className={styles.dropdownSeparator} />
            <button
              type="button"
              className={styles.wifiOpen}
              onClick={() => {
                setBattMenu(false);
                actions.onOpenApp("settings");
              }}
            >
              Open Battery Settings…
            </button>
          </div>
        )}
        <button
          type="button"
          className={styles.statusBtn}
          onClick={actions.onSpotlight}
          aria-label="Spotlight"
        >
          <Search size={15} strokeWidth={1.8} />
        </button>
        {controlCenter && (
          <div className={styles.controlCenter} onClick={(e) => e.stopPropagation()}>
            <div className={styles.ccHeader}>
              <span className={styles.ccHeaderTitle}>Control Center</span>
              <button
                type="button"
                className={styles.ccEditBtn}
                onClick={() => {
                  setEditing((v) => !v);
                  setExpanded(null);
                }}
              >
                {editing ? "Done" : "Edit"}
              </button>
            </div>

            {visibleTiles.length > 0 && (
              <div
                className={styles.ccGrid}
                onDragOver={editing ? (e) => e.preventDefault() : undefined}
                onDrop={editing ? handleGridDrop : undefined}
              >
                {visibleTiles.map((t) => (
                  <CCTile
                    key={t.id}
                    icon={t.icon}
                    label={t.label}
                    status={t.status}
                    on={t.on}
                    active={t.active}
                    onClick={t.onClick}
                    editing={editing}
                    onRemove={() => removeTile(t.id)}
                    onMove={(d) => moveTile(t.id, d)}
                    onDragStart={(e) => {
                      dragId.current = t.id;
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      dragId.current = null;
                    }}
                  />
                ))}
              </div>
            )}

            {editing && hiddenTiles.length > 0 && (
              <div className={styles.ccGallery}>
                <div className={styles.ccGalleryTitle}>Other Controls</div>
                <div className={styles.ccGalleryGrid}>
                  {hiddenTiles.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={styles.ccGalleryItem}
                      onClick={() => addTile(t.id)}
                    >
                      <span className={styles.ccGalleryIcon}>{t.icon}</span>
                      <span className={styles.ccGalleryLabel}>{t.label}</span>
                      <span className={styles.ccGalleryAdd}>＋</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {expanded === "wifi" && (
              <div className={styles.ccExpanded}>
                <div className={styles.ccExpandedHeader}>
                  <span className={styles.ccRowIcon}>
                    {real.online ? <Wifi size={14} /> : <WifiOff size={14} />}
                  </span>
                  <strong>Network</strong>
                  <span className={styles.ccRowStatus}>
                    {real.online ? "Connected" : "Offline"}
                  </span>
                </div>
                <div className={styles.wifiNetwork}>
                  <Wifi size={13} />
                  <span className={styles.wifiNetworkName}>
                    {real.network?.effectiveType ?? "unknown"}
                    {real.network?.downlink ? ` · ${real.network.downlink} Mbps` : ""}
                  </span>
                </div>
                <div className={styles.wifiNetwork}>
                  <span className={styles.wifiNetworkName}>
                    Round-trip {real.network?.rtt ? `${real.network.rtt} ms` : "—"}
                  </span>
                </div>
                <div className={styles.dropdownSeparator} />
                <button
                  type="button"
                  className={styles.wifiOpen}
                  onClick={() => {
                    setControlCenter(false);
                    actions.onOpenApp("settings");
                  }}
                >
                  Open Network Settings…
                </button>
              </div>
            )}

            {expanded === "focus" && (
              <div className={styles.ccExpanded}>
                <div className={styles.ccExpandedHeader}>
                  <span className={styles.ccRowIcon}>
                    <Moon size={14} />
                  </span>
                  <strong>Focus</strong>
                  <button
                    type="button"
                    className={styles.ccToggle}
                    onClick={() => onToggleDnd?.()}
                    aria-label="Toggle Focus"
                  >
                    <span className={`${styles.ccThumb} ${dndOn ? styles.ccThumbOn : ""}`} />
                  </button>
                </div>
                <p className={styles.ccExpandedNote}>
                  {dndOn
                    ? "Do Not Disturb is on — notifications are silenced."
                    : "Do Not Disturb silences notifications while you focus."}
                </p>
              </div>
            )}

            {expanded === "display" && (
              <div className={styles.ccExpanded}>
                <div className={styles.ccExpandedHeader}>
                  <span className={styles.ccRowIcon}>
                    <Sun size={14} />
                  </span>
                  <strong>Display</strong>
                </div>
                <div className={styles.ccRow}>
                  <span className={styles.ccRowIcon}>
                    <Sun size={14} />
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={brightness}
                    className={styles.ccSlider}
                    onChange={(e) => onSystemChange({ brightness: Number(e.target.value) })}
                    aria-label="Brightness"
                  />
                </div>
              </div>
            )}

            {expanded === "sound" && (
              <div className={styles.ccExpanded}>
                <div className={styles.ccExpandedHeader}>
                  <span className={styles.ccRowIcon}>
                    {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </span>
                  <strong>Sound</strong>
                </div>
                <div className={styles.ccRow}>
                  <span className={styles.ccRowIcon}>
                    {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    className={styles.ccSlider}
                    onChange={(e) => onVolume(Number(e.target.value))}
                    aria-label="Volume"
                  />
                </div>
                <div className={styles.ccRow}>
                  <span className={styles.ccRowLabel}>Sound Effects</span>
                  <button
                    type="button"
                    className={styles.ccToggle}
                    onClick={toggleSound}
                    aria-label="Toggle sound effects"
                  >
                    <span className={`${styles.ccThumb} ${soundOn ? styles.ccThumbOn : ""}`} />
                  </button>
                </div>
                <div className={styles.ccRow}>
                  <span className={styles.ccRowLabel}>Appearance</span>
                  <button
                    type="button"
                    className={styles.ccToggle}
                    onClick={() => onSystemChange({ darkMode: !darkMode })}
                    aria-label="Toggle appearance"
                  >
                    {darkMode ? <Moon size={13} /> : <Sun size={13} />}
                  </button>
                </div>
              </div>
            )}

            {expanded === "music" && (
              <div className={styles.ccExpanded}>
                <div className={styles.ccMusicRow}>
                  <div
                    className={styles.ccMusicArt}
                    style={{
                      background: `linear-gradient(135deg, hsl(${np.track.hue[0]} 82% 64%), hsl(${np.track.hue[1]} 68% 36%))`,
                    }}
                  >
                    M
                  </div>
                  <div>
                    <div className={styles.ccMusicTitle}>{np.track.title}</div>
                    <div className={styles.ccMusicArtist}>
                      {np.track.artist} · {np.track.album}
                    </div>
                  </div>
                </div>
                <div className={styles.ccMusicControls}>
                  <button
                    type="button"
                    className={styles.ccMusicBtn}
                    onClick={music.prev}
                    aria-label="Previous track"
                  >
                    <Play size={14} style={{ transform: "rotate(180deg)" }} />
                  </button>
                  <button
                    type="button"
                    className={styles.ccMusicPlay}
                    onClick={music.toggle}
                    aria-label={np.playing ? "Pause" : "Play"}
                  >
                    {np.playing ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    type="button"
                    className={styles.ccMusicBtn}
                    onClick={music.next}
                    aria-label="Next track"
                  >
                    <Play size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* clock opens Notification Center (as on real macOS) */}
      <button
        type="button"
        className={styles.clockBtn}
        onClick={() => {
          setOpenMenu(null);
          setControlCenter(false);
          setVolOpen(false);
          actions.onNotifications();
        }}
        aria-label="Notification Center"
      >
        {time}
      </button>
    </div>
  );
}
