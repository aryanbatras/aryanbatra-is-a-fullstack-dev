import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Sun, Volume2 } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLongPress } from "@/hooks/useLongPress";
import MobileDock from "@/components/mobile/MobileDock";
import MobileAppGrid from "@/components/mobile/MobileAppGrid";
import MobileStatusBar from "@/components/mobile/MobileStatusBar";
import MobileContextMenu, { type ContextMenuItem } from "@/components/mobile/MobileContextMenu";
import MobileSystemNavBar from "@/components/mobile/MobileSystemNavBar";
import MobileControlCenter from "@/components/mobile/MobileControlCenter";
import {
  ACCENT_COLORS,
  CONTROL_TILE_IDS,
  DEFAULT_HOT_CORNERS,
  DEFAULT_SPACES,
  DEFAULT_WIDGETS,
  DESKTOP_APPS,
  FOLDER_COLOR_FILL,
  FOLDER_COLORS,
  WALLPAPERS,
  WIDGET_IDS,
  type AccentColorId,
  type CornerId,
  type DesktopFolder,
  type HotCornerAction,
  type SpaceConfig,
  type SystemState,
} from "@/constants/desktop";
import { setSpaceContext, useWindowManager } from "@/hooks/useWindowManager";
import MenuBar from "@/components/desktop/MenuBar";
import Dock from "@/components/desktop/Dock";
import Window from "@/components/desktop/Window";
import AppIcon from "@/components/desktop/AppIcon";
import FolderIcon from "@/components/desktop/FolderIcon";
import Spotlight from "@/components/desktop/Spotlight";
import AboutThisMac from "@/components/desktop/AboutThisMac";
import MissionControl from "@/components/desktop/MissionControl";
import Glyph from "@/components/desktop/Glyph";
import NotificationCenter, { type OsNotification } from "@/components/desktop/NotificationCenter";
import LockScreen from "@/components/desktop/LockScreen";
import WidgetStack, { WIDGET_META } from "@/components/desktop/WidgetStack";
import StageStrip from "@/components/desktop/StageStrip";
import useWallpaperTint from "@/hooks/useWallpaperTint";
import AppSwitcher from "@/components/desktop/AppSwitcher";
import Launchpad from "@/components/desktop/Launchpad";
import EmojiPicker from "@/components/desktop/EmojiPicker";
import AlertDialog, { type AlertOptions } from "@/components/desktop/AlertDialog";
import QuickLook, { type QuickLookFile } from "@/components/desktop/QuickLook";
/* ─── Static imports: lightweight apps always in the shell ────────── */
import FinderApp, { type FinderFile } from "@/components/desktop/apps/FinderApp";
import SettingsApp from "@/components/desktop/apps/SettingsApp";
import AboutApp from "@/components/desktop/apps/AboutApp";
import ResumeApp from "@/components/desktop/apps/ResumeApp";
import ProjectsApp from "@/components/desktop/apps/ProjectsApp";
import NotesApp from "@/components/desktop/apps/NotesApp";

/* ─── Lazy-loaded medium apps ───────────────────────────────────────
 * These pull in non-trivial deps (opentype.js, PDF rendering,IRC) or
 * are simply never needed at boot — lazy-loading keeps the shell lean.
 */
const PhotosApp = React.lazy(() => import("@/components/desktop/apps/PhotosApp"));
const VideosApp = React.lazy(() => import("@/components/desktop/apps/VideosApp"));
const MapsApp = React.lazy(() => import("@/components/desktop/apps/MapsApp"));
const ReadMeApp = React.lazy(() => import("@/components/desktop/apps/ReadMeApp"));
const WebsiteApp = React.lazy(() => import("@/components/desktop/apps/WebsiteApp"));
const TerminalApp = React.lazy(() => import("@/components/desktop/apps/TerminalApp"));
const GamesApp = React.lazy(() => import("@/components/desktop/apps/GamesApp"));
const WebPlayGame = React.lazy(() => import("@/components/desktop/apps/GamesApp").then(m => ({ default: m.WebPlayGame })));
const PaintApp = React.lazy(() => import("@/components/desktop/apps/PaintApp"));
const PdfViewerApp = React.lazy(() => import("@/components/desktop/apps/PdfViewerApp"));
const TextEditApp = React.lazy(() => import("@/components/desktop/apps/TextEditApp"));
const MarkdownApp = React.lazy(() => import("@/components/desktop/apps/MarkdownApp"));
const IrcApp = React.lazy(() => import("@/components/desktop/apps/IrcApp"));
const MessengerApp = React.lazy(() => import("@/components/desktop/apps/MessengerApp"));
const DevToolsApp = React.lazy(() => import("@/components/desktop/apps/DevToolsApp"));
const OpenTypeApp = React.lazy(() => import("@/components/desktop/apps/OpenTypeApp"));

/* ─── Lazy-loaded heavy apps ─────────────────────────────────────────
 * These components pull in WASM binaries, heavy libraries (chess.js,
 * Monaco, Webamp, vim.js, emulators) or large scripts.  By lazy-loading
 * them the code only downloads when the user actually opens the app,
 * keeping the initial desktop JS bundle small.
 */
const DxBallGame = React.lazy(() => import("@/components/desktop/apps/DxBallGame"));
const ChessGame = React.lazy(() => import("@/components/desktop/apps/ChessGame"));
const SpaceCadetGame = React.lazy(() => import("@/components/desktop/apps/SpaceCadetGame"));
const Quake3Game = React.lazy(() => import("@/components/desktop/apps/Quake3Game"));
const WebampApp = React.lazy(() => import("@/components/desktop/apps/WebampApp"));
const VlcApp = React.lazy(() => import("@/components/desktop/apps/VlcApp"));
const VimApp = React.lazy(() => import("@/components/desktop/apps/VimApp"));
const MonacoApp = React.lazy(() => import("@/components/desktop/apps/MonacoApp"));
const TinyMceApp = React.lazy(() => import("@/components/desktop/apps/TinyMceApp"));
const Tic80Game = React.lazy(() => import("@/components/desktop/apps/Tic80Game"));
const ClassiCubeGame = React.lazy(() => import("@/components/desktop/apps/ClassiCubeGame"));
const BoxedWineApp = React.lazy(() => import("@/components/desktop/apps/BoxedWineApp"));
const V86App = React.lazy(() => import("@/components/desktop/apps/V86App"));
const EmulatorApp = React.lazy(() => import("@/components/desktop/apps/EmulatorApp"));
const RuffleApp = React.lazy(() => import("@/components/desktop/apps/RuffleApp"));
const JSDOSApp = React.lazy(() => import("@/components/desktop/apps/JSDOSApp"));
const PGliteApp = React.lazy(() => import("@/components/desktop/apps/PGliteApp"));
const SQLStudioApp = React.lazy(() => import("@/components/desktop/apps/SQLStudioApp"));
const EsbuildApp = React.lazy(() => import("@/components/desktop/apps/EsbuildApp"));
const AILabApp = React.lazy(() => import("@/components/desktop/apps/AILabApp"));
const FFmpegApp = React.lazy(() => import("@/components/desktop/apps/FFmpegApp"));
const ImageLabApp = React.lazy(() => import("@/components/desktop/apps/ImageLabApp"));
const ModelViewerApp = React.lazy(() => import("@/components/desktop/apps/ModelViewerApp"));
const MusicVisualizerApp = React.lazy(() => import("@/components/desktop/apps/MusicVisualizerApp"));
import RunDialog from "@/components/desktop/RunDialog";
import { soundEnabled, setSoundEnabled, sounds } from "@/utils/sounds";
import {
  addDroppedPhoto,
  addFile,
  addFolder,
  deleteFolder as deleteStorageFolder,
  fileToDataUrl,
  readFolders,
  renameFolder,
  setFolderStyle,
} from "@/utils/finderStorage";
import { installClipboardWatcher } from "@/utils/clipboardHistory";
import { spawnSheep } from "@/utils/sheep";
import {
  blobToDataUrl,
  isCapturing,
  startScreenCapture,
  stopScreenCapture,
} from "@/utils/screenCapture";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

/** daedalOS URL loading: /?app=<id> & /?url=<target>. The `app` param
 *  accepts daedalOS process names + our app ids; `url` opens the Browser for
 *  http(s), or routes a local file to its app by extension. */
const URL_APP_ALIASES: Record<string, string> = {
  browser: "website",
  safari: "website",
  chrome: "website",
  fileexplorer: "finder",
  files: "finder",
  explorer: "finder",
  filesystem: "finder",
  winamp: "webamp",
  code: "monaco",
  marked: "markdown",
  pdf: "pdf",
  vim: "vim",
  terminal: "terminal",
  devtools: "devtools",
  paint: "paint",
  photos: "photos",
  settings: "settings",
  games: "games",
};

const URL_EXT_APPS: Record<string, string> = {
  html: "website", htm: "website",
  pdf: "pdf",
  md: "markdown", markdown: "markdown",
  txt: "textedit",
  rtf: "tinymce", wheml: "tinymce",
  mp4: "videos", webm: "videos", mov: "videos", m4v: "videos", mkv: "videos",
  png: "photos", jpg: "photos", jpeg: "photos", gif: "photos", webp: "photos", svg: "photos", heic: "photos", tif: "photos", tiff: "photos",
  mp3: "webamp", wav: "webamp", flac: "webamp", ogg: "webamp",
  tic: "tic80",
  exe: "boxedwine",
  img: "v86", dsk: "v86", bin: "v86", vhd: "v86", vfd: "v86",
  pgn: "games",
  ts: "monaco", tsx: "monaco", js: "monaco", jsx: "monaco", json: "monaco", css: "monaco", scss: "monaco", py: "monaco",
  java: "monaco", c: "monaco", cpp: "monaco", go: "monaco", rs: "monaco", yaml: "monaco", yml: "monaco", sh: "monaco",
};

const APP_VIEWS: Record<string, () => React.JSX.Element> = {
  finder: () => <div />, // replaced with a prop-carrying render below
  about: AboutApp,
  resume: ResumeApp,
  projects: ProjectsApp,
  notes: NotesApp,
  photos: PhotosApp,
  videos: VideosApp,
  maps: MapsApp,
  readme: ReadMeApp,
  // website + textedit + terminal + markdown + games are replaced below with prop-carrying renders
  terminal: () => <div />,
  games: () => <div />,
  paint: PaintApp,
  // webamp + vlc + vim + the emulators are replaced below with prop-carrying renders
  webamp: () => <div />,
  vlc: () => <div />,
  vim: () => <div />,
  monaco: () => <div />,
  tinymce: () => <div />,
  irc: IrcApp,
  tic80: () => <div />,
  classicube: () => <div />,
  boxedwine: () => <div />,
  v86: () => <div />,
  messenger: MessengerApp,
  devtools: () => <div />,
  opentype: () => <div />,
  emulator: () => <div />,
  ruffle: () => <div />,
  pglite: () => <div />,
  sqlstudio: () => <div />,
  esbuild: () => <div />,
  ailab: () => <div />,
  ffmpeg: () => <div />,
  imagelab: () => <div />,
  modelviewer: () => <div />,
  musicviz: () => <div />,
  jsdos: () => <div />,
  settings: () => <div />, // replaced with a prop-carrying render below
};

interface ContextMenuState {
  x: number;
  y: number;
}

interface IconPos {
  x: number;
  y: number;
}

interface MacDesktopProps {
  open: boolean;
  onClose: () => void;
}

/* Desktop icon grid — a real macOS grid: icons flow top-to-bottom in
   columns anchored to the RIGHT edge of the screen (macOS's default), the
   column count grows with the icon count, and cells never overlap (each
   icon owns one cell). Icons are aligned by their centre so the rightmost
   column sits flush against the screen edge, exactly like Finder.
   Dragged icons snap to the nearest free cell on release. Grid pitch
   scales with the icon size setting. */
const ICON_CELL = {
  /** Right margin of the rightmost column, in px. */
  right: 20,
  /** Top of the first row (below the menu bar / widget column). */
  y: 46,
};

/** Grid pitch — icon size plus room for the label + breathing space. */
const pitchFor = (iconSize: number) => Math.round(iconSize * 1.6);

/** How many icons fit per column, given the viewport height. */
const iconRowsFor = (vh: number, pitch: number, y0: number) =>
  Math.max(3, Math.floor((vh - y0 - 140) / pitch));

/** Grid slot for icon index i (top-to-bottom, then the column to its left). */
const iconGridIndex = (
  i: number,
  rows: number,
  pitch: number,
  vw: number,
  y0: number,
  iconSize: number,
): IconPos => {
  const col = Math.floor(i / rows);
  const row = i % rows;
  return {
    x: Math.round(vw - ICON_CELL.right - iconSize / 2 - pitch / 2 - col * pitch),
    y: y0 + row * pitch,
  };
};

