import { useEffect, useRef, useState } from "react";
import { Sun, Volume2 } from "lucide-react";
import {
  CONTROL_TILE_IDS,
  DEFAULT_HOT_CORNERS,
  DEFAULT_SPACES,
  DEFAULT_WIDGETS,
  DESKTOP_APPS,
  WALLPAPERS,
  WEB_SHORTCUTS,
  WIDGET_IDS,
  type CornerId,
  type HotCornerAction,
  type SpaceConfig,
  type SystemState,
} from "@/constants/desktop";
import { setSpaceContext, useWindowManager } from "@/hooks/useWindowManager";
import MenuBar from "@/components/desktop/MenuBar";
import Dock from "@/components/desktop/Dock";
import Window from "@/components/desktop/Window";
import AppIcon from "@/components/desktop/AppIcon";
import Spotlight from "@/components/desktop/Spotlight";
import AboutThisMac from "@/components/desktop/AboutThisMac";
import MissionControl from "@/components/desktop/MissionControl";
import NotificationCenter, { type OsNotification } from "@/components/desktop/NotificationCenter";
import LockScreen from "@/components/desktop/LockScreen";
import WidgetStack, { WIDGET_META } from "@/components/desktop/WidgetStack";
import StageStrip from "@/components/desktop/StageStrip";
import useWallpaperTint from "@/hooks/useWallpaperTint";
import AppSwitcher from "@/components/desktop/AppSwitcher";
import Launchpad from "@/components/desktop/Launchpad";
import Screensaver from "@/components/desktop/Screensaver";
import EmojiPicker from "@/components/desktop/EmojiPicker";
import AlertDialog, { type AlertOptions } from "@/components/desktop/AlertDialog";
import QuickLook, { type QuickLookFile } from "@/components/desktop/QuickLook";
import FinderApp, { type FinderFile } from "@/components/desktop/apps/FinderApp";
import SettingsApp from "@/components/desktop/apps/SettingsApp";
import AboutApp from "@/components/desktop/apps/AboutApp";
import ResumeApp from "@/components/desktop/apps/ResumeApp";
import ProjectsApp from "@/components/desktop/apps/ProjectsApp";
import NotesApp from "@/components/desktop/apps/NotesApp";
import PhotosApp from "@/components/desktop/apps/PhotosApp";
import VideosApp from "@/components/desktop/apps/VideosApp";
import MapsApp from "@/components/desktop/apps/MapsApp";
import ReadMeApp from "@/components/desktop/apps/ReadMeApp";
import WebsiteApp from "@/components/desktop/apps/WebsiteApp";
import TerminalApp from "@/components/desktop/apps/TerminalApp";
import GamesApp from "@/components/desktop/apps/GamesApp";
import PdfViewerApp from "@/components/desktop/apps/PdfViewerApp";
import { soundEnabled, setSoundEnabled, sounds } from "@/utils/sounds";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

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
  // website is replaced below with a prop-carrying render (per-window URL)
  terminal: TerminalApp,
  games: GamesApp,
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

/* Desktop icon grid — two left columns of app icons, then a column of web
   shortcuts; widgets stay top-right (macOS Tahoe layout). Everything fits
   the viewport: 6 per column at 88px pitch, starting below the menu bar. */
const ICON_GRID = {
  cols: [24, 124, 224],
  perCol: 6,
  pitch: 88,
  startY: 40,
};

const iconGridIndex = (i: number) => ({
  x: ICON_GRID.cols[Math.floor(i / ICON_GRID.perCol)] ?? 24,
  y: ICON_GRID.startY + (i % ICON_GRID.perCol) * ICON_GRID.pitch,
});