/** Snap a free-form drop position to the nearest grid cell. */
const snapToGrid = (
  x: number,
  y: number,
  pitch: number,
  vw: number,
  y0: number,
  iconSize: number,
): IconPos => {
  const centerX = x + pitch / 2;
  const col = Math.max(
    0,
    Math.round((vw - ICON_CELL.right - iconSize / 2 - centerX) / pitch),
  );
  const row = Math.max(0, Math.round((y - y0) / pitch));
  return {
    x: Math.round(vw - ICON_CELL.right - iconSize / 2 - pitch / 2 - col * pitch),
    y: y0 + row * pitch,
  };
};

/** Find the first grid cell not already claimed by another icon. */
const nextFreeCell = (
  occupied: Set<string>,
  rows: number,
  pitch: number,
  vw: number,
  y0: number,
  iconSize: number,
): IconPos => {
  let i = 0;
  while (
    occupied.has(
      `${iconGridIndex(i, rows, pitch, vw, y0, iconSize).x},${iconGridIndex(i, rows, pitch, vw, y0, iconSize).y}`,
    )
  ) {
    i += 1;
    if (i > 999) break;
  }
  return iconGridIndex(i, rows, pitch, vw, y0, iconSize);
};

const cellKey = (p: IconPos) => `${p.x},${p.y}`;

/**
 * The effective icon layout — the one guarantee that keeps the grid stable:
 * icons with a manual (dragged) position claim their cell first, then every
 * other icon fills the next free grid cell in order. Two icons can never
 * occupy the same cell, no matter how the manual map drifts.
 */
const layoutIcons = (
  items: Array<{ id: string; title: string }>,
  manual: Record<string, IconPos>,
  rows: number,
  pitch: number,
  vw: number,
  y0: number,
  iconSize: number,
): Map<string, IconPos> => {
  const occupied = new Set<string>();
  const out = new Map<string, IconPos>();
  // 1. Manual positions first (list order is deterministic).
  for (const it of items) {
    const pos = manual[it.id];
    if (pos && !occupied.has(cellKey(pos))) {
      out.set(it.id, pos);
      occupied.add(cellKey(pos));
    }
  }
  // 2. Everyone else fills the next free cell in order.
  let slot = 0;
  for (const it of items) {
    if (out.has(it.id)) continue;
    let pos = iconGridIndex(slot, rows, pitch, vw, y0, iconSize);
    while (occupied.has(cellKey(pos))) {
      slot += 1;
      pos = iconGridIndex(slot, rows, pitch, vw, y0, iconSize);
    }
    out.set(it.id, pos);
    occupied.add(cellKey(pos));
    slot += 1;
  }
  return out;
};

export default function MacDesktop({ open, onClose }: MacDesktopProps) {
  const [booting, setBooting] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [missionControl, setMissionControl] = useState(false);
  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const [notifCenter, setNotifCenter] = useState(false);
  const [controlCenter, setControlCenter] = useState(false);
  const [switcher, setSwitcher] = useState<{ apps: string[]; index: number } | null>(null);
  const [iconMenu, setIconMenu] = useState<{
    id: string;
    kind: "app" | "folder";
    x: number;
    y: number;
    title?: string;
  } | null>(null);
  // Tahoe folder customization — color submenu + emoji badge picker.
  const [iconMenuSub, setIconMenuSub] = useState<"color" | "emoji" | null>(null);
  const [folderEmojiFor, setFolderEmojiFor] = useState<string | null>(null);
  // Mobile context menu (bottom sheet) — replaces right-click on touch.
  const [mobileCtx, setMobileCtx] = useState<{
    items: ContextMenuItem[];
    title?: string;
  } | null>(null);
  // Inline rename of a wallpaper folder (macOS: name is pre-selected).
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [wallpaperPicker, setWallpaperPicker] = useState(false);
  // macOS Spaces: the current desktop (each has its own wallpaper).
  const [currentSpace, setCurrentSpace] = useState(DEFAULT_SPACES[0].id);
  useEffect(() => {
    setSpaceContext(currentSpace);
  }, [currentSpace]);
  const [toast, setToast] = useState<string | null>(null);
  const [closingIds, setClosingIds] = useState<Set<string>>(new Set());
  const [minimizingIds, setMinimizingIds] = useState<Set<string>>(new Set());
  const [iconPos, setIconPos] = useState<Record<string, IconPos>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<IconPos | null>(null);
  const [notifications, setNotifications] = useState<OsNotification[]>([]);
  const [locked, setLocked] = useState(false);
  const [banner, setBanner] = useState<OsNotification | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [infoFor, setInfoFor] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const [quickLook, setQuickLook] = useState<QuickLookFile | null>(null);
  const [osd, setOsd] = useState<{ kind: "volume" | "brightness"; value: number } | null>(null);
  const [dndOn, setDndOn] = useState(false);
  const [showDesktop, setShowDesktop] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const captureRef = useRef<{ finished: Promise<Blob>; stop: () => void } | null>(null);
  const hiddenForDesktop = useRef<string[]>([]);
  const desktopRef = useRef<HTMLDivElement>(null);
  // Widgets: edit mode + measured column height (icons sit below it).
  const [widgetsEditing, setWidgetsEditing] = useState(false);
  const widgetsRef = useRef<HTMLDivElement>(null);
  const [widgetsBottom, setWidgetsBottom] = useState(0);
  // v2: the wallpaper list was rebuilt (no more fake/Windows wallpapers) —
  // bumping the key discards stale saved indices/positions that could render
  // a black wallpaper or a broken layout.
  const SETTINGS_KEY = "aryan-os-settings-v2";

/** Mobile breakpoint — same as useIsMobile. */
const MOBILE_BP = 768;

  const loadSettings = (): SystemState => {
    const defaults: SystemState = {
      wifiOn: true,
      bluetoothOn: true,
      airdropOn: false,
      darkMode: true,
      accentColor: "blue",
      soundOn: soundEnabled(),
      volume: 90,
      brightness: 100,
      clockStyle: "default",
      clockSource: "local",
      reduceTransparency: false,
      // macOS Tahoe ships with default desktop widgets on the wallpaper.
      showWidgets: true,
      slideshow: false,
      slideshowInterval: 20,
      wallpaperFit: "fill",
      widgetStyle: "default",
      dockSize: 56,
      dockMagnify: true,
      dockMagnifySize: 88,
      dockPosition: "bottom",
      minimizeEffect: "genie",
      // macOS-style: the menu bar hides itself and reappears on hover.
      dockAutoHide: false,
      autoHideMenuBar: true,
      menuBarStyle: "transparent",
      stageManager: false,
      showBatteryPct: true,
      screensaverStyle: "flurry",
      screensaverDelay: 10,
      notifPrefs: {},
      controlTiles: [...CONTROL_TILE_IDS],
      widgets: [...DEFAULT_WIDGETS],
      spaces: DEFAULT_SPACES.map((s) => ({ ...s })),
      hotCorners: { ...DEFAULT_HOT_CORNERS },
      pinchLaunchpad: true,
      swipeMissionControl: true,
      desktopSort: "none",
      desktopIconSize: 58,
      desktopIconReset: 0,
      launchpadItems: DESKTOP_APPS.filter(
        (a) => !["pdf", "markdown"].includes(a.id),
      ).map((a) => ({ kind: "app", id: a.id })),
      launchpadFolders: [],
      launchpadHidden: [],
      desktopFolders: [],
    };
    if (typeof window === "undefined") return defaults;
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaults;
      const saved = JSON.parse(raw) as Partial<SystemState>;
      // The Aryan Stats widget was removed — drop any stale saved id so it
      // never renders as a ghost card in the wallpaper column.
      if (Array.isArray(saved.widgets)) {
        saved.widgets = saved.widgets.filter((w) =>
          (WIDGET_IDS as readonly string[]).includes(w),
        );
      }
      return { ...defaults, ...saved };
    } catch {
      return defaults;
    }
  };

  const [sys, setSys] = useState<SystemState>(loadSettings);

  /* Persist every settings change (dock, wallpaper style, Stage Manager…). */
  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(sys));
    } catch {
      /* storage unavailable (private mode) — settings just won't persist */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sys]);

  const isMobile = useIsMobile();
  const manager = useWindowManager();
  const windowsRef = useRef(manager.windows);
  windowsRef.current = manager.windows;
  const openWindowRef = useRef<(appId: string) => void>(() => {});
  const notifSeq = useRef(0);
  const bannerTimer = useRef<number | null>(null);
  const idleTimer = useRef<number | null>(null);
  const osdTimer = useRef<number | null>(null);

  /* ----- open: boot straight into the lock screen (no Apple boot loader) ----- */
  useEffect(() => {
    if (!open) return;
    setBooting(false);
    setLocked(true);
    sounds.bootChime();
  }, [open]);

  /* ----- fullscreen is OPT-IN only -----
     The desktop never hijacks the browser's full screen on its own — the
     visitor controls it from the menu-bar fullscreen button (MenuBar's
     toggleFullscreen), so this OS always feels like a window inside the
     visitor's own machine, not a takeover. */

  /* ----- body scroll lock ----- */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* ----- Tahoe Spotlight clipboard history: capture ⌘C / ⌘X ----- */
  useEffect(() => installClipboardWatcher(), []);

  /* ----- lock screen after a configurable delay of inactivity -----
     Real macOS Tahoe: with "Require password after screen saver begins"
     set, the machine drops to the lock screen after idle — the saver never
     shows bare. So the idle timer locks the machine (wallpaper + clock +
     password field), not a screensaver animation. */
  useEffect(() => {
    if (!open) return;
    // 1 min = 75s (keeps the demo snappy); other values are real minutes.
    const delayMs =
      sys.screensaverDelay === 0
        ? null
        : sys.screensaverDelay === 1
          ? 75_000
          : sys.screensaverDelay * 60_000;
    const resetIdle = () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      if (locked || booting || delayMs === null) return;
      idleTimer.current = window.setTimeout(() => setLocked(true), delayMs);
    };
    const handler = () => {
      resetIdle();
    };
    const events: Array<keyof WindowEventMap> = [
      "pointermove",
      "pointerdown",
      "keydown",
      "wheel",
      "touchstart",
    ];
    events.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));
    // Games (WASM + web plays) run inside iframes — their pointer/key events
    // never bubble to the parent window, so the idle timer would fire while
    // actively playing. Catch activity from any same-origin iframe too.
    const watchFrames = () => {
      document.querySelectorAll<HTMLIFrameElement>("iframe").forEach((frame) => {
        try {
          const doc = frame.contentDocument;
          if (!doc) return;
          events.forEach((ev) => {
            doc.removeEventListener(ev, handler as EventListener);
            doc.addEventListener(ev, handler as EventListener, { passive: true });
          });
        } catch {
          // Cross-origin iframe — its own activity is invisible; fine.
        }
      });
    };
    watchFrames();
    const frameObserver = new MutationObserver(watchFrames);
    frameObserver.observe(document.body, { childList: true, subtree: true });
    resetIdle();
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handler));
      frameObserver.disconnect();
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, locked, booting, sys.screensaverDelay]);

  const pushNotif = (icon: string, title: string, body: string, appId = "finder") => {
    // Settings → Notifications: the app can be muted entirely.
    const pref = sys.notifPrefs[appId];
    if (pref && !pref.allow) return;

    const now = new Date();
    const time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    // Alerts stay on screen until dismissed; banners auto-fade after 4.5s.
    const style = pref?.style ?? "banners";
    notifSeq.current += 1;
    const n: OsNotification = {
      id: `${Date.now()}-${notifSeq.current}`,
      icon,
      title,
      body,
      time,
      persistent: style === "alerts",
    };
    setNotifications((list) => [n, ...list].slice(0, 6));
    // transient banner, like real macOS (suppressed while Do Not Disturb is on)
    if (!dndOn && style !== "none") {
      setBanner(n);
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
      if (style !== "alerts") {
        bannerTimer.current = window.setTimeout(() => setBanner(null), 4500);
      }
    }
  };

  const patchSys = (patch: Partial<SystemState>) => {
    if (patch.soundOn !== undefined) setSoundEnabled(patch.soundOn);
    if (patch.volume !== undefined) sounds.setVolume(patch.volume / 100);
    setSys((s) => ({ ...s, ...patch }));
  };

  /* ----- wallpaper slideshow: rotate through the real wallpapers ----- */
  useEffect(() => {
    if (!sys.slideshow || locked || booting) return;
    const id = window.setInterval(() => {
      setSys((s) => {
        const sp = s.spaces.find((x) => x.id === currentSpace);
        if (!sp) return s;
        const next = (sp.wallpaperIndex + 1) % WALLPAPERS.length;
        return {
          ...s,
          spaces: s.spaces.map((x) =>
            x.id === currentSpace
              ? { ...x, wallpaperIndex: next, customWallpaper: undefined, customWallpaperName: undefined }
              : x,
          ),
        };
      });
    }, Math.max(5, sys.slideshowInterval) * 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sys.slideshow, sys.slideshowInterval, currentSpace, locked, booting]);

  /* ----- power: restart & log out clear the session (daedalOS Power) ----- */
  const clearSession = () => {
    try {
      // daedalOS resetStorage: wipe the machine's entire local session.
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // ignore storage errors
    }
  };

  const restart = () => {
    manager.windows.forEach((w) => manager.closeWindow(w.id));
    clearSession();
    setSys(loadSettings());
    setBooting(true);
    setLocked(true);
    window.setTimeout(() => {
      setBooting(false);
      sounds.bootChime();
    }, 1100);
  };

  const logOut = () => {
    manager.windows.forEach((w) => manager.closeWindow(w.id));
    clearSession();
    setSys(loadSettings());
    setLocked(true);
    sounds.swoosh();
  };

  const requestRestart = () =>
    setAlert({
      title: "Are you sure you want to restart your computer now?",
      message: "Your session will be cleared and Aryan OS will start up again.",
      confirmLabel: "Restart",
      onConfirm: restart,
    });

  const requestLogOut = () =>
    setAlert({
      title: "Are you sure you want to log out?",
      message: "Your session will be cleared and Aryan OS will return to the login screen.",
      confirmLabel: "Log Out",
      onConfirm: logOut,
    });

  const requestShutDown = () =>
    setAlert({
      title: "Are you sure you want to shut down your computer now?",
      message: "Aryan OS will stop.",
      confirmLabel: "Shut Down",
      destructive: true,
      onConfirm: onClose,
    });

  const requestEmptyTrash = () =>
    setAlert({
      title: "Empty the Trash?",
      message: "The Trash is already empty — nothing will be deleted.",
      confirmLabel: "Empty",
      onConfirm: () => {
        sounds.whoosh();
        showToast("Trash is empty");
        pushNotif("trash", "Trash", "The Trash is empty.", "finder");
      },
    });

  const sleep = () => {
    patchSys({ brightness: 0 });
    sounds.swoosh();
  };

  const bringAllToFront = () => {
    const appId = focusedWindow?.appId;
    if (!appId) return;
    manager.windows
      .filter((w) => w.appId === appId)
      .forEach((w) => manager.bringToFront(w.id));
  };

  /* ----- keyboard media keys show the macOS-style on-screen display ----- */
  const showOsd = (kind: "volume" | "brightness", value: number) => {
    setOsd({ kind, value });
    if (osdTimer.current) window.clearTimeout(osdTimer.current);
    osdTimer.current = window.setTimeout(() => setOsd(null), 1200);
  };

  const adjustVolume = (delta: number) => {
    const v = Math.max(0, Math.min(100, sys.volume + delta));
    patchSys({ volume: v });
    sounds.tick();
    showOsd("volume", v);
  };

  const adjustBrightness = (delta: number) => {
    const v = Math.max(0, Math.min(100, sys.brightness + delta));
    patchSys({ brightness: v });
    showOsd("brightness", v);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  /* ----- drag & drop external files onto the desktop (daedalOS File Explorer) ----- */
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);

  // Swipe gestures on the desktop for notification center (swipe down)
  // and control center (swipe up) — standard iOS patterns.
  const desktopTouchStartY = useRef<number | null>(null);
  const desktopTouchStartX = useRef<number | null>(null);

  // Long-press on wallpaper → context menu (mobile alternative to right-click)
  const wallpaperLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wallpaperLongPressClear = () => {
    if (wallpaperLongPressTimer.current) {
      clearTimeout(wallpaperLongPressTimer.current);
      wallpaperLongPressTimer.current = null;
    }
  };
  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (!files.length) return;
    let photos = 0;
    let docs = 0;
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const dataUrl = await fileToDataUrl(file);
        if (dataUrl) {
          addDroppedPhoto(file.name, dataUrl);
          photos += 1;
        }
      } else if (file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".pgn")) {
        const text = await file.text().catch(() => "");
        addFile(file.name, text);
        docs += 1;
      } else if (/\.(m3u|m3u8)$/i.test(file.name)) {
        // Playlists are text — parsed into tracks by Webamp.
        const text = await file.text().catch(() => "");
        addFile(file.name, text);
        docs += 1;
      } else if (/\.(mp3|wav|ogg|oga|flac|aac|m4a|opus|wma|webm|wsz|zip|iso|7z|tar|tgz|gz|xz|bz2|rar|otf|ttf|woff|woff2)$/i.test(file.name)) {
        // Audio, Winamp skins, archives (incl. 7z/tar/gz — Extract Here via
        // the 7-Zip WASM) + fonts persist as data URLs so Finder can
        // reopen/browse them (daedalOS file association); big files
        // best-effort.
        const dataUrl = await fileToDataUrl(file);
        if (dataUrl) {
          addFile(file.name, dataUrl);
          docs += 1;
        }
      } else if (/\.(nes|smc|sfc|gb|gbc|gba|n64|z64|v64|gen|md|smd|sms|gg|a26|a52|a78|pce|nds|ws|wsc|vb|vboy|j64|jag|lnx|ngp|ngc|32x|swf|spl|jsdos|exe|com|bat)$/i.test(file.name)) {
        // ROMs, Flash movies + DOS games persist so Finder reopens them in the
        // emulators (daedalOS file association); big files best-effort.
        const dataUrl = await fileToDataUrl(file);
        if (dataUrl) {
          addFile(file.name, dataUrl);
          docs += 1;
        }
      }
    }
    if (photos) {
      showToast(`${photos} photo${photos > 1 ? "s" : ""} added to Photos`);
      pushNotif("image", "Photos", `${photos} photo${photos > 1 ? "s" : ""} imported from your device.`, "photos");
    }
    if (docs) {
      showToast(`${docs} document${docs > 1 ? "s" : ""} saved to Documents`);
      pushNotif("file-text", "Finder", `${docs} document${docs > 1 ? "s" : ""} saved to Documents.`, "finder");
    }
    if (!photos && !docs) {
      showToast("Dropped file type isn't supported");
    }
  };

  const closeWindowAnimated = (id: string) => {
    setClosingIds((s) => new Set(s).add(id));
    window.setTimeout(() => {
      manager.closeWindow(id);
      setClosingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }, 190);
  };

  const minimizeWindowAnimated = (id: string) => {
    sounds.swoosh();
    setMinimizingIds((s) => new Set(s).add(id));
    window.setTimeout(() => {
      manager.minimizeWindow(id);
      setMinimizingIds((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }, 360);
  };

  // Finder windows opened at a specific location (e.g. the Projects folder).
  const finderLocs = useRef<Record<string, string>>({});
  const openFinderAt = (loc: string) => {
    const id = manager.openWindow("finder", { multi: true });
    finderLocs.current[id] = loc;
    sounds.pop();
  };

  const openWindow = (appId: string) => {
    // Projects is a folder — it opens in the Finder, not a bespoke app.
    if (appId === "projects") {
      openFinderAt("Projects");
      return;
    }
    // LinkedIn and GitHub open in the Browser (web shortcuts on desktop).
    if (appId === "linkedin") {
      openWebUrl("https://linkedin.com/in/aryanbatra", "LinkedIn");
      return;
    }
    if (appId === "github") {
      openWebUrl("https://github.com/aryanbatras", "GitHub");
      return;
    }
    manager.openWindow(appId, { maximized: isMobile });
    sounds.pop();
  };
  openWindowRef.current = openWindow;

  // daedalOS-style URL loading: /?app=<id> and /?url=<target> open an app
  // once the machine boots (e.g. /?app=notes, /?url=https://github.com,
  // /?app=browser&url=https://…, /?url=/aryan/documents/a2b-offer-letter.pdf).
  const appOpenedFromUrl = useRef(false);
  useEffect(() => {
    if (locked || booting || appOpenedFromUrl.current) return;
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get("app");
    const urlParam = params.get("url");
    if (!appParam && !urlParam) return;
    appOpenedFromUrl.current = true;

    const resolveApp = (raw: string): string | undefined => {
      const id = (raw || "").toLowerCase();
      return (
        URL_APP_ALIASES[id] ??
        DESKTOP_APPS.find((a) => a.id === id)?.id
      );
    };
    const isBrowserUrl = (u: string) => /^(https?:|chrome:)/i.test(u);
    const hostOf = (u: string) => {
      try {
        return new URL(u).hostname || u;
      } catch {
        return u;
      }
    };
    const nameOf = (u: string) => u.split("/").pop() || u;

    const openByUrl = (url: string) => {
      if (isBrowserUrl(url)) {
        openWebUrl(url, hostOf(url));
        return;
      }
      const ext = (url.split(".").pop() || "").toLowerCase();
      const appId = URL_EXT_APPS[ext];
      if (!appId) {
        openWindow("finder");
        return;
      }
      if (appId === "pdf") {
        openDocument(url, nameOf(url));
      } else if (appId === "website") {
        openWebUrl(url, nameOf(url));
      } else {
        openWindow(appId);
      }
    };

    if (appParam) {
      const id = resolveApp(appParam);
      if (!id) return;
      if (urlParam && id === "pdf") {
        openDocument(urlParam, nameOf(urlParam));
      } else if (urlParam && id === "website") {
        openWebUrl(urlParam, isBrowserUrl(urlParam) ? hostOf(urlParam) : nameOf(urlParam));
      } else if (urlParam && id !== "website") {
        // ?app=<app>&url=<file> — open the app itself with no payload.
        openWindow(id);
      } else {
        openWindow(id);
      }
    } else if (urlParam) {
      openByUrl(urlParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, booting]);

  // Documents (PDFs) open in their own window, each with its own src.
  const [pdfSrcs, setPdfSrcs] = useState<Record<string, string>>({});
  const openDocument = (src: string, name: string) => {
    const id = manager.openWindow("pdf", { title: name, multi: true });
    setPdfSrcs((m) => ({ ...m, [id]: src }));
    sounds.pop();
  };
  // .url files open the Browser at a specific site, each in its own window.
  const [webUrls, setWebUrls] = useState<Record<string, string>>({});
  const openWebUrl = (url: string, name: string) => {
    const id = manager.openWindow("website", { title: name, multi: true });
    setWebUrls((m) => ({ ...m, [id]: url }));
    sounds.pop();
  };
  // Text documents open in TextEdit, each with its own file.
  const [editDocs, setEditDocs] = useState<Record<string, { name: string; content?: string }>>({});
  const openTextEdit = (name: string, content?: string) => {
    const id = manager.openWindow("textedit", { title: name, multi: true });
    setEditDocs((m) => ({ ...m, [id]: { name, content } }));
    sounds.pop();
  };
  // Markdown files render in the Markdown viewer (daedalOS Marked).
  const [mdDocs, setMdDocs] = useState<Record<string, { name: string; content?: string }>>({});
  const openMarkdown = (name: string, content?: string) => {
    const id = manager.openWindow("markdown", { title: name, multi: true });
    setMdDocs((m) => ({ ...m, [id]: { name, content } }));
    sounds.pop();
  };
  // PGN game records open in Chess, each in its own games window (daedalOS).
  const [chessDocs, setChessDocs] = useState<Record<string, { name: string; content?: string }>>({});
  const [webPlayUrls, setWebPlayUrls] = useState<Record<string, string>>({});
  // Audio / playlist / skin files open in Webamp, each in its own window.
  const [webampDocs, setWebampDocs] = useState<Record<string, { name: string }>>({});
  const openWebamp = (name: string) => {
    const id = manager.openWindow("webamp", { title: name, multi: true });
    setWebampDocs((m) => ({ ...m, [id]: { name } }));
    sounds.pop();
  };
  // Movies open in the VLC player, each with its own data URL.
  const [vlcDocs, setVlcDocs] = useState<Record<string, { file?: string }>>({});
  const openVlc = (file?: string) => {
    const id = manager.openWindow("vlc", {
      title: file ?? "VLC",
      multi: true,
    });
    setVlcDocs((m) => ({ ...m, [id]: { file } }));
    sounds.pop();
  };
  // Text files can be opened straight in Vim (daedalOS file association).
  const [vimDocs, setVimDocs] = useState<Record<string, { name?: string; content?: string }>>({});
  const openVim = (name?: string, content?: string) => {
    const id = manager.openWindow("vim", { title: name ?? "Vim", multi: true });
    setVimDocs((m) => ({ ...m, [id]: { name, content } }));
    sounds.pop();
  };
  // Font files open in the OpenType viewer, each with its file name.
  const [fontDocs, setFontDocs] = useState<Record<string, { file?: string }>>({});
  const openFont = (file?: string) => {
    const id = manager.openWindow("opentype", { title: file ?? "OpenType", multi: true });
    setFontDocs((m) => ({ ...m, [id]: { file } }));
    sounds.pop();
  };
  // Code files open in the Monaco editor (daedalOS file association).
  const [monacoDocs, setMonacoDocs] = useState<Record<string, { name?: string; content?: string }>>({});
  const openMonaco = (name?: string, content?: string) => {
    const id = manager.openWindow("monaco", { title: name ?? "Monaco", multi: true });
    setMonacoDocs((m) => ({ ...m, [id]: { name, content } }));
    sounds.pop();
  };
  // Rich-text files open in TinyMCE (daedalOS .rtf/.whtml association).
  const [tinymceDocs, setTinymceDocs] = useState<Record<string, { name?: string }>>({});
  const openTinymce = (name?: string) => {
    const id = manager.openWindow("tinymce", { title: name ?? "TinyMCE", multi: true });
    setTinymceDocs((m) => ({ ...m, [id]: { name } }));
    sounds.pop();
  };
  // TIC-80 fantasy computer — a .tic cart opens straight into it.
  const [tic80Docs, setTic80Docs] = useState<Record<string, { name?: string }>>({});
  const openTic80 = (name?: string) => {
    const id = manager.openWindow("tic80", { title: name ?? "TIC-80", multi: true });
    setTic80Docs((m) => ({ ...m, [id]: { name } }));
    sounds.pop();
  };
  // BoxedWine — .exe / .zip Windows apps boot in the emulator.
  const [boxedwineDocs, setBoxedwineDocs] = useState<Record<string, { name?: string }>>({});
  const openBoxedWine = (name?: string) => {
    const id = manager.openWindow("boxedwine", { title: name ?? "BoxedWine", multi: true });
    setBoxedwineDocs((m) => ({ ...m, [id]: { name } }));
    sounds.pop();
  };
  // Virtual x86 — .img / .iso disk images boot in the PC emulator.
  const [v86Docs, setV86Docs] = useState<Record<string, { name?: string }>>({});
  const openV86 = (name?: string) => {
    const id = manager.openWindow("v86", { title: name ?? "Virtual x86", multi: true });
    setV86Docs((m) => ({ ...m, [id]: { name } }));
    sounds.pop();
  };
  // ROMs / Flash / DOS games open in the emulators (daedalOS associations).
  const [emuDocs, setEmuDocs] = useState<Record<string, { app: string; name: string }>>({});
  const openEmulator = (app: string, name: string) => {
    const id = manager.openWindow(app, { title: name, multi: true });
    setEmuDocs((m) => ({ ...m, [id]: { app, name } }));
    sounds.pop();
  };
  const openChess = (name: string, content?: string) => {
    const id = manager.openWindow("game-chess", { title: name, multi: true, maximized: true });
    setChessDocs((m) => ({ ...m, [id]: { name, content } }));
    sounds.pop();
  };

  // macOS Tahoe: picking a game opens it in its OWN maximized window with
  // the standard titlebar — play fills the whole screen, exactly like a real
  // game on the Mac.
  const openGame = (gameId: string, title: string, url?: string) => {
    const id = manager.openWindow(`game-${gameId}`, {
      title,
      multi: true,
      maximized: true,
    });
    if (url) setWebPlayUrls((m) => ({ ...m, [id]: url }));
    sounds.pop();
  };
  // Finder's onOpenApp — web shortcuts carry a url, documents a src,
  // text documents a name (content lets archive entries open in TextEdit).
  const handleOpen = (appId: string, src?: string, name?: string, url?: string, content?: string) => {
    if (url) openWebUrl(url, name ?? "Safari");
    else if (src) openDocument(src, name ?? "PDF");
    else if (appId === "markdown") openMarkdown(name ?? "Untitled.md", content);
    else if (appId === "textedit") openTextEdit(name ?? "Untitled.txt", content);
    else if (appId === "chess") openChess(name ?? "game.pgn");
    else if (appId === "webamp") openWebamp(name ?? "track.mp3");
    // Movies resolve their data URL by file name inside VlcApp.
    else if (appId === "vlc") openVlc(name ?? "Movie");
    else if (appId === "vim") openVim(name ?? "untitled.txt", content);
    else if (appId === "monaco") openMonaco(name ?? "untitled.ts", content);
    else if (appId === "tinymce") openTinymce(name ?? "New Rich Text Document.whtml");
    else if (appId === "tic80") openTic80(name ?? "cart.tic");
    else if (appId === "boxedwine") openBoxedWine(name ?? "program.exe");
    else if (appId === "v86") openV86(name ?? "disk.img");
    else if (appId === "opentype") openFont(name ?? "font.otf");
    else if (appId === "emulator" || appId === "ruffle" || appId === "jsdos")
      openEmulator(appId, name ?? "game");
    else openWindow(appId);
  };

  // daedalOS Run dialog — ⌘⇧R or the Apple menu → type an app name.
  const [runOpen, setRunOpen] = useState(false);
  const openRun = () => setRunOpen(true);

  const unlock = () => {
    // Real macOS never fires a "Welcome" notification on unlock — the
    // machine simply appears. Just drop the lock screen.
    setLocked(false);
  };

  const quitApp = (appId: string) => {
    manager.windows
      .filter((w) => w.appId === appId)
      .forEach((w) => closeWindowAnimated(w.id));
  };

  /* daedalOS “Set as wallpaper”: a Finder image becomes this desktop's background. */
  const setCustomWallpaper = (src: string, name: string) => {
    patchSys({
      spaces: sys.spaces.map((s) =>
        s.id === currentSpace
          ? { ...s, customWallpaper: src, customWallpaperName: name }
          : s,
      ),
    });
    sounds.pop();
    showToast("Wallpaper updated");
    pushNotif("image", "Wallpaper", `Set “${name}” as the wallpaper.`, "settings");
  };

  const handleSpotlightPick = (action: string) => {
    if (action === "about") {
      setAboutOpen(true);
      return;
    }
    if (action === "toggle-dark") {
      patchSys({ darkMode: !sys.darkMode });
      return;
    }
    if (action === "lock") {
      setLocked(true);
      return;
    }
    if (action.startsWith("app:")) openWindow(action.slice(4));
  };

  const focusedWindow = manager.windows.find((w) => w.id === manager.focusedId) ?? null;
  const anyMaximized = manager.windows.some(
    (w) => w.maximized && w.spaceId === currentSpace,
  );

  /* ----- Show Desktop: clicking the wallpaper hides/restores every window ----- */
  const toggleShowDesktop = () => {
    if (showDesktop) {
      hiddenForDesktop.current.forEach((id) => manager.restoreWindow(id));
      hiddenForDesktop.current = [];
      setShowDesktop(false);
      return;
    }
    const open = manager.windows.filter(
      (w) => !w.minimized && w.spaceId === currentSpace,
    );
    if (open.length === 0) return;
    hiddenForDesktop.current = open.map((w) => w.id);
    open.forEach((w) => manager.minimizeWindow(w.id));
    setShowDesktop(true);
  };

  /* ----- Stage Manager: arrange the focused app's windows front and center ----- */
  useEffect(() => {
    if (!sys.stageManager) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const stripW = vw < 640 ? 0 : 132;
    const stageLeft = stripW + 20;
    const stageTop = 46;
    const stageW = Math.max(320, vw - stripW - 40);
    const stageH = Math.max(300, vh - 46 - 108);

    const visible = manager.windows.filter(
      (w) => !w.minimized && !w.maximized && w.spaceId === currentSpace,
    );
    const focusedApp = manager.focusedId
      ? manager.windows.find((w) => w.id === manager.focusedId)?.appId
      : null;
    const staged = focusedApp
      ? visible.filter((w) => w.appId === focusedApp)
      : visible;

    const n = Math.max(1, staged.length);
    const offX = (n - 1) * 26;
    const offY = (n - 1) * 20;
    staged.forEach((w, i) => {
      const ww = Math.min(w.w, stageW - offX);
      const wh = Math.min(w.h, stageH - offY);
      const x = stageLeft + (stageW - ww) / 2 + i * 26 - offX / 2;
      const y = stageTop + (stageH - wh) / 2 + i * 20 - offY / 2;
      if (Math.abs(w.x - x) > 1 || Math.abs(w.y - y) > 1) {
        manager.moveWindow(w.id, Math.round(x), Math.round(y));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sys.stageManager, manager.windows.length, manager.focusedId, currentSpace]);

  /* ----- keyboard shortcuts ----- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // An inner app (Finder F2 rename, Monaco Ctrl+S, …) that handled the key
      // prevents the default; don't also run the global shortcut on top of it.
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");

      // Esc always works — dismiss the topmost surface, or close the machine.
      // Handled first so it also works while the screen is locked (that's the
      // quick way out of the desktop).
      if (e.key === "Escape") {
        if (alert) setAlert(null);
        else if (quickLook) setQuickLook(null);
        else if (switcher) setSwitcher(null);
        // In Launchpad edit mode, Esc exits edit mode first (handled by the
        // Launchpad itself) — only close it when it isn't editing.
        else if (
          launchpadOpen &&
          document.querySelector('[data-launchpad-editing="1"]')
        ) {
          /* let the Launchpad exit edit mode */
        } else if (launchpadOpen) setLaunchpadOpen(false);
        else if (missionControl) setMissionControl(false);
        else if (controlCenter) setControlCenter(false);
        else if (notifCenter) setNotifCenter(false);
        else if (emojiOpen) setEmojiOpen(false);
        else if (focusedWindow?.maximized) manager.toggleMaximize(focusedWindow.id);
        else if (iconMenu) setIconMenu(null);
        else if (infoFor) setInfoFor(null);
        else if (wallpaperPicker) setWallpaperPicker(false);
        else if (contextMenu) setContextMenu(null);
        else if (spotlightOpen) setSpotlightOpen(false);
        else if (aboutOpen) setAboutOpen(false);
        else onClose();
        return;
      }

      // While the screen is locked, only the password field is live.
      if (locked && !typing) return;

      if (
        e.key === "F11" ||
        e.key === "F12" ||
        e.key === "F1" ||
        e.key === "F2"
      ) {
        e.preventDefault();
        if (e.key === "F11") adjustVolume(-10);
        else if (e.key === "F12") adjustVolume(10);
        else if (e.key === "F1") adjustBrightness(-10);
        else adjustBrightness(10);
        return;
      }

      if (e.key === "F3" || (e.ctrlKey && e.key === "ArrowUp")) {
        e.preventDefault();
        setMissionControl((v) => !v);
        return;
      }
      if (e.key === "F4") {
        e.preventDefault();
        setLaunchpadOpen((v) => !v);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSpotlightOpen((v) => !v);
        return;
      }
      // ⌘⌥I — DevTools (daedalOS's SHIFT+F12 equivalent).
      if (
        (e.metaKey || e.ctrlKey) &&
        e.altKey &&
        e.key.toLowerCase() === "i"
      ) {
        e.preventDefault();
        openWindow("devtools");
        return;
      }
      // ⌘Tab app switcher (also cycles while the switcher is open)
      if (e.key === "Tab" && (e.metaKey || e.ctrlKey || switcher)) {
        e.preventDefault();
        setSwitcher((s) => {
          const apps =
            s?.apps ??
            Array.from(new Set(windowsRef.current.map((w) => w.appId)));
          if (apps.length === 0) return null;
          if (!s) return { apps, index: 0 };
          const dir = e.shiftKey ? -1 : 1;
          return { apps, index: (s.index + dir + apps.length) % apps.length };
        });
        return;
      }
      if (e.key === "Meta" && switcher) {
        const appId = switcher.apps[switcher.index];
        openWindowRef.current?.(appId);
        setSwitcher(null);
        return;
      }
      if (typing) return;

      if (e.metaKey && e.ctrlKey && e.key === " ") {
        e.preventDefault();
        setEmojiOpen((v) => !v);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === " ") {
        e.preventDefault();
        setSpotlightOpen((v) => !v);
        return;
      }
      if (e.metaKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (focusedWindow) closeWindowAnimated(focusedWindow.id);
        return;
      }
      if (e.metaKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        if (focusedWindow) minimizeWindowAnimated(focusedWindow.id);
        return;
      }
      if (e.metaKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (focusedWindow) openWindow(focusedWindow.appId);
        return;
      }
      if (e.metaKey && e.key === ",") {
        e.preventDefault();
        openWindow("settings");
        return;
      }
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        setRunOpen(true);
        return;
      }
      if (e.metaKey && e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (focusedWindow) manager.toggleMaximize(focusedWindow.id);
        return;
      }
      if (e.metaKey && e.key === "`") {
        e.preventDefault();
        const appId = focusedWindow?.appId;
        if (!appId) return;
        const same = manager.windows.filter((w) => w.appId === appId && !w.minimized);
        if (same.length > 1) {
          const idx = same.findIndex((w) => w.id === focusedWindow?.id);
          manager.bringToFront(same[(idx + 1) % same.length].id);
        }
        return;
      }
      if (e.metaKey && e.ctrlKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        setLocked(true);
        return;
      }
      if (e.metaKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        onClose();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, locked, sys, missionControl, launchpadOpen, notifCenter, controlCenter, switcher, emojiOpen, infoFor, alert, quickLook, iconMenu, wallpaperPicker, contextMenu, spotlightOpen, aboutOpen, focusedWindow, onClose]);

  /* ----- desktop icon drag ----- */
  const dragState = useRef<{
    appId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  /* ----- desktop icon grid (never overlaps) -----
     Pitch scales with the icon-size setting (Settings → Desktop & Dock →
     Desktop → Icon size); resizing the window recomputes the row count.
     The grid is anchored to the right edge and starts below the widget
     column when widgets are visible (both macOS defaults). */
  const iconStartY = () =>
    Math.round(widgetsBottom > 0 ? widgetsBottom + 10 : ICON_CELL.y);
  const iconPitch = pitchFor(sys.desktopIconSize);
  const [gridRows, setGridRows] = useState(() =>
    typeof window === "undefined" ? 6 : iconRowsFor(window.innerHeight, pitchFor(58), 46),
  );
  // Viewport width in state — the grid is anchored to the RIGHT edge, so a
  // width change must re-flow every icon. Reading window.innerWidth only at
  // render time never updates when the height (gridRows) doesn't change, so
  // shrinking the window left icons hanging off the right edge.
  const [vw, setVw] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );
  useEffect(() => {
    setVw(window.innerWidth);
    setGridRows(iconRowsFor(window.innerHeight, iconPitch, iconStartY()));
    const onResize = () => {
      setVw(window.innerWidth);
      setGridRows(iconRowsFor(window.innerHeight, iconPitch, iconStartY()));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [iconPitch, widgetsBottom]);

  // Everything on the wallpaper — the fixed apps plus user folders. Sorted
  // (macOS right-click → Sort By) before grid placement when sorting is on.
  const sortDesktopIcons = <T,>(list: T[]): T[] => {
    if (sys.desktopSort === "none") return list;
    const sorted = [...list];
    sorted.sort((a, b) => {
      const aTitle = (a as { title?: string }).title ?? "";
      const bTitle = (b as { title?: string }).title ?? "";
      return aTitle.localeCompare(bTitle);
    });
    return sorted;
  };

  // A curated set of icons on the wallpaper — everything else lives in the
  // Dock and Launchpad (clean-desktop rule). Web shortcuts stay in Finder.
  const desktopIcons = DESKTOP_APPS.filter((a) => a.onDesktop);

  type DesktopItem = {
    id: string;
    title: string;
    kind: "app" | "folder";
    color?: string;
    emoji?: string;
  };
  const desktopItems: DesktopItem[] = (() => {
    const apps: DesktopItem[] = sortDesktopIcons(desktopIcons).map((a) => ({
      id: a.id,
      title: a.title,
      kind: "app",
    }));
    const folders: DesktopItem[] = sys.desktopFolders.map((f) => ({
      id: f.id,
      title: f.name,
      kind: "folder",
      color: f.color,
      emoji: f.emoji,
    }));
    if (sys.desktopSort === "none") return [...apps, ...folders];
    return [...apps, ...folders].sort((a, b) => a.title.localeCompare(b.title));
  })();

  const iconPosFor = (id: string): IconPos => {
    // The Resume icon is featured — pinned to the TOP-LEFT of the wallpaper,
    // outside the right-anchored grid, until the visitor drags it somewhere.
    if (id === "resume" && !iconPos[id]) {
      return { x: 34, y: 64 };
    }
    const layout = layoutIcons(
      desktopItems,
      iconPos,
      gridRows,
      iconPitch,
      vw,
      iconStartY(),
      sys.desktopIconSize,
    );
    return layout.get(id) ?? { x: 0, y: 0 };
  };

  // Settings → Desktop & Dock → Reset icon layout: clear manual positions.
  const lastReset = useRef(sys.desktopIconReset);
  useEffect(() => {
    if (sys.desktopIconReset !== lastReset.current) {
      lastReset.current = sys.desktopIconReset;
      setIconPos({});
    }
  }, [sys.desktopIconReset]);

  /* ----- New Folder / rename / delete (wallpaper folders) -----
     A wallpaper folder is a REAL Finder folder: it's created in the file
     system (finderStorage) so double-clicking it opens that folder's
     location — never Recents — and it shows up under Finder ▸ Folders. */
  const newFolder = () => {
    const folder = addFolder("untitled folder");
    patchSys({
      desktopFolders: [...sys.desktopFolders, { id: folder.id, name: folder.name }],
    });
    setSelectedIcon(folder.id);
    setRenamingId(folder.id);
    sounds.pop();
  };

  const commitRename = (id: string, name: string) => {
    setRenamingId(null);
    const trimmed = name.trim();
    if (!trimmed) return;
    patchSys({
      desktopFolders: sys.desktopFolders.map((f) =>
        f.id === id ? { ...f, name: trimmed } : f,
      ),
    });
    // Keep the Finder's file system in sync. Folders created before this
    // integration have no storage entry yet — they're materialized on open.
    if (readFolders().some((f) => f.id === id)) renameFolder(id, trimmed);
  };

  const deleteFolder = (id: string) => {
    patchSys({ desktopFolders: sys.desktopFolders.filter((f) => f.id !== id) });
    setIconPos((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelectedIcon((cur) => (cur === id ? null : cur));
    if (readFolders().some((f) => f.id === id)) deleteStorageFolder(id);
    sounds.whoosh();
  };

  /** Open a wallpaper folder in the Finder at that folder's location. */
  const openDesktopFolder = (id: string, name: string) => {
    let storage = readFolders().find((f) => f.id === id);
    if (!storage) {
      storage = addFolder(name);
      const realId = storage.id;
      patchSys({
        desktopFolders: sys.desktopFolders.map((f) =>
          f.id === id ? { ...f, id: realId, name: storage!.name } : f,
        ),
      });
      id = realId;
    }
    openFinderAt(`folder:${id}`);
  };

  const onIconPointerDown = (id: string, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // don't let the wallpaper's deselect handler fire
    const base = iconPosFor(id);
    dragState.current = {
      appId: id,
      startX: e.clientX,
      startY: e.clientY,
      origX: base.x,
      origY: base.y,
      moved: false,
    };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture not available */
    }
  };

  const onIconPointerMove = (id: string, e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d || d.appId !== id) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.hypot(dx, dy) > 4) {
      d.moved = true;
      setDraggingId(id);
      setDragPreview({ x: d.origX + dx, y: d.origY + dy });
    }
  };

  const onIconPointerUp = (id: string, e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d || d.appId !== id) return;
    dragState.current = null;
    if (d.moved) {
      const vw = window.innerWidth;
      const y0 = iconStartY();
      const target = snapToGrid(
        d.origX + (e.clientX - d.startX),
        d.origY + (e.clientY - d.startY),
        iconPitch,
        vw,
        y0,
        sys.desktopIconSize,
      );
      setIconPos((prev) => {
        const next = { ...prev };
        // The effective layout BEFORE this drop, with the dragged icon
        // excluded — so a drop onto ANY occupant (default grid or manually
        // placed) displaces it instead of overlapping it.
        const layout = layoutIcons(
          desktopItems.filter((it) => it.id !== id),
          next,
          gridRows,
          iconPitch,
          vw,
          y0,
          sys.desktopIconSize,
        );
        const displaced = [...layout.entries()].find(
          ([, pos]) => pos.x === target.x && pos.y === target.y,
        )?.[0];
        if (displaced) {
          const occ = new Set(
            [...layout.values()]
              .filter((p) => !(p.x === target.x && p.y === target.y))
              .map(cellKey),
          );
          occ.add(cellKey(target));
          next[displaced] = nextFreeCell(
            occ,
            gridRows,
            iconPitch,
            vw,
            y0,
            sys.desktopIconSize,
          );
        }
        next[id] = target;
        return next;
      });
      setDraggingId(null);
      setDragPreview(null);
    }
  };

  const onWallpaperContext = (e: React.MouseEvent) => {
    e.preventDefault();
    // The context menu is taller now (Clean Up + Sort By) — clamp so it
    // never runs off the bottom of the screen.
    const x = Math.min(e.clientX, window.innerWidth - 230);
    const y = Math.min(e.clientY, window.innerHeight - 330);
    setContextMenu({ x, y });
  };

  /* Keep the desktop-icon column clear of the widget stack: measure the
     widget column height (changes as widgets are added/removed) and feed it
     to the icon-grid y-offset above. */
  useEffect(() => {
    const el = widgetsRef.current;
    if (!el) {
      setWidgetsBottom(0);
      return;
    }
    const measure = () =>
      setWidgetsBottom(el.offsetTop + el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sys.showWidgets, sys.widgets, booting, locked]);

  /* ----- Mouse-wheel scrolling inside apps -----
     GSAP ScrollSmoother intercepts wheel events at the window level before
     they reach the desktop, so the app panels (Projects, About, Resume, …)
     never scroll — the wheel either moves the (already ended) page or does
     nothing. Fix: catch wheel on the desktop root and scroll the innermost
     scrollable ancestor manually; if the cursor isn't over a scrollable
     area, fall back to the frontmost window's scrollable body (macOS
     behavior: wheel over the titlebar still scrolls the app).

     Trackpad gestures (Settings → Trackpad & Mouse):
       - Pinch (two fingers) → Launchpad — intercepts the browser's
         ctrl+wheel pinch-zoom so the gesture opens apps instead.
       - Swipe up (two fingers) over the wallpaper → Mission Control. */
  useEffect(() => {
    const el = desktopRef.current;
    if (!el) return;
    const isScrollable = (n: HTMLElement) =>
      (/(auto|scroll|overlay)/.test(getComputedStyle(n).overflowY) &&
        n.scrollHeight > n.clientHeight) ||
      (/(auto|scroll|overlay)/.test(getComputedStyle(n).overflowX) &&
        n.scrollWidth > n.clientWidth);
    // Pinch → Launchpad: accumulate ctrl+wheel (the browser's pinch signal)
    // and trigger Launchpad once the pinch crosses a threshold.
    let pinchDelta = 0;
    let lastPinch = 0;
    const onWheel = (e: WheelEvent) => {
      // Two-finger pinch arrives as ctrl+wheel. Override the browser zoom.
      if (e.ctrlKey && !locked && !booting) {
        e.preventDefault();
        if (sys.pinchLaunchpad) {
          const now = Date.now();
          pinchDelta += e.deltaY;
          if (now - lastPinch > 260) pinchDelta = 0;
          lastPinch = now;
          if (Math.abs(pinchDelta) > 130) {
            pinchDelta = 0;
            setLaunchpadOpen((v) => !v);
            sounds.pop();
          }
        }
        return;
      }
      // Two-finger swipe up over the wallpaper → Mission Control.
      if (
        sys.swipeMissionControl &&
        !locked &&
        !booting &&
        e.deltaY < -110 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        const target = e.target as HTMLElement | null;
        const overWindow = target?.closest('[role="dialog"]') != null;
        const overScrollable = target
          ? (() => {
              let n: HTMLElement | null = target;
              while (n && n !== el) {
                if (isScrollable(n)) return true;
                n = n.parentElement;
              }
              return false;
            })()
          : false;
        if (!overWindow && !overScrollable) {
          e.preventDefault();
          setMissionControl(true);
          return;
        }
      }
      const target = e.target as HTMLElement | null;
      if (!target) return;
      let node: HTMLElement | null = target;
      while (node && node !== el) {
        if (isScrollable(node)) {
          if (node.scrollHeight > node.clientHeight) node.scrollTop += e.deltaY;
          if (node.scrollWidth > node.clientWidth) node.scrollLeft += e.deltaX || e.deltaY;
          e.preventDefault();
          return;
        }
        node = node.parentElement;
      }
      // Cursor is over a non-scrollable area — scroll the frontmost window's
      // first scrollable body instead.
      const dialog = target.closest('[role="dialog"]') as HTMLElement | null;
      if (dialog) {
        const all = dialog.querySelectorAll<HTMLElement>("*");
        for (const cand of all) {
          if (isScrollable(cand)) {
            cand.scrollTop += e.deltaY;
            e.preventDefault();
            return;
          }
        }
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, locked, booting, sys.pinchLaunchpad, sys.swipeMissionControl]);

  // Hooks must all run before the conditional return — otherwise React sees
  // a different hook count when `open` toggles.
  const space = sys.spaces.find((s) => s.id === currentSpace) ?? sys.spaces[0];
  // Old saved settings can point past the wallpaper list (it shrank when the
  // fake AI / Windows wallpapers were removed) — wrap the index so a stale
  // setting can never render a black screen or crash the machine.
  const wallpaperFor = (index: number) => {
    const i = ((index % WALLPAPERS.length) + WALLPAPERS.length) % WALLPAPERS.length;
    return WALLPAPERS[i];
  };
  const tint = useWallpaperTint(wallpaperFor(space.wallpaperIndex).src);

  /* ----- Spaces + hot corners ----- */
  const switchSpace = (delta: number) => {
    const list = sys.spaces.length ? sys.spaces : DEFAULT_SPACES;
    const i = list.findIndex((s) => s.id === currentSpace);
    const next = list[(i + delta + list.length) % list.length];
    if (!next) return;
    setCurrentSpace(next.id);
    setContextMenu(null);
    sounds.pop();
  };

  const triggerCorner = (action: HotCornerAction) => {
    switch (action) {
      case "mission-control":
        setMissionControl(true);
        break;
      case "show-desktop":
        toggleShowDesktop();
        break;
      case "launchpad":
        setLaunchpadOpen(true);
        break;
      case "lock":
        setLocked(true);
        break;
      // Tahoe: the "Start Screen Saver" corner locks the machine instead of
      // playing an animation (same outcome as requiring a password after the
      // saver begins).
      case "screensaver":
        setLocked(true);
        break;
      case "next-space":
        switchSpace(1);
        break;
      case "prev-space":
        switchSpace(-1);
        break;
      default:
        break;
    }
  };

  const cornerRef = useRef<{ corner: string; timer: number } | null>(null);
  const onDesktopPointerMove = (e: React.PointerEvent) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const m = 8;
    let corner: CornerId | null = null;
    if (e.clientX <= m && e.clientY <= m) corner = "tl";
    else if (e.clientX >= vw - m && e.clientY <= m) corner = "tr";
    else if (e.clientX <= m && e.clientY >= vh - m) corner = "bl";
    else if (e.clientX >= vw - m && e.clientY >= vh - m) corner = "br";

    if (!corner) {
      if (cornerRef.current) {
        window.clearTimeout(cornerRef.current.timer);
        cornerRef.current = null;
      }
      return;
    }
    if (cornerRef.current?.corner === corner) return;
    if (cornerRef.current) window.clearTimeout(cornerRef.current.timer);
    const action = sys.hotCorners[corner] ?? "none";
    if (action === "none") return;
    cornerRef.current = {
      corner,
      timer: window.setTimeout(() => {
        cornerRef.current = null;
        triggerCorner(action);
      }, 340),
    };
  };

  if (!open) return null;

  // A custom image (Finder → Set as Wallpaper) overrides the built-in set.
  const wallpaper = space.customWallpaper
    ? {
        id: "custom",
        name: space.customWallpaperName ?? "Custom Wallpaper",
        src: space.customWallpaper,
      }
    : wallpaperFor(space.wallpaperIndex);
  const spaceWindows = manager.windows.filter((w) => w.spaceId === currentSpace);

  const bringStageApp = (appId: string) => {
    const appWindows = spaceWindows.filter((w) => w.appId === appId && !w.minimized);
    appWindows.forEach((w) => manager.bringToFront(w.id));
  };

  // macOS Tahoe theme: the accent color is a CSS variable on the desktop
  // root so every selection/button/highlight follows Settings → Appearance.
  const accent = ACCENT_COLORS[sys.accentColor ?? "blue"];

  return (
    <div
      ref={desktopRef}
      className={`${styles.desktop} ${
        sys.reduceTransparency ? styles.reduced : ""
      } ${sys.stageManager ? styles.stageManagerOn : ""}`}
      style={{
        "--accent": accent.swatch,
        "--accent-rgb": accent.rgb,
      } as React.CSSProperties}
      role="application"
      aria-label="Aryan OS desktop"
      onContextMenu={onWallpaperContext}
      onPointerMove={onDesktopPointerMove}
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragOver(false);
      }}
      onDrop={handleDropFiles}
      onTouchStart={(e) => {
        desktopTouchStartY.current = e.touches[0].clientY;
        desktopTouchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (desktopTouchStartY.current === null) return;
        const dy = e.changedTouches[0].clientY - desktopTouchStartY.current;
        const dx = Math.abs(e.changedTouches[0].clientX - (desktopTouchStartX.current ?? 0));
        desktopTouchStartY.current = null;
        desktopTouchStartX.current = null;
        // Must be mostly vertical (not horizontal swipe)
        if (dx > 60) return;
        // Swipe down > 100px → notification center
        if (dy > 100 && !locked && !booting && !launchpadOpen && manager.windows.length === 0) {
          setNotifCenter(true);
        }
        // Swipe up > 100px → Control Center
        if (dy < -100 && !locked && !booting && !launchpadOpen && manager.windows.length === 0) {
          setControlCenter(true);
        }
      }}
    >
      {/* Status bar: iOS-style on mobile (home screen only, not when Launchpad is open), macOS menu bar on desktop */}
      {isMobile && manager.windows.length === 0 && !launchpadOpen && (
        <MobileStatusBar
          onSettings={() => setControlCenter(true)}
          onNotifications={() => setNotifCenter(true)}
        />
      )}
      {!anyMaximized && !isMobile && (
        <MenuBar
          focusedAppTitle={
            focusedWindow
              ? (DESKTOP_APPS.find((a) => a.id === focusedWindow.appId)?.title ??
                focusedWindow.title)
              : null
          }
          system={sys}
          onSystemChange={patchSys}
          windows={manager.windows.map((w) => ({
            id: w.id,
            appId: w.appId,
            title: w.title,
          }))}
          focusedWindowId={manager.focusedId}
          onFocusWindow={manager.bringToFront}
          dndOn={dndOn}
          onToggleDnd={() => setDndOn((v) => !v)}
          autoHide={sys.autoHideMenuBar}
          actions={{
          onAbout: () => setAboutOpen(true),
          onQuit: onClose,
          onLock: () => setLocked(true),
          onRestart: requestRestart,
          onShutDown: requestShutDown,
          onLogOut: requestLogOut,
          onSleep: sleep,
          onSpotlight: () => setSpotlightOpen(true),
          onRun: openRun,
          onOpenApp: openWindow,
          onNewWindow: () => focusedWindow && openWindow(focusedWindow.appId),
          onCloseFocused: () => focusedWindow && closeWindowAnimated(focusedWindow.id),
          onMinimizeFocused: () => focusedWindow && minimizeWindowAnimated(focusedWindow.id),
          onZoomFocused: () => focusedWindow && manager.toggleMaximize(focusedWindow.id),
          onNotifications: () => setNotifCenter(true),
          onMissionControl: () => setMissionControl(true),
          onBringAllToFront: bringAllToFront,
          onAppSwitcher: () => {
            const apps = Array.from(new Set(manager.windows.map((w) => w.appId)));
            if (apps.length) setSwitcher({ apps, index: 0 });
          },
        }}
        />
      )}

      <div
        key={`${space.wallpaperIndex}-${space.customWallpaper ?? ""}`}
        className={styles.wallpaper}
        style={{
          backgroundImage: wallpaper.src ? `url(${wallpaper.src})` : undefined,
          backgroundSize:
            sys.wallpaperFit === "fill"
              ? "cover"
              : sys.wallpaperFit === "fit"
                ? "contain"
                : sys.wallpaperFit === "stretch"
                  ? "100% 100%"
                  : sys.wallpaperFit === "tile"
                    ? "auto"
                    : "auto",
          backgroundRepeat:
            sys.wallpaperFit === "tile" ? "repeat" : "no-repeat",
          backgroundPosition: "center",
        }}
        onPointerDown={(e) => {
          // first click after Sleep wakes the display
          if (sys.brightness === 0) {
            patchSys({ brightness: 100 });
            sounds.pop();
          }
          setSelectedIcon(null);
          // Long-press on mobile → show context menu (alternative to right-click)
          if (isMobile) {
            wallpaperLongPressClear();
            wallpaperLongPressTimer.current = setTimeout(() => {
              const x = Math.min(e.clientX, window.innerWidth - 230);
              const y = Math.min(e.clientY, window.innerHeight - 330);
              setContextMenu({ x, y });
            }, 500);
          }
        }}
        onPointerUp={() => wallpaperLongPressClear()}
        onPointerLeave={() => wallpaperLongPressClear()}
      >
        {/* Mobile: iOS-style app grid replaces desktop icons */}
        {!locked && !booting && isMobile && (
          <MobileAppGrid onLaunch={openWindow} />
        )}
        {/* Desktop: macOS-style desktop icon grid */}
        {!isMobile && desktopItems.map((it) => {
          const pos = iconPosFor(it.id);
          const preview = draggingId === it.id && dragPreview ? dragPreview : null;
          const finalPos = preview ?? pos;
          const app = it.kind === "app" ? desktopIcons.find((a) => a.id === it.id) : null;
          const isRenaming = renamingId === it.id;
          return (
            <button
              key={it.id}
              type="button"
              className={`${styles.desktopIcon} ${
                it.id === "resume" ? styles.desktopIconFeatured : ""
              } ${draggingId === it.id ? styles.desktopIconDragging : ""}`}
              style={{
                "--cell": `${iconPitch}px`,
                transform: `translate(${finalPos.x}px, ${finalPos.y}px)${
                  draggingId === it.id ? " scale(1.08)" : ""
                }`,
              } as React.CSSProperties}
              onClick={() => {
                // On mobile, a tap opens the app (no double-click available)
                if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
                  if (it.kind === "folder") openDesktopFolder(it.id, it.title);
                  else if (app) openWindow(app.id);
                } else {
                  setSelectedIcon(it.id);
                }
              }}
              onDoubleClick={() =>
                it.kind === "folder"
                  ? openDesktopFolder(it.id, it.title)
                  : app && openWindow(app.id)
              }
              onPointerDown={(e) => onIconPointerDown(it.id, e)}
              onPointerMove={(e) => onIconPointerMove(it.id, e)}
              onPointerUp={(e) => onIconPointerUp(it.id, e)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // On mobile, show the iOS bottom sheet context menu
                if (isMobile) {
                  const items: ContextMenuItem[] = [
                    { label: "Open", onClick: () => {
                      if (it.kind === "folder") openDesktopFolder(it.id, it.title);
                      else if (app) openWindow(app.id);
                    }},
                    { label: "Get Info", onClick: () => setInfoFor(it.id) },
                  ];
                  if (it.kind === "folder") {
                    items.push({ label: "Rename", onClick: () => {
                      setRenamingId(it.id);
                    }});
                  }
                  setMobileCtx({ items, title: it.title });
                } else {
                  setIconMenu({
                    id: it.id,
                    kind: it.kind,
                    x: Math.min(e.clientX, window.innerWidth - 220),
                    y: Math.min(e.clientY, window.innerHeight - 200),
                    title: it.title,
                  });
                }
              }}
              aria-label={`Open ${it.title}`}
            >
              <span
                className={`${styles.desktopIconBox} ${
                  selectedIcon === it.id ? styles.desktopIconSelected : ""
                }`}
              >
                {it.kind === "folder" ? (
                  /* The real macOS folder icon — identical to the Finder's,
                     so a wallpaper folder never looks different from one in
                     the file browser (macOS draws them the same everywhere).
                     Tahoe folders can be tinted + given an emoji badge. */
                  <FolderIcon
                    size={sys.desktopIconSize}
                    color={it.color}
                    emoji={it.emoji}
                    className={styles.folderIcon}
                  />
                ) : (
                  app && <AppIcon app={app} size={sys.desktopIconSize} />
                )}
                {isRenaming ? (
                  <input
                    ref={renameInputRef}
                    className={styles.desktopRenameInput}
                    defaultValue={it.title}
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(it.id, e.currentTarget.value);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onBlur={(e) => commitRename(it.id, e.currentTarget.value)}
                    aria-label="Folder name"
                  />
                ) : (
                  <span className={styles.desktopIconLabel}>{it.title}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Drop-target highlight while dragging files onto the desktop. */}
      {dragOver && (
        <div className={styles.dropOverlay}>
          <div className={styles.dropHint}>
            <strong>Drop to import</strong>
            <span>Images go to Photos · .txt / .md go to Documents</span>
          </div>
        </div>
      )}

      {/* macOS Tahoe desktop widgets — top-right, below any windows.
          Edit mode (context menu → Edit Widgets…) shows remove buttons, a
          drag handle on each card, and a picker to add hidden widgets. */}
      {!locked && !booting && sys.showWidgets && (
        <div
          ref={widgetsRef}
          className={`${styles.widgets} ${
            widgetsEditing ? styles.widgetsEditing : ""
          }`}
        >
          <WidgetStack
            widgetStyle={sys.widgetStyle}
            tint={tint}
            ids={sys.widgets}
            editing={widgetsEditing}
            onRemove={(id) =>
              patchSys({ widgets: sys.widgets.filter((w) => w !== id) })
            }
            onReorder={(from, to) => {
              const next = [...sys.widgets];
              const [moved] = next.splice(from, 1);
              next.splice(to, 0, moved);
              patchSys({ widgets: next });
            }}
          />
          {widgetsEditing && (
            <div className={styles.widgetPicker}>
              <span className={styles.widgetPickerLabel}>Add a widget</span>
              <div className={styles.widgetPickerRow}>
                {WIDGET_IDS.filter((id) => !sys.widgets.includes(id)).map(
                  (id) => (
                    <button
                      key={id}
                      type="button"
                      className={styles.widgetPickerBtn}
                      onClick={() =>
                        patchSys({ widgets: [...sys.widgets, id] })
                      }
                    >
                      <Glyph id={WIDGET_META[id].icon} size={13} /> {WIDGET_META[id].label}
                    </button>
                  ),
                )}
              </div>
              <button
                type="button"
                className={styles.widgetPickerDone}
                onClick={() => setWidgetsEditing(false)}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stage Manager: other apps live in the left-edge strip. */}
      {sys.stageManager && !locked && !booting && (
        <StageStrip
          windows={spaceWindows}
          focusedId={manager.focusedId}
          onBring={bringStageApp}
        />
      )}

      {/* Show Desktop chip — click again to bring the windows back. */}
      {showDesktop && !locked && !booting && (
        <button
          type="button"
          className={styles.showDesktopChip}
          onClick={toggleShowDesktop}
        >
          Show Desktop
          <span className={styles.showDesktopChipArrow}>↥</span>
        </button>
      )}

      {/* Screen-capture recording indicator (daedalOS). */}
      {capturing && !locked && !booting && (
        <div className={styles.recordingChip}>
          <span className={styles.recordingDot} />
          Recording
        </div>
      )}

      <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"rgba(255,255,255,0.5)",fontSize:13,gap:6}}><span className={styles.gameSpin} style={{display:"inline-block"}} /> Loading…</div>}>
      {spaceWindows
        .filter((w) => !w.minimized)
        .map((win) => {
          const View = APP_VIEWS[win.appId];
          return (
            <Window
              key={win.id}
              win={win}
              focused={manager.focusedId === win.id}
              closing={closingIds.has(win.id)}
              minimizing={minimizingIds.has(win.id)}
              minimizeEffect={sys.minimizeEffect}
              onFocus={manager.bringToFront}
              onClose={closeWindowAnimated}
              onMinimize={minimizeWindowAnimated}
              onMaximize={manager.toggleMaximize}
              onMove={manager.moveWindow}
              onResize={manager.resizeWindow}
              onTile={manager.tileWindow}
            >
              {win.appId === "finder" ? (
                <FinderApp
                  onOpenApp={handleOpen}
                  onLaunchpad={() => setLaunchpadOpen(true)}
                  onQuickLook={(f: FinderFile) => setQuickLook(f)}
                  onSetWallpaper={setCustomWallpaper}
                  initialLocation={finderLocs.current[win.id]}
                />
              ) : win.appId === "pdf" ? (
                <PdfViewerApp src={pdfSrcs[win.id] ?? ""} title={win.title} />
              ) : win.appId === "website" ? (
                <WebsiteApp
                  initialUrl={webUrls[win.id]}
                  onClose={() => closeWindowAnimated(win.id)}
                  onNewTab={() => openWindow("website")}
                />
              ) : win.appId === "textedit" ? (
                <TextEditApp
                  initialDoc={editDocs[win.id]?.name}
                  initialContent={editDocs[win.id]?.content}
                />
              ) : win.appId === "markdown" ? (
                <MarkdownApp
                  name={mdDocs[win.id]?.name}
                  content={mdDocs[win.id]?.content}
                  onEdit={() => {
                    const doc = mdDocs[win.id];
                    if (doc) openTextEdit(doc.name, doc.content);
                  }}
                />
              ) : win.appId === "terminal" ? (
                <TerminalApp onOpenApp={handleOpen} />
              ) : win.appId === "settings" ? (
                <SettingsApp
                  system={sys}
                  onSystemChange={patchSys}
                  wallpaperIndex={space.wallpaperIndex}
                  customWallpaperName={space.customWallpaperName}
                  onWallpaper={(i) => {
                    patchSys({
                      spaces: sys.spaces.map((s) =>
                        s.id === currentSpace
                          ? { ...s, wallpaperIndex: i, customWallpaper: undefined, customWallpaperName: undefined }
                          : s,
                      ),
                    });
                    sounds.pop();
                    pushNotif(
                      "image",
                      "Wallpaper",
                      `Wallpaper changed to ${WALLPAPERS[i].name}.`,
                      "settings",
                    );
                  }}
                  onAbout={() => setAboutOpen(true)}
                />
              ) : win.appId === "games" ? (
                <GamesApp
                  initialGame={chessDocs[win.id] ? "chess" : undefined}
                  pgnName={chessDocs[win.id]?.name}
                  pgnContent={chessDocs[win.id]?.content}
                  onLaunchGame={openGame}
                />
              ) : win.appId === "game-chess" ? (
                <ChessGame
                  fullWindow
                  onExit={() => closeWindowAnimated(win.id)}
                  pgnName={chessDocs[win.id]?.name}
                  pgnContent={chessDocs[win.id]?.content}
                />
              ) : win.appId === "game-pinball" ? (
                <SpaceCadetGame fullWindow onExit={() => closeWindowAnimated(win.id)} />
              ) : win.appId === "game-quake3" ? (
                <Quake3Game fullWindow onExit={() => closeWindowAnimated(win.id)} />
              ) : win.appId === "game-classicube" ? (
                <ClassiCubeGame fullWindow onExit={() => closeWindowAnimated(win.id)} />
              ) : win.appId === "game-tic80" ? (
                <Tic80Game fullWindow onExit={() => closeWindowAnimated(win.id)} />
              ) : win.appId === "game-dxball" ? (
                <DxBallGame fullWindow onExit={() => closeWindowAnimated(win.id)} />
              ) : win.appId === "game-piano" ? (
                <WebPlayGame url={webPlayUrls[win.id]} onExit={() => closeWindowAnimated(win.id)} />
              ) : win.appId === "dxball" ? (
                <DxBallGame fullWindow onExit={() => closeWindowAnimated(win.id)} />
              ) : win.appId === "webamp" ? (
                <WebampApp file={webampDocs[win.id]?.name} />
              ) : win.appId === "vlc" ? (
                <VlcApp file={vlcDocs[win.id]?.file} />
              ) : win.appId === "vim" ? (
                <VimApp
                  file={vimDocs[win.id]?.name}
                  content={vimDocs[win.id]?.content}
                />
              ) : win.appId === "monaco" ? (
                <MonacoApp
                  file={monacoDocs[win.id]?.name}
                  content={monacoDocs[win.id]?.content}
                />
              ) : win.appId === "tinymce" ? (
                <TinyMceApp file={tinymceDocs[win.id]?.name} />
              ) : win.appId === "tic80" ? (
                <Tic80Game
                  onExit={() => closeWindowAnimated(win.id)}
                  cart={tic80Docs[win.id]?.name}
                />
              ) : win.appId === "classicube" ? (
                <ClassiCubeGame onExit={() => closeWindowAnimated(win.id)} />
              ) : win.appId === "boxedwine" ? (
                <BoxedWineApp file={boxedwineDocs[win.id]?.name} />
              ) : win.appId === "v86" ? (
                <V86App file={v86Docs[win.id]?.name} />
              ) : win.appId === "devtools" ? (
                <DevToolsApp />
              ) : win.appId === "opentype" ? (
                <OpenTypeApp file={fontDocs[win.id]?.file} />
              ) : win.appId === "emulator" ? (
                <EmulatorApp file={emuDocs[win.id]?.name} />
              ) : win.appId === "ruffle" ? (
                <RuffleApp file={emuDocs[win.id]?.name} />
              ) : win.appId === "jsdos" ? (
                <JSDOSApp file={emuDocs[win.id]?.name} />
              ) : win.appId === "pglite" ? (
                <PGliteApp />
              ) : win.appId === "sqlstudio" ? (
                <SQLStudioApp />
              ) : win.appId === "esbuild" ? (
                <EsbuildApp />
              ) : win.appId === "ailab" ? (
                <AILabApp />
              ) : win.appId === "ffmpeg" ? (
                <FFmpegApp />
              ) : win.appId === "imagelab" ? (
                <ImageLabApp />
              ) : win.appId === "modelviewer" ? (
                <ModelViewerApp />
              ) : win.appId === "musicviz" ? (
                <MusicVisualizerApp />
              ) : View ? (
                <View />
              ) : (
                <div>App not found</div>
              )}
            </Window>
          );
        })}
      </Suspense>

      {sys.brightness < 100 && (
        <div
          className={styles.dimOverlay}
          style={{ opacity: 1 - sys.brightness / 100 }}
        />
      )}

      {/* Dock: iOS-style on mobile, macOS-style on desktop — only on home screen, not when Launchpad is open */}
      {isMobile && (
        <MobileDock
          runningApps={manager.runningApps}
          visible={manager.windows.length === 0 && !launchpadOpen}
          onLaunch={openWindow}
          onQuit={quitApp}
          onAppDrawer={() => setLaunchpadOpen(true)}
        />
      )}
      {!anyMaximized && !isMobile && (
        <Dock
          runningApps={manager.runningApps}
          minimizedWindows={spaceWindows
            .filter((w) => w.minimized)
            .map((w) => ({ id: w.id, appId: w.appId, title: w.title }))}
          dockSize={sys.dockSize}
          dockMagnify={sys.dockMagnify}
          dockMagnifySize={sys.dockMagnifySize}
          dockPosition={sys.dockPosition}
          dockAutoHide={sys.dockAutoHide}
          onLaunch={openWindow}
        onQuit={quitApp}
        onRestore={manager.restoreWindow}
        onEmptyTrash={() => {
          sounds.whoosh();
          showToast("Trash is empty");
          pushNotif("trash", "Trash", "The Trash is empty.", "finder");
        }}
        onEmptyTrashRequest={requestEmptyTrash}
        />
      )}

      {contextMenu && (
        <>
          <div
            className={styles.contextBackdrop}
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            className={styles.contextMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setContextMenu(null);
                newFolder();
              }}
            >
              New Folder
            </button>
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setContextMenu(null);
                setAboutOpen(true);
              }}
            >
              Get Info
            </button>
            <div className={styles.dropdownSeparator} />
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setContextMenu(null);
                setWallpaperPicker(true);
              }}
            >
              Change Wallpaper…
            </button>
            <div className={styles.contextSubLabel}>Sort By</div>
            <button
              type="button"
              className={`${styles.contextItem} ${
                sys.desktopSort === "name" ? styles.contextItemChecked : ""
              }`}
              onClick={() => {
                patchSys({ desktopSort: "name" });
                setIconPos({});
                setContextMenu(null);
              }}
            >
              {sys.desktopSort === "name" ? "✓ " : ""}Name
            </button>
            <button
              type="button"
              className={`${styles.contextItem} ${
                sys.desktopSort === "none" ? styles.contextItemChecked : ""
              }`}
              onClick={() => {
                patchSys({ desktopSort: "none" });
                setIconPos({});
                setContextMenu(null);
              }}
            >
              {sys.desktopSort === "none" ? "✓ " : ""}Grid
            </button>
            <div className={styles.dropdownSeparator} />
            {/* Clean Up — reset every icon to its grid cell (no overlap). */}
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setIconPos({});
                setContextMenu(null);
                sounds.pop();
              }}
            >
              Clean Up
            </button>
            <div className={styles.dropdownSeparator} />
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setContextMenu(null);
                sounds.pop();
                if (sys.showWidgets) {
                  setWidgetsEditing(true);
                } else {
                  patchSys({ showWidgets: true });
                  setWidgetsEditing(true);
                }
              }}
            >
              {sys.showWidgets ? "Edit Widgets…" : "Show + Edit Widgets…"}
            </button>
            <div className={styles.dropdownSeparator} />
            {/* Screen capture (daedalOS) — records the screen with the browser's
                share picker and saves the webm to Documents. */}
            <button
              type="button"
              className={styles.contextItem}
              onClick={async () => {
                setContextMenu(null);
                if (capturing || isCapturing()) {
                  stopScreenCapture();
                  captureRef.current = null;
                  setCapturing(false);
                  showToast("Screen capture saved to Documents");
                  return;
                }
                const result = await startScreenCapture();
                if (!result) return; // user cancelled the picker
                setCapturing(true);
                captureRef.current = result;
                pushNotif(
                  "video",
                  "Screen Capture",
                  "Recording — right-click the desktop again to stop.",
                  "finder",
                );
                // Persist the finished recording as a Finder movie.
                void result.finished.then(async (blob) => {
                  setCapturing(false);
                  const dataUrl = await blobToDataUrl(blob);
                  if (dataUrl) {
                    const stamp = new Date()
                      .toISOString()
                      .replace(/[:.]/g, "-")
                      .slice(0, 19);
                    const name = `Screen Capture ${stamp}.webm`;
                    addFile(name, dataUrl);
                    showToast(`Saved ${name}`);
                    pushNotif(
                      "video",
                      "Screen Capture",
                      `${name} saved to Documents.`,
                      "finder",
                    );
                  }
                });
              }}
            >
              {capturing ? "Stop Screen Capture…" : "Capture Screen…"}
            </button>
            {/* eSheep — daedalOS's desktop pet (also `esheep` in the Run dialog). */}
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setContextMenu(null);
                sounds.pop();
                spawnSheep(true);
              }}
            >
              Spawn a Sheep
            </button>
            <div className={styles.dropdownSeparator} />
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setContextMenu(null);
                setSpotlightOpen(true);
              }}
            >
              Spotlight…
            </button>
          </div>
        </>
      )}

      {wallpaperPicker && (
        <div className={styles.spotlightBackdrop} onClick={() => setWallpaperPicker(false)}>
          <div className={styles.wallpaperSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.wallpaperSheetHeader}>
              <strong>Wallpaper</strong>
              <span>Choose a look</span>
            </div>
            <div className={styles.wallpaperGrid}>
              {WALLPAPERS.map((wp, i) => (
                <button
                  key={wp.id}
                  type="button"
                  className={`${styles.wallpaperThumb} ${
                    i === space.wallpaperIndex ? styles.wallpaperThumbActive : ""
                  }`}
                  onClick={() => {
                    patchSys({
                      spaces: sys.spaces.map((s) =>
                        s.id === currentSpace
                          ? { ...s, wallpaperIndex: i, customWallpaper: undefined, customWallpaperName: undefined }
                          : s,
                      ),
                    });
                    setWallpaperPicker(false);
                    sounds.pop();
                    pushNotif("image", "Wallpaper", `Wallpaper changed to ${wp.name}.`, "settings");
                  }}
                  aria-label={wp.name}
                >
                  <span
                    className={styles.wallpaperThumbArt}
                    style={{
                      backgroundImage: wp.src ? `url(${wp.src})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <span className={styles.wallpaperThumbName}>{wp.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {spotlightOpen && (
        <Spotlight onPick={handleSpotlightPick} onClose={() => setSpotlightOpen(false)} />
      )}

      {emojiOpen && (
        <EmojiPicker
          onClose={() => {
            setEmojiOpen(false);
            setFolderEmojiFor(null);
          }}
          onCopy={(em) => {
            // In folder-customization mode the picked emoji becomes the
            // folder's badge (Tahoe); otherwise copy it as usual.
            if (folderEmojiFor) {
              patchSys({
                desktopFolders: sys.desktopFolders.map((f) =>
                  f.id === folderEmojiFor ? { ...f, emoji: em } : f,
                ),
              });
              if (readFolders().some((f) => f.id === folderEmojiFor)) {
                setFolderStyle(folderEmojiFor, { emoji: em });
              }
              showToast(`Folder emoji set to ${em}`);
              setFolderEmojiFor(null);
            } else {
              void navigator.clipboard?.writeText(em);
              showToast(`Copied “${em}”`);
            }
            setEmojiOpen(false);
          }}
        />
      )}

      {infoFor &&
        (() => {
          const app = DESKTOP_APPS.find((a) => a.id === infoFor);
          if (!app) return null;
          return (
            <div className={styles.spotlightBackdrop} onClick={() => setInfoFor(null)}>
              <div className={styles.getInfo} onClick={(e) => e.stopPropagation()}>
                <div className={styles.getInfoIcon}>
                  <AppIcon app={app} size={68} />
                </div>
                <h3 className={styles.getInfoName}>{app.title}</h3>
                <div className={styles.getInfoRows}>
                  <div className={styles.getInfoRow}>
                    <span>Kind</span>
                    <strong>Application</strong>
                  </div>
                  <div className={styles.getInfoRow}>
                    <span>Size</span>
                    <strong>4.8 MB</strong>
                  </div>
                  <div className={styles.getInfoRow}>
                    <span>Created</span>
                    <strong>Today at 09:41</strong>
                  </div>
                  <div className={styles.getInfoRow}>
                    <span>Modified</span>
                    <strong>Today at 09:41</strong>
                  </div>
                  <div className={styles.getInfoRow}>
                    <span>Version</span>
                    <strong>2027.1 (beta)</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {switcher && (
        <AppSwitcher
          apps={switcher.apps}
          index={switcher.index}
          windows={spaceWindows
            .filter((w) => !w.minimized)
            .map((w) => ({ appId: w.appId, title: w.title }))}
          onSelect={(appId) => {
            openWindow(appId);
            setSwitcher(null);
          }}
          onClose={() => setSwitcher(null)}
        />
      )}

      {launchpadOpen && (
        <Launchpad
          items={sys.launchpadItems}
          folders={sys.launchpadFolders}
          hidden={sys.launchpadHidden}
          onChange={(items, folders, hidden) =>
            patchSys({ launchpadItems: items, launchpadFolders: folders, launchpadHidden: hidden })
          }
          onLaunch={(appId) => {
            openWindow(appId);
            setLaunchpadOpen(false);
          }}
          onClose={() => setLaunchpadOpen(false)}
        />
      )}

      {iconMenu && (
        <>
          <div
            className={styles.contextBackdrop}
            onClick={() => setIconMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setIconMenu(null);
            }}
          />
          <div className={styles.contextMenu} style={{ left: iconMenu.x, top: iconMenu.y }}>
            {iconMenu.kind === "folder" ? (
              <>
                <button
                  type="button"
                  className={styles.contextItem}
                  onClick={() => {
                    setIconMenu(null);
                    openDesktopFolder(iconMenu.id, iconMenu.title ?? "untitled folder");
                  }}
                >
                  Open
                </button>
                <button
                  type="button"
                  className={styles.contextItem}
                  onClick={() => {
                    setIconMenu(null);
                    setRenamingId(iconMenu.id);
                  }}
                >
                  Rename
                </button>
                <div className={styles.dropdownSeparator} />
                {/* macOS Tahoe folder customization — color + emoji. */}
                <button
                  type="button"
                  className={`${styles.contextItem} ${styles.contextItemWithArrow}`}
                  onClick={() =>
                    setIconMenuSub(iconMenuSub === "color" ? null : "color")
                  }
                >
                  Color…
                  <span className={styles.contextSubArrow}>›</span>
                </button>
                {iconMenuSub === "color" && (
                  <div className={styles.folderColorPicker}>
                    {FOLDER_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`${styles.folderColorSwatch} ${
                          sys.desktopFolders.find((f) => f.id === iconMenu.id)?.color === c
                            ? styles.folderColorActive
                            : ""
                        }`}
                        style={{ "--swatch": FOLDER_COLOR_FILL[c] } as React.CSSProperties}
                        aria-label={`${c} folder`}
                        title={c}
                        onClick={() => {
                          patchSys({
                            desktopFolders: sys.desktopFolders.map((f) =>
                              f.id === iconMenu.id ? { ...f, color: c } : f,
                            ),
                          });
                          if (readFolders().some((f) => f.id === iconMenu.id)) {
                            setFolderStyle(iconMenu.id, { color: c });
                          }
                          setIconMenuSub(null);
                          setIconMenu(null);
                          sounds.pop();
                        }}
                      />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className={`${styles.contextItem} ${styles.contextItemWithArrow}`}
                  onClick={() => {
                    const f = sys.desktopFolders.find((x) => x.id === iconMenu.id);
                    setFolderEmojiFor(iconMenu.id);
                    setIconMenuSub(null);
                    setIconMenu(null);
                    setEmojiOpen(true);
                    // The emoji picker's onCopy becomes the folder badge.
                    void f;
                  }}
                >
                  {sys.desktopFolders.find((x) => x.id === iconMenu.id)?.emoji
                    ? `Emoji: ${sys.desktopFolders.find((x) => x.id === iconMenu.id)!.emoji}`
                    : "Add Emoji…"}
                  <span className={styles.contextSubArrow}>›</span>
                </button>
                <div className={styles.dropdownSeparator} />
                <button
                  type="button"
                  className={styles.contextItem}
                  onClick={() => deleteFolder(iconMenu.id)}
                >
                  Move to Trash
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.contextItem}
                  onClick={() => {
                    setIconMenu(null);
                    openWindow(iconMenu.id);
                  }}
                >
                  Open
                </button>
                <button
                  type="button"
                  className={styles.contextItem}
                  onClick={() => {
                    setIconMenu(null);
                    setInfoFor(iconMenu.id);
                  }}
                >
                  Get Info
                </button>
                <div className={styles.dropdownSeparator} />
                <button
                  type="button"
                  className={styles.contextItem}
                  onClick={() => {
                    setIconMenu(null);
                    openWindow("finder");
                  }}
                >
                  Show in Finder
                </button>
              </>
            )}
          </div>
        </>
      )}

      {missionControl && (
        <MissionControl
          windows={spaceWindows}
          wallpaperSrc={wallpaper.src}
          spaces={sys.spaces.length ? sys.spaces : DEFAULT_SPACES}
          currentSpaceId={currentSpace}
          onPickSpace={(spaceId) => {
            setCurrentSpace(spaceId);
            sounds.pop();
            setMissionControl(false);
          }}
          onAddSpace={() => {
            if (sys.spaces.length >= 6) return;
            const nextId = Math.max(...sys.spaces.map((s) => s.id)) + 1;
            const next = {
              id: nextId,
              name: `Desktop ${nextId}`,
              wallpaperIndex: nextId % WALLPAPERS.length,
            };
            patchSys({ spaces: [...sys.spaces, next] });
            setCurrentSpace(nextId);
            sounds.pop();
            setMissionControl(false);
          }}
          onPick={(appId) => {
            manager.openWindow(appId);
            setMissionControl(false);
          }}
          onClose={() => setMissionControl(false)}
        />
      )}

      {/* Control Center — iOS-style panel on mobile */}
      {controlCenter && (
        <MobileControlCenter
          brightness={sys.brightness}
          volume={sys.volume}
          dndOn={dndOn}
          onBrightnessChange={(v) => patchSys({ brightness: v })}
          onVolumeChange={(v) => patchSys({ volume: v })}
          onToggleDnd={() => setDndOn((v) => !v)}
          onOpenSettings={() => openWindow("settings")}
          onClose={() => setControlCenter(false)}
        />
      )}

      {notifCenter && (
        <NotificationCenter
          notifications={notifications}
          dndOn={dndOn}
          widgetStyle={sys.widgetStyle}
          tint={tint}
          onToggleDnd={() => setDndOn((v) => !v)}
          onDismiss={(id) =>
            setNotifications((list) => list.filter((n) => n.id !== id))
          }
          onClear={() => setNotifications([])}
          onClose={() => setNotifCenter(false)}
        />
      )}

      {aboutOpen && (
        <AboutThisMac
          onMoreInfo={() => openWindow("about")}
          onClose={() => setAboutOpen(false)}
        />
      )}

      {runOpen && <RunDialog onClose={() => setRunOpen(false)} onOpenApp={openWindow} />}

      {alert && <AlertDialog alert={alert} onClose={() => setAlert(null)} />}

      {quickLook && (
        <QuickLook file={quickLook} onClose={() => setQuickLook(null)} />
      )}

      {toast && <div className={styles.toast}>{toast}</div>}

      {osd && (
        <div className={styles.osd}>
          {osd.kind === "volume" ? (
            <Volume2 size={18} strokeWidth={1.8} />
          ) : (
            <Sun size={18} strokeWidth={1.8} />
          )}
          <span className={styles.osdLabel}>
            {osd.kind === "volume" ? "Volume" : "Brightness"}
          </span>
          <div className={styles.osdBar}>
            <div className={styles.osdFill} style={{ width: `${osd.value}%` }} />
          </div>
        </div>
      )}

      {banner && (
        <div
          className={styles.banner}
          onClick={() => {
            setNotifCenter(true);
            setBanner(null);
          }}
          role="button"
          tabIndex={0}
        >
          <span className={styles.bannerIcon}>
            <Glyph id={banner.icon} size={20} />
          </span>
          <div className={styles.bannerText}>
            <strong>{banner.title}</strong>
            <p>{banner.body}</p>
          </div>
          <span className={styles.bannerRight}>
            <span className={styles.bannerTime}>{banner.time}</span>
            <button
              type="button"
              className={styles.bannerClose}
              onClick={(e) => {
                e.stopPropagation();
                setBanner(null);
              }}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {booting && (
        <div className={styles.boot}>
          <div className={styles.bootLogo}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <div className={styles.bootProgress}>
              <div className={styles.bootProgressFill} />
            </div>
          </div>
        </div>
      )}

      {locked && (
        <LockScreen
          wallpaperSrc={wallpaper.src}
          onUnlock={unlock}
          clockStyle={sys.clockStyle}
          widgetStyle={sys.widgetStyle}
          tint={tint}
          onSleep={sleep}
          onRestart={restart}
          onShutDown={onClose}
          brightness={sys.brightness}
          onWake={() => patchSys({ brightness: 100 })}
        />
      )}

      {/* Mobile context menu — iOS bottom sheet triggered by long-press */}
      <MobileContextMenu
        open={!!mobileCtx}
        title={mobileCtx?.title}
        items={mobileCtx?.items ?? []}
        onClose={() => setMobileCtx(null)}
      />

      {/* Android-style system nav bar — visible when any app is open on mobile */}
      {isMobile && manager.windows.length > 0 && (
        <MobileSystemNavBar
          onBack={() => {
            const focused = manager.focusedId;
            if (focused) closeWindowAnimated(focused);
          }}
          onHome={() => {
            // Close all windows, return to home screen
            manager.windows.forEach((w) => manager.closeWindow(w.id));
          }}
          onRecent={() => setMissionControl(true)}
        />
      )}
    </div>
  );
}