export default function MacDesktop({ open, onClose }: MacDesktopProps) {
  const [booting, setBooting] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [missionControl, setMissionControl] = useState(false);
  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const [notifCenter, setNotifCenter] = useState(false);
  const [switcher, setSwitcher] = useState<{ apps: string[]; index: number } | null>(null);
  const [iconMenu, setIconMenu] = useState<{ appId: string; x: number; y: number } | null>(null);
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
  const [screensaver, setScreensaver] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [infoFor, setInfoFor] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const [quickLook, setQuickLook] = useState<QuickLookFile | null>(null);
  const [osd, setOsd] = useState<{ kind: "volume" | "brightness"; value: number } | null>(null);
  const [dndOn, setDndOn] = useState(false);
  const [showDesktop, setShowDesktop] = useState(false);
  const hiddenForDesktop = useRef<string[]>([]);
  const desktopRef = useRef<HTMLDivElement>(null);
  // Widgets: edit mode + measured column height (icons sit below it).
  const [widgetsEditing, setWidgetsEditing] = useState(false);
  const widgetsRef = useRef<HTMLDivElement>(null);
  const [widgetsBottom, setWidgetsBottom] = useState(0);
  const SETTINGS_KEY = "aryan-os-settings-v1";

  const loadSettings = (): SystemState => {
    const defaults: SystemState = {
      wifiOn: true,
      bluetoothOn: true,
      airdropOn: false,
      darkMode: true,
      soundOn: soundEnabled(),
      volume: 90,
      brightness: 100,
      clockStyle: "default",
      reduceTransparency: false,
      showWidgets: true,
      widgetStyle: "default",
      dockSize: 56,
      dockMagnify: true,
      dockMagnifySize: 88,
      dockPosition: "bottom",
      minimizeEffect: "genie",
      dockAutoHide: false,
      stageManager: false,
      showBatteryPct: true,
      screensaverStyle: "flurry",
      screensaverDelay: 1,
      notifPrefs: {},
      controlTiles: [...CONTROL_TILE_IDS],
      widgets: [...DEFAULT_WIDGETS],
      spaces: DEFAULT_SPACES.map((s) => ({ ...s })),
      hotCorners: { ...DEFAULT_HOT_CORNERS },
    };
    if (typeof window === "undefined") return defaults;
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaults;
      return { ...defaults, ...(JSON.parse(raw) as Partial<SystemState>) };
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

  const manager = useWindowManager();
  const windowsRef = useRef(manager.windows);
  windowsRef.current = manager.windows;
  const openWindowRef = useRef<(appId: string) => void>(() => {});
  const welcomeSent = useRef(false);
  const notifSeq = useRef(0);
  const bannerTimer = useRef<number | null>(null);
  const idleTimer = useRef<number | null>(null);
  const osdTimer = useRef<number | null>(null);

  /* ----- boot: welcome notification once ----- */
  useEffect(() => {
    if (!open) return;
    setBooting(true);
    setLocked(true);
    const id = window.setTimeout(() => {
      setBooting(false);
      sounds.bootChime();
    }, 1100);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ----- body scroll lock ----- */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* ----- screensaver after a configurable delay of inactivity ----- */
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
      idleTimer.current = window.setTimeout(() => setScreensaver(true), delayMs);
    };
    const handler = () => {
      setScreensaver(false);
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
    resetIdle();
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handler));
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

  /* ----- power: restart replays the boot, shut down exits, sleep dims the screen ----- */
  const restart = () => {
    manager.windows.forEach((w) => manager.closeWindow(w.id));
    setBooting(true);
    setLocked(true);
    window.setTimeout(() => {
      setBooting(false);
      sounds.bootChime();
    }, 1100);
  };

  const requestRestart = () =>
    setAlert({
      title: "Are you sure you want to restart your computer now?",
      message: "Your open windows will close and Aryan OS will start up again.",
      confirmLabel: "Restart",
      onConfirm: restart,
    });

  const requestShutDown = () =>
    setAlert({
      title: "Are you sure you want to shut down your computer now?",
      message: "Aryan OS will stop. Click Enter the Laptop to start it again.",
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
        pushNotif("🗑️", "Trash", "The Trash is empty.", "finder");
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

  const openWindow = (appId: string) => {
    manager.openWindow(appId);
    sounds.pop();
  };
  openWindowRef.current = openWindow;

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
  // Finder's onOpenApp — web shortcuts carry a url, documents a src,
  // regular apps neither.
  const handleOpen = (appId: string, src?: string, name?: string, url?: string) => {
    if (url) openWebUrl(url, name ?? "Portfolio");
    else if (src) openDocument(src, name ?? "PDF");
    else openWindow(appId);
  };

  const unlock = () => {
    setLocked(false);
    if (!welcomeSent.current) {
      welcomeSent.current = true;
      pushNotif("🖥️", "Welcome to Aryan OS", "Your machine is ready.", "finder");
    }
  };

  const quitApp = (appId: string) => {
    manager.windows
      .filter((w) => w.appId === appId)
      .forEach((w) => closeWindowAnimated(w.id));
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
        else if (launchpadOpen) setLaunchpadOpen(false);
        else if (missionControl) setMissionControl(false);
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
  }, [open, locked, sys, missionControl, launchpadOpen, notifCenter, switcher, emojiOpen, infoFor, alert, quickLook, iconMenu, wallpaperPicker, contextMenu, spotlightOpen, aboutOpen, focusedWindow, onClose]);

  /* ----- desktop icon drag ----- */
  const dragState = useRef<{
    appId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  // Desktop icons sit in a left-side grid (app icons + web shortcuts),
  // clear of the top-right widget stack — see ICON_GRID above.
  const defaultIconPos = (i: number): IconPos => iconGridIndex(i);

  const iconPosFor = (appId: string, i: number): IconPos =>
    iconPos[appId] ?? defaultIconPos(i);

  const onIconPointerDown = (appId: string, i: number, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // don't let the wallpaper's deselect handler fire
    const base = iconPosFor(appId, i);
    dragState.current = {
      appId,
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

  const onIconPointerMove = (appId: string, e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d || d.appId !== appId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.hypot(dx, dy) > 4) {
      d.moved = true;
      setDraggingId(appId);
      setDragPreview({ x: d.origX + dx, y: d.origY + dy });
    }
  };

  const onIconPointerUp = (appId: string, e: React.PointerEvent) => {
    const d = dragState.current;
    if (!d || d.appId !== appId) return;
    dragState.current = null;
    if (d.moved) {
      setIconPos((prev) => ({
        ...prev,
        [appId]: {
          x: d.origX + (e.clientX - d.startX),
          y: d.origY + (e.clientY - d.startY),
        },
      }));
      setDraggingId(null);
      setDragPreview(null);
    }
  };

  const onWallpaperContext = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 230);
    const y = Math.min(e.clientY, window.innerHeight - 280);
    setContextMenu({ x, y });
  };

  /* Keep the desktop-icon column clear of the widget stack: measure the
     widget column height (changes as widgets are added/removed) and feed it
     to defaultIconPos above. */
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
     behavior: wheel over the titlebar still scrolls the app). */
  useEffect(() => {
    const el = desktopRef.current;
    if (!el) return;
    const isScrollable = (n: HTMLElement) =>
      (/(auto|scroll|overlay)/.test(getComputedStyle(n).overflowY) &&
        n.scrollHeight > n.clientHeight) ||
      (/(auto|scroll|overlay)/.test(getComputedStyle(n).overflowX) &&
        n.scrollWidth > n.clientWidth);
    const onWheel = (e: WheelEvent) => {
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
  }, [open]);

  // Hooks must all run before the conditional return — otherwise React sees
  // a different hook count when `open` toggles.
  const space = sys.spaces.find((s) => s.id === currentSpace) ?? sys.spaces[0];
  const tint = useWallpaperTint(WALLPAPERS[space.wallpaperIndex].src);

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
      case "screensaver":
        setScreensaver(true);
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

  const desktopIcons = DESKTOP_APPS.filter((a) => a.onDesktop);
  const wallpaper = WALLPAPERS[space.wallpaperIndex];
  const spaceWindows = manager.windows.filter((w) => w.spaceId === currentSpace);

  const bringStageApp = (appId: string) => {
    const appWindows = spaceWindows.filter((w) => w.appId === appId && !w.minimized);
    appWindows.forEach((w) => manager.bringToFront(w.id));
  };

  return (
    <div
      ref={desktopRef}
      className={`${styles.desktop} ${
        sys.reduceTransparency ? styles.reduced : ""
      } ${sys.stageManager ? styles.stageManagerOn : ""}`}
      role="application"
      aria-label="Aryan OS desktop"
      onContextMenu={onWallpaperContext}
      onPointerMove={onDesktopPointerMove}
    >
      {!anyMaximized && (
        <MenuBar
          focusedAppTitle={focusedWindow?.title ?? null}
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
          actions={{
          onAbout: () => setAboutOpen(true),
          onQuit: onClose,
          onLock: () => setLocked(true),
          onRestart: requestRestart,
          onShutDown: requestShutDown,
          onSleep: sleep,
          onSpotlight: () => setSpotlightOpen(true),
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
        key={space.wallpaperIndex}
        className={styles.wallpaper}
        style={{
          backgroundImage: `url(${wallpaper.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onPointerDown={() => {
          // first click after Sleep wakes the display
          if (sys.brightness === 0) {
            patchSys({ brightness: 100 });
            sounds.pop();
          }
          setSelectedIcon(null);
          // macOS default: clicking the wallpaper reveals the desktop
          toggleShowDesktop();
        }}
      >
        {desktopIcons.map((app, i) => {
          const pos = iconPosFor(app.id, i);
          const preview = draggingId === app.id && dragPreview ? dragPreview : null;
          const finalPos = preview ?? pos;
          return (
            <button
              key={app.id}
              type="button"
              className={`${styles.desktopIcon} ${
                selectedIcon === app.id ? styles.desktopIconSelected : ""
              } ${draggingId === app.id ? styles.desktopIconDragging : ""}`}
              style={{
                transform: `translate(${finalPos.x}px, ${finalPos.y}px)${
                  draggingId === app.id ? " scale(1.08)" : ""
                }`,
              }}
              onClick={() => setSelectedIcon(app.id)}
              onDoubleClick={() => openWindow(app.id)}
              onPointerDown={(e) => onIconPointerDown(app.id, i, e)}
              onPointerMove={(e) => onIconPointerMove(app.id, e)}
              onPointerUp={(e) => onIconPointerUp(app.id, e)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIconMenu({
                  appId: app.id,
                  x: Math.min(e.clientX, window.innerWidth - 220),
                  y: Math.min(e.clientY, window.innerHeight - 200),
                });
              }}
              aria-label={`Open ${app.title}`}
            >
              <AppIcon app={app} size={58} />
              <span className={styles.desktopIconLabel}>{app.title}</span>
            </button>
          );
        })}

        {/* Web shortcuts — .url files on the desktop (like a real Mac):
            double-click one and the Browser opens that site. */}
        {WEB_SHORTCUTS.map((f, j) => {
          const pos = iconGridIndex(desktopIcons.length + j);
          return (
          <button
            key={f.id}
            type="button"
            className={`${styles.desktopIcon} ${
              selectedIcon === f.id ? styles.desktopIconSelected : ""
            }`}
            style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
            onClick={() => setSelectedIcon(f.id)}
            onDoubleClick={() => openWebUrl(f.url, f.name)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-label={`Open ${f.name}`}
          >
            <span className={styles.desktopWebTile} aria-hidden>
              {f.icon}
            </span>
            <span className={styles.desktopIconLabel}>{f.name}</span>
          </button>
          );
        })}
      </div>

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
                      {WIDGET_META[id].emoji} {WIDGET_META[id].label}
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
                />
              ) : win.appId === "pdf" ? (
                <PdfViewerApp src={pdfSrcs[win.id] ?? ""} title={win.title} />
              ) : win.appId === "website" ? (
                <WebsiteApp initialUrl={webUrls[win.id]} />
              ) : win.appId === "settings" ? (
                <SettingsApp
                  system={sys}
                  onSystemChange={patchSys}
                  wallpaperIndex={space.wallpaperIndex}
                  onWallpaper={(i) => {
                    patchSys({
                      spaces: sys.spaces.map((s) =>
                        s.id === currentSpace ? { ...s, wallpaperIndex: i } : s,
                      ),
                    });
                    sounds.pop();
                    pushNotif(
                      "🖼️",
                      "Wallpaper",
                      `Wallpaper changed to ${WALLPAPERS[i].name}.`,
                      "settings",
                    );
                  }}
                  onAbout={() => setAboutOpen(true)}
                />
              ) : View ? (
                <View />
              ) : (
                <div>App not found</div>
              )}
            </Window>
          );
        })}

      {sys.brightness < 100 && (
        <div
          className={styles.dimOverlay}
          style={{ opacity: 1 - sys.brightness / 100 }}
        />
      )}

      {!anyMaximized && (
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
          pushNotif("🗑️", "Trash", "The Trash is empty.", "finder");
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
                showToast("New folder added to desktop");
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
                        s.id === currentSpace ? { ...s, wallpaperIndex: i } : s,
                      ),
                    });
                    setWallpaperPicker(false);
                    sounds.pop();
                    pushNotif("🖼️", "Wallpaper", `Wallpaper changed to ${wp.name}.`, "settings");
                  }}
                  aria-label={wp.name}
                >
                  <span
                    className={styles.wallpaperThumbArt}
                    style={{
                      backgroundImage: `url(${wp.src})`,
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
          onClose={() => setEmojiOpen(false)}
          onCopy={(em) => {
            void navigator.clipboard?.writeText(em);
            showToast(`Copied “${em}”`);
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
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setIconMenu(null);
                openWindow(iconMenu.appId);
              }}
            >
              Open
            </button>
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setIconMenu(null);
                setInfoFor(iconMenu.appId);
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
          <span className={styles.bannerIcon}>{banner.icon}</span>
          <div className={styles.bannerText}>
            <strong>{banner.title}</strong>
            <p>{banner.body}</p>
          </div>
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
        </div>
      )}

      {booting && (
        <div className={styles.boot}>
          <div className={styles.bootLogo}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span>Aryan OS</span>
            <div className={styles.bootProgress}>
              <div className={styles.bootProgressFill} />
            </div>
          </div>
        </div>
      )}

      {screensaver && !locked && !booting && (
        <Screensaver
          style={sys.screensaverStyle}
          onDismiss={() => setScreensaver(false)}
        />
      )}

      {locked && (
        <LockScreen
          wallpaperSrc={wallpaper.src}
          onUnlock={unlock}
          clockStyle={sys.clockStyle}
          widgetStyle={sys.widgetStyle}
          tint={tint}
        />
      )}
    </div>
  );
}
