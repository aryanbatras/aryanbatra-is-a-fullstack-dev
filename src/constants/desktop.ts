/**
 * Content + configuration for the macOS-style desktop on /new.
 * Everything the desktop renders (icons, dock, documents, projects) is
 * declared here so it can be edited in one place.
 */

/** System-wide toggle/slider state shared by the menu bar, Control Center and System Settings. */
export type ClockStyle = "default" | "numeric" | "analog" | "world";

/** macOS Tahoe: Settings → Appearance → Icon & Widget Style. */
export type WidgetStyle = "default" | "dark" | "tinted";

/** Settings → Appearance → Color (macOS Tahoe: the eight theme accents). */
export type AccentColorId =
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "graphite";

/** Theme accent colours (Tahoe presets, dark-mode variants). */
export const ACCENT_COLORS: Record<AccentColorId, { swatch: string; rgb: string }> = {
  blue: { swatch: "#0a84ff", rgb: "10, 132, 255" },
  purple: { swatch: "#bf5af2", rgb: "191, 90, 242" },
  pink: { swatch: "#ff375f", rgb: "255, 55, 95" },
  red: { swatch: "#ff453a", rgb: "255, 69, 58" },
  orange: { swatch: "#ff9f0a", rgb: "255, 159, 10" },
  yellow: { swatch: "#ffd60a", rgb: "255, 214, 10" },
  green: { swatch: "#30d158", rgb: "48, 209, 88" },
  graphite: { swatch: "#8e8e93", rgb: "142, 142, 147" },
};

export type DockPosition = "bottom" | "left" | "right";

export type MinimizeEffect = "genie" | "scale";

/** macOS Spaces: a desktop with its own wallpaper. */
export interface SpaceConfig {
  id: number;
  name: string;
  wallpaperIndex: number;
  /** daedalOS “Set as wallpaper”: a custom image replaces the built-in one. */
  customWallpaper?: string;
  /** Name of the custom wallpaper, for Settings. */
  customWallpaperName?: string;
}

export const DEFAULT_SPACES: SpaceConfig[] = [
  { id: 1, name: "Desktop 1", wallpaperIndex: 0 },
  { id: 2, name: "Desktop 2", wallpaperIndex: 1 },
  { id: 3, name: "Desktop 3", wallpaperIndex: 5 },
];

/** Hot Corner actions (Desktop & Dock → Hot Corners…). */
export type HotCornerAction =
  | "none"
  | "mission-control"
  | "show-desktop"
  | "launchpad"
  | "lock"
  | "screensaver"
  | "next-space"
  | "prev-space";

export type CornerId = "tl" | "tr" | "bl" | "br";

export const DEFAULT_HOT_CORNERS: Record<CornerId, HotCornerAction> = {
  tl: "none",
  tr: "mission-control",
  bl: "none",
  br: "none",
};

/** macOS Notifications: alert style when unlocked, per app. */
export type NotifStyle = "none" | "banners" | "alerts";

export interface NotifPref {
  allow: boolean;
  style: NotifStyle;
}

export const DEFAULT_NOTIF_PREF: NotifPref = { allow: true, style: "banners" };

/** Desktop widgets available for the right-column stack (Settings → Wallpaper → Widgets). */
export const WIDGET_IDS = ["clock", "weather", "calendar"] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

/** Ordered ids of the visible desktop widgets — editable + draggable.
 *  macOS Tahoe ships with default desktop widgets (clock, weather, calendar)
 *  right on the wallpaper — users remove them via Edit Widgets… if they
 *  prefer a clean desktop. */
export const DEFAULT_WIDGETS: WidgetId[] = ["clock", "weather", "calendar"];

/** Control Center tile ids in their default order (Settings → Control Center).
 *  Only tiles backed by something REAL are kept: Wi-Fi reports the actual
 *  connection, focus/display/sound/stage-manager control real OS state, and
 *  mission control / app switcher perform real actions. Bluetooth, AirDrop
 *  and screen mirroring can't be controlled from a web page, so they're
 *  not offered as fake tiles. */
export const CONTROL_TILE_IDS = [
  "wifi",
  "focus",
  "display",
  "sound",
  "music",
  "stage-manager",
  "mission-control",
  "app-switcher",
] as const;

export type ControlTileId = (typeof CONTROL_TILE_IDS)[number];

export interface SystemState {
  wifiOn: boolean;
  bluetoothOn: boolean;
  airdropOn: boolean;
  darkMode: boolean;
  soundOn: boolean;
  /** 0-100 */
  volume: number;
  /** 0-100 */
  brightness: number;
  /** Lock-screen clock appearance (macOS Tahoe: Settings → Wallpaper → Clock). */
  clockStyle: ClockStyle;
  /** Menu-bar clock source: device local time, or NTP server time (daedalOS). */
  clockSource: "local" | "ntp";
  /** Tahoe accessibility: replaces Liquid Glass with near-solid fills. */
  reduceTransparency: boolean;
  /** Settings → Appearance → Color (accent): drives selection, buttons and
   *  highlights system-wide. One of the eight macOS theme colors. */
  accentColor: AccentColorId;
  /** Desktop widgets (top-right column, like real macOS). */
  showWidgets: boolean;
  /** Rotate through the real wallpapers automatically (daedalOS slideshow). */
  slideshow: boolean;
  /** Wallpaper fit mode (daedalOS: Fill/Fit/Stretch/Tile/Center). */
  wallpaperFit: "fill" | "fit" | "stretch" | "tile" | "center";
  /** Seconds between wallpaper changes. */
  slideshowInterval: number;
  /** Tahoe: Icon & Widget Style — default glass, solid dark, or wallpaper-tinted. */
  widgetStyle: WidgetStyle;
  /** Desktop & Dock: base icon size in px (macOS Dock Size slider). */
  dockSize: number;
  /** Desktop & Dock: magnify icons on hover. */
  dockMagnify: boolean;
  /** Desktop & Dock: magnified icon size in px. */
  dockMagnifySize: number;
  /** Desktop & Dock: position on screen. */
  dockPosition: DockPosition;
  /** Desktop & Dock: minimize-window effect. */
  minimizeEffect: MinimizeEffect;
  /** Desktop & Dock: automatically hide and show the Dock. */
  dockAutoHide: boolean;
  /** Desktop & Dock: automatically hide and show the menu bar (hover the top edge). */
  autoHideMenuBar: boolean;
  /** Settings → Wallpaper → Menu bar: transparent (Tahoe) vs semi-transparent (Sequoia). */
  menuBarStyle: "transparent" | "semi";
  /** Stage Manager — focused app front and center, others in the side strip. */
  stageManager: boolean;
  /** Settings → Battery: show the percentage in the menu bar. */
  showBatteryPct: boolean;
  /** Settings → Desktop & Dock → Screen Saver: which saver to play. */
  screensaverStyle: "flurry" | "aerial" | "clock" | "matrix" | "pipes";
  /** Minutes of inactivity before the saver starts (0 = Never). */
  screensaverDelay: number;
  /** Settings → Notifications: per-app alert style. Absent = default banners. */
  notifPrefs: Record<string, NotifPref>;
  /** Control Center: ordered visible tile ids. Empty = the default layout. */
  controlTiles: ControlTileId[];
  /** Desktop widgets: ordered visible ids (empty = none). */
  widgets: WidgetId[];
  /** macOS Spaces: desktops with their own wallpaper. */
  spaces: SpaceConfig[];
  /** Desktop & Dock → Hot Corners: corner → action. */
  hotCorners: Record<CornerId, HotCornerAction>;
  /** Trackpad & Mouse → Gestures: pinch (two fingers) opens Launchpad. */
  pinchLaunchpad: boolean;
  /** Trackpad & Mouse → Gestures: swipe up (two fingers) opens Mission Control. */
  swipeMissionControl: boolean;
  /** Desktop → View: icon sort mode. None = grid order. */
  desktopSort: "name" | "kind" | "date" | "none";
  /** Desktop → View: icon size in px (drives the grid pitch too). */
  desktopIconSize: number;
  /** Desktop → View: bump to reset all icon positions to the grid. */
  desktopIconReset: number;
  /** Launchpad: ordered items (app ids + folder markers). */
  launchpadItems: LaunchpadItem[];
  /** Launchpad: user folders with their app ids. */
  launchpadFolders: LaunchpadFolder[];
  /** Launchpad: app ids hidden by the user (edit mode ×). */
  launchpadHidden: string[];
  /** Wallpaper: user-created folders (right-click → New Folder). */
  desktopFolders: DesktopFolder[];
}

/** One slot in the Launchpad grid — an app or a folder. */
export interface LaunchpadItem {
  kind: "app" | "folder";
  id: string;
}

/** A user-created folder on the wallpaper (right-click → New Folder).
 *  macOS Tahoe lets you tint folders and add an emoji badge — both optional. */
export interface DesktopFolder {
  id: string;
  name: string;
  /** macOS folder color id ("blue" | "gray" | "green" | "orange" | "pink" | "purple" | "red" | "yellow"). */
  color?: string;
  /** Optional emoji badge shown on the folder (Tahoe folder emoji). */
  emoji?: string;
}

/** macOS Tahoe folder colors (Finder right-click → Color). */
export const FOLDER_COLORS = [
  "blue",
  "gray",
  "green",
  "orange",
  "pink",
  "purple",
  "red",
  "yellow",
] as const;

export type FolderColor = (typeof FOLDER_COLORS)[number];

/** The dominant fill for each macOS folder color. */
export const FOLDER_COLOR_FILL: Record<string, string> = {
  blue: "#2e7cf6",
  gray: "#8e8e93",
  green: "#2fbd4f",
  orange: "#f29100",
  pink: "#f0558c",
  purple: "#9b59d0",
  red: "#e5484d",
  yellow: "#f2c029",
};

/** A user-made Launchpad folder (drag one app onto another). */
export interface LaunchpadFolder {
  id: string;
  name: string;
  apps: string[];
}

export interface DesktopAppConfig {
  id: string;
  title: string;
  icon: string;
  /** Path to the original macOS app icon (extracted from macOS Tahoe 26). */
  iconUrl: string;
  /** Default window size in px. */
  width: number;
  height: number;
  /** Minimum window size in px. */
  minWidth: number;
  minHeight: number;
  /** Show on the desktop grid (Finder-style icons). */
  onDesktop: boolean;
  /** Show in the dock. */
  inDock: boolean;
}

export const DESKTOP_APPS: DesktopAppConfig[] = [
  { id: "finder", title: "Finder", icon: "folder", iconUrl: "/aryan/icons/finder.png", width: 720, height: 500, minWidth: 520, minHeight: 380, onDesktop: true, inDock: true },
  { id: "about", title: "About Me", icon: "user", iconUrl: "/aryan/icons/contacts.png", width: 560, height: 420, minWidth: 420, minHeight: 320, onDesktop: false, inDock: false },
  { id: "resume", title: "Resume", icon: "file-text", iconUrl: "/aryan/icons/preview.png", width: 680, height: 560, minWidth: 480, minHeight: 400, onDesktop: false, inDock: false },
  { id: "projects", title: "Projects", icon: "folder", iconUrl: "/aryan/icons/folder.png", width: 640, height: 480, minWidth: 480, minHeight: 360, onDesktop: true, inDock: false },
  { id: "notes", title: "Notes", icon: "sticky-note", iconUrl: "/aryan/icons/notes.png", width: 620, height: 460, minWidth: 440, minHeight: 340, onDesktop: false, inDock: false },
  { id: "photos", title: "Photos", icon: "image", iconUrl: "/aryan/icons/photos.png", width: 640, height: 480, minWidth: 480, minHeight: 360, onDesktop: false, inDock: false },
  { id: "videos", title: "Videos", icon: "film", iconUrl: "/aryan/icons/quicktime.png", width: 640, height: 480, minWidth: 480, minHeight: 360, onDesktop: false, inDock: false },
  { id: "maps", title: "Maps", icon: "map", iconUrl: "/aryan/icons/maps.png", width: 720, height: 520, minWidth: 520, minHeight: 380, onDesktop: false, inDock: false },
  { id: "readme", title: "Read Me", icon: "book-open", iconUrl: "/aryan/icons/textedit.png", width: 600, height: 460, minWidth: 440, minHeight: 340, onDesktop: false, inDock: false },
  { id: "terminal", title: "Terminal", icon: "terminal", iconUrl: "/aryan/icons/terminal.png", width: 620, height: 400, minWidth: 440, minHeight: 280, onDesktop: false, inDock: true },
  { id: "monaco", title: "VS Code", icon: "file-text", iconUrl: "/aryan/icons/monaco.png", width: 760, height: 560, minWidth: 520, minHeight: 380, onDesktop: false, inDock: true },
  { id: "textedit", title: "TextEdit", icon: "file-text", iconUrl: "/aryan/icons/textedit.png", width: 680, height: 520, minWidth: 480, minHeight: 360, onDesktop: false, inDock: false },
  { id: "games", title: "Games", icon: "gamepad", iconUrl: "/aryan/icons/games.svg", width: 720, height: 600, minWidth: 520, minHeight: 440, onDesktop: false, inDock: false },
  { id: "paint", title: "Paint", icon: "image", iconUrl: "/aryan/icons/paint.png", width: 760, height: 560, minWidth: 560, minHeight: 420, onDesktop: false, inDock: false },
  { id: "webamp", title: "Winamp", icon: "webamp", iconUrl: "/aryan/icons/webamp.png", width: 480, height: 420, minWidth: 380, minHeight: 300, onDesktop: false, inDock: false },
  // VLC — dark media player for the film library and Finder movies.
  { id: "vlc", title: "VLC", icon: "film", iconUrl: "/aryan/icons/vlc.png", width: 720, height: 520, minWidth: 480, minHeight: 340, onDesktop: false, inDock: false },
  // Vim — the real vim.js editor (daedalOS).
  { id: "vim", title: "Vim", icon: "terminal", iconUrl: "/aryan/icons/vim.png", width: 700, height: 480, minWidth: 460, minHeight: 320, onDesktop: false, inDock: false },
  // DevTools — eruda (console, elements, network, resources, sources).
  { id: "devtools", title: "DevTools", icon: "terminal", iconUrl: "/aryan/icons/eruda.png", width: 720, height: 520, minWidth: 480, minHeight: 360, onDesktop: false, inDock: false },
  // OpenType — font viewer for .otf/.ttf/.woff files (daedalOS).
  { id: "opentype", title: "OpenType", icon: "file-text", iconUrl: "/aryan/icons/opentype.png", width: 640, height: 520, minWidth: 460, minHeight: 380, onDesktop: false, inDock: false },
  // TinyMCE — rich-text editor for .rtf / .whtml files (daedalOS).
  { id: "tinymce", title: "TinyMCE", icon: "file-text", iconUrl: "/aryan/icons/tinymce.png", width: 720, height: 540, minWidth: 520, minHeight: 380, onDesktop: false, inDock: false },
  // IRC — KiwiIRC web chat client (daedalOS).
  { id: "irc", title: "IRC", icon: "message-square", iconUrl: "/aryan/icons/kiwiirc.png", width: 760, height: 560, minWidth: 560, minHeight: 400, onDesktop: false, inDock: false },
  // TIC-80 — the fantasy computer (daedalOS). .tic carts open here.
  { id: "tic80", title: "TIC-80", icon: "emulator", iconUrl: "/aryan/icons/tic80.png", width: 760, height: 560, minWidth: 560, minHeight: 400, onDesktop: false, inDock: false },
  // ClassiCube — Minecraft Classic client (daedalOS).
  { id: "classicube", title: "ClassiCube", icon: "gamepad", iconUrl: "/aryan/icons/classicube.png", width: 800, height: 600, minWidth: 560, minHeight: 400, onDesktop: false, inDock: false },
  // BoxedWine — runs real 16/32-bit Windows programs (.exe / .zip, daedalOS).
  { id: "boxedwine", title: "BoxedWine", icon: "terminal", iconUrl: "/aryan/icons/boxedwine.png", width: 640, height: 480, minWidth: 480, minHeight: 360, onDesktop: false, inDock: false },
  // Virtual x86 — full x86 PC emulator (.img / .iso, daedalOS).
  { id: "v86", title: "Virtual x86", icon: "hard-drive", iconUrl: "/aryan/icons/v86.png", width: 800, height: 600, minWidth: 560, minHeight: 400, onDesktop: false, inDock: false },
  // Messenger — encrypted direct messaging over Nostr (NIP-04, daedalOS).
  { id: "messenger", title: "Messenger", icon: "message-square", iconUrl: "/aryan/icons/messenger.png", width: 760, height: 540, minWidth: 560, minHeight: 400, onDesktop: false, inDock: false },
  // Console emulator (EmulatorJS) — drop a ROM and play (daedalOS).
  { id: "emulator", title: "Emulator", icon: "emulator", iconUrl: "/aryan/icons/emulator.png", width: 720, height: 560, minWidth: 480, minHeight: 360, onDesktop: false, inDock: false },
  // Flash player (Ruffle) — .swf files play in the browser.
  { id: "ruffle", title: "Ruffle", icon: "ruffle", iconUrl: "/aryan/icons/ruffle.png", width: 720, height: 560, minWidth: 480, minHeight: 360, onDesktop: false, inDock: false },
  // DOSBox (js-dos) — .jsdos/.exe/.zip DOS games.
  { id: "jsdos", title: "DOS", icon: "jsdos", iconUrl: "/aryan/icons/jsdos.png", width: 760, height: 560, minWidth: 480, minHeight: 360, onDesktop: false, inDock: false },
  { id: "settings", title: "System Settings", icon: "settings", iconUrl: "/aryan/icons/settings.png", width: 760, height: 520, minWidth: 600, minHeight: 420, onDesktop: false, inDock: false },
  // Safari — the machine's browser. Opens Google by default (daedalOS-style
  // basic-HTML Google works in an iframe); the portfolio is a bookmark.
  { id: "website", title: "Safari", icon: "globe", iconUrl: "/aryan/icons/safari.png", width: 960, height: 640, minWidth: 640, minHeight: 460, onDesktop: true, inDock: true },
  // Hidden helper app: renders a PDF document (Finder Downloads etc.).
  { id: "pdf", title: "PDF", icon: "file-text", iconUrl: "/aryan/icons/preview.png", width: 720, height: 560, minWidth: 480, minHeight: 360, onDesktop: false, inDock: false },
  // Hidden helper app: renders a .md file (daedalOS Marked).
  { id: "markdown", title: "Markdown", icon: "book-open", iconUrl: "/aryan/icons/textedit.png", width: 680, height: 520, minWidth: 480, minHeight: 360, onDesktop: false, inDock: false },
  // DX-Ball — the classic block breaker (daedalOS).
  { id: "dxball", title: "DX-Ball", icon: "pinball", iconUrl: "/aryan/icons/dxball.png", width: 720, height: 540, minWidth: 560, minHeight: 400, onDesktop: false, inDock: false },
];

/* ------------------------------------------------------------------ */
/* Wallpapers                                                          */
/* ------------------------------------------------------------------ */

export interface Wallpaper {
  id: string;
  name: string;
  /** Path to the real macOS wallpaper image. */
  src: string;
}

export const WALLPAPERS: Wallpaper[] = [
  // Windows 11 — the original Bloom wallpaper (by Six N. Five): blue fabric
  // folded like a rose over a soft blue field. The user's choice.
  { id: "windows11-bloom", name: "Windows 11 — Bloom", src: "/aryan/wallpapers/windows11-bloom.jpg" },
  // The Tahoe dynamic beach series (the real macOS Tahoe wallpapers).
  { id: "tahoe-beach-dawn", name: "Tahoe Beach — Dawn", src: "/aryan/wallpapers/tahoe-beach-Dawn.jpg" },
  { id: "tahoe-beach-day", name: "Tahoe Beach — Day", src: "/aryan/wallpapers/tahoe-beach-Day.jpg" },
  { id: "tahoe-beach-dusk", name: "Tahoe Beach — Dusk", src: "/aryan/wallpapers/tahoe-beach-Dusk.jpg" },
  { id: "tahoe-beach-night", name: "Tahoe Beach — Night", src: "/aryan/wallpapers/tahoe-beach-Night.jpg" },
];

/* ------------------------------------------------------------------ */
/* Spotlight                                                           */
/* ------------------------------------------------------------------ */

export interface SpotlightItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  /** appId to open, or a special action. */
  action: string;
}

export const SPOTLIGHT_ITEMS: SpotlightItem[] = [
  ...DESKTOP_APPS.filter((a) => a.id !== "pdf").map((a) => ({
    id: `app-${a.id}`,
    title: a.title,
    subtitle: "Application",
    icon: a.icon,
    action: `app:${a.id}`,
  })),
  { id: "file-resume", title: "Resume.pdf", subtitle: "Document — 2 MB", icon: "file-text", action: "app:resume" },
  { id: "file-showreel", title: "showreel.mp4", subtitle: "Movie — 32s · 35 MB", icon: "film", action: "app:videos" },
  { id: "file-readme", title: "README.txt", subtitle: "Plain text — 2 KB", icon: "book-open", action: "app:readme" },
  { id: "sys-about", title: "About This Mac", subtitle: "System information", icon: "apple", action: "about" },
  { id: "sys-settings", title: "System Settings", subtitle: "System preferences", icon: "settings", action: "app:settings" },
  { id: "action-dark", title: "Toggle Dark Mode", subtitle: "Action — Appearance", icon: "moon", action: "toggle-dark" },
  { id: "action-lock", title: "Lock Screen", subtitle: "Action — Security", icon: "lock", action: "lock" },
];

export const APP_ICON: Record<string, string> = Object.fromEntries(
  DESKTOP_APPS.map((a) => [a.id, a.icon]),
);

/* ------------------------------------------------------------------ */
/* Web shortcuts — .url files that open the Browser at a site          */
/* ------------------------------------------------------------------ */

export interface WebShortcut {
  id: string;
  /** File name shown on the desktop / in Finder (like a real .url file). */
  name: string;
  /** Where the Browser navigates when the file is opened. */
  url: string;
  /** Emoji thumbnail for the file tile. */
  icon: string;
  /** Finder subtitle. */
  hint: string;
}

/** Internet-location files — double-click one and the Browser opens there. */
export const WEB_SHORTCUTS: WebShortcut[] = [
  { id: "web-portfolio", name: "Portfolio.url", url: "/legacy", icon: "globe", hint: "The classic portfolio website" },
  { id: "web-3d", name: "3D Experience.url", url: "/3d", icon: "box", hint: "The interactive 3D portfolio" },
  { id: "web-piano", name: "Online Piano.url", url: "https://online-piano-two.vercel.app", icon: "piano", hint: "Play the piano with your keyboard" },
  { id: "web-browser-ai", name: "Browser AI.url", url: "https://browser-ai-dun.vercel.app", icon: "bot", hint: "AI that runs on your machine" },
  { id: "web-movers", name: "Weekend Movers.url", url: "https://weekend-movers.vercel.app", icon: "truck", hint: "The GSAP re-design, live" },
  { id: "web-startx", name: "StartX.url", url: "https://startx-zeta.vercel.app", icon: "rocket", hint: "AI startup validation platform" },
  { id: "web-bookofrose", name: "Book of Rose.url", url: "https://bookofrose.vercel.app", icon: "flower", hint: "The philosophical book, live" },
  { id: "web-github", name: "GitHub.url", url: "https://github.com/aryanbatras", icon: "github", hint: "All my repositories" },
];

/* ------------------------------------------------------------------ */
/* Resume                                                              */
/* ------------------------------------------------------------------ */

export const RESUME = {
  name: "Aryan Batra",
  title: "Software Engineer",
  contact:
    "Jammu & Kashmir, India · (+91) 9149469833 · batraaryan03@gmail.com · 100xsystems.dev · linkedin.com/in/aryanbatra",
  summary:
    "My dev journey started out of pure curiosity — diving headfirst into graphics, systems, and low-level mechanics. I ended up building a multithreaded 3D ray tracing engine from scratch in pure Java (zero engine libraries) and turning it into a 3D data structure visualizer just to see how far I could push pure math and concurrency.\n\nFrom there, I moved into production backend and cloud architectures. At Sashel, I worked on a 30+ microservice Java ecosystem on AWS, designing database schemas from scratch and building custom automation pipelines with n8n and Activepieces to optimize multi-vendor order flows.\n\nAround the same time, I started exploring global tech and developer education — engineering automated social media distribution tools for an international team at Polarions (Sweden), authoring a 240-page Spring Boot curriculum at CodeVeda, and co-building JU Learning using React and Supabase for university students. Recently at A2B Digital Solutions, I went all-in on production-grade microservices — building 50+ Spring Boot APIs, setting up schema migrations with Flyway, automating document pipelines with Thymeleaf, and configuring full system observability using Prometheus, Grafana, and Loki.\n\nToday, I'm the Founder & Lead Systems Engineer at 100xsystems, building an open EdTech ecosystem focused on deep systems engineering. From custom Node.js CLI tools (Ink/Pastel) to automated test evaluators (Vitest/JUnit5) and feed aggregators, I spend my time building developer tools and mastering clean architecture.",
  experience: [
    {
      role: "Founder",
      company: "JU Learning",
      period: "Jul 2026 — Present",
      points: [
        "Building a centralized student learning platform using React and Supabase.",
        "Designing structured academic repositories and resource-sharing tools for university students.",
      ],
    },
    {
      role: "Founder & Lead Systems Engineer",
      company: "100xsystems",
      period: "Feb 2026 — Present",
      points: [
        "Architected an open EdTech ecosystem and SDE bootcamp focused on deep systems engineering.",
        "Worked on GitHub Organisation, CLI System (Ink + Pastel), Custom CMS (React Quill), Feed Generators, Massive Course Handling, and Custom Testing Libraries (Vitest, JUnit5) and more.",
      ],
    },
    {
      role: "Software Engineer Intern",
      company: "A2B Digital Solutions",
      period: "May 2026 — Jul 2026",
      points: [
        "Built 50+ production-grade Spring Boot APIs with Hibernate, PostgreSQL, and AWS SNS/SQS, managing schema migrations via Flyway.",
        "Configured full system observability and log aggregation using Prometheus, Grafana, and Loki.",
        "Automated document pipelines using OpenHtmlToPdf, JTE, and Thymeleaf, cutting document overhead by 40%.",
        "Established strict CI/CD and unit testing standards using Jenkins, Docker, JUnit5, JaCoCo, OpenAPI Swagger, Storybook, and Chromatic.",
      ],
    },
    {
      role: "Robotics Engineer",
      company: "e-Yantra, IIT Bombay",
      period: "Dec 2025",
      points: [
        "Worked on Python, Coppelia Simulator, Ubuntu, and Bash scripts — building a self-balancing bot.",
      ],
    },
    {
      role: "Technical Writer",
      company: "Codeveda",
      period: "Nov 2025",
      points: [
        "Authored comprehensive curriculum and documentation for a 240-page Spring Boot course covering REST APIs, AOP, Transactions, Caching, Redis, Spring Security (JWT), and AWS integrations.",
      ],
    },
    {
      role: "Automation Engineer",
      company: "Polarions (Sweden)",
      period: "Oct 2025",
      points: [
        "Engineered an automated social media distribution system orchestrating n8n, OpenRouter, Meta API, Facebook Graph, Google Docs/Sheets/Drive APIs, Mistral AI, and Groq AI.",
        "Mentored junior developers and led cross-border technical workflows.",
      ],
    },
    {
      role: "Software Engineer",
      company: "Sashel",
      period: "Jul 2025 — Oct 2025",
      points: [
        "Contributed to a 30+ microservices architecture built in Java deployed on AWS.",
        "Worked on Shopify, Shiprocket, Razorpay, Activepieces, Spring Boot, React.js and microservices.",
        "Designed relational database schemas from scratch and deployed 4 production microservices.",
      ],
    },
  ],
  skillGroups: [
    {
      category: "Languages",
      items: ["Java", "JavaScript (ES6+)", "TypeScript", "C/C++", "Python", "Lua", "SQL", "HTML/CSS", "Bash"],
    },
    {
      category: "Backend & Cloud",
      items: ["Spring Boot", "Hibernate", "Node.js", "Cloudflare Workers", "REST APIs", "Microservices", "PostgreSQL", "Turso Cloud DB", "Supabase", "Firebase", "AWS (EC2, S3, SQS/SNS)", "Docker", "CI/CD", "Jenkins", "Jfrog", "Shiprocket", "Razorpay"],
    },
    {
      category: "Observability & Tooling",
      items: ["Prometheus", "Grafana", "Loki", "Axiom Monitoring", "Flyway", "CMake", "FFmpeg", "Git", "Swagger", "Storybook", "Chromatic"],
    },
    {
      category: "AI & Automation",
      items: ["n8n", "Activepieces", "OpenRouter", "Meta API", "Google Docs/Sheets/Drive APIs", "Groq AI", "Mistral AI", "Cerebras AI", "Zai API", "Instamojo", "Resend API"],
    },
    {
      category: "Frontend",
      items: ["React.js", "Next.js", "SolidJS", "Three.js", "React Three Fiber", "Tailwind CSS", "GSAP", "React Flow", "Motion", "Mermaid.js", "styled-components", "SASS", "Monaco Editor", "shadcn", "npm", "BlueSky Client"],
    },
    {
      category: "Core CS",
      items: ["Data Structures", "Algorithms", "Systems Design", "Ray Tracing", "Computer Graphics", "Concurrency"],
    },
  ],
  skills: [
    "Java", "JavaScript (ES6+)", "TypeScript", "C/C++", "Python", "Lua", "SQL", "HTML/CSS", "Bash",
    "Spring Boot", "Hibernate", "Node.js", "Cloudflare Workers", "REST APIs", "Microservices",
    "PostgreSQL", "Turso Cloud DB", "Supabase", "Firebase", "AWS (EC2, S3, SQS/SNS)", "Docker", "CI/CD",
    "Jenkins", "Jfrog", "Shiprocket", "Razorpay",
    "Prometheus", "Grafana", "Loki", "Axiom Monitoring", "Flyway", "CMake", "FFmpeg", "Git", "Swagger", "Storybook", "Chromatic",
    "n8n", "Activepieces", "OpenRouter", "Meta API", "Google Docs/Sheets/Drive APIs", "Groq AI", "Mistral AI", "Cerebras AI", "Zai API", "Instamojo", "Resend API",
    "React.js", "Next.js", "SolidJS", "Three.js", "React Three Fiber", "Tailwind CSS", "GSAP", "React Flow",
    "Motion", "Mermaid.js", "styled-components", "SASS", "Monaco Editor", "shadcn", "npm", "BlueSky Client",
    "Data Structures", "Algorithms", "Systems Design", "Ray Tracing", "Computer Graphics", "Concurrency",
  ],
  education: [
    {
      institution: "MBS College of Engg. & Technology",
      degree: "Bachelor of Technology — BTech",
      field: "Computer Science",
      period: "2023 — 2027",
    },
  ],
  certifications: [
    {
      name: "DevOps for beginners: Docker, K8s, Cloud, CI/CD & 4 Projects",
      issuer: "Udemy",
      period: "Sep 2025",
    },
  ],
  honors: [
    {
      title: "Author — The Book of Rose",
      issuer: "Self-published · Jun 2024",
      period: "Jun 2024",
      description:
        "A philosophical book exploring the meaning of life and love, written for those who wished they had this book when they started their journey. Later pages hold the raw, unfiltered diary of the author. The book now lives as a website.",
      url: "https://bookofrose.vercel.app/",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export interface Project {
  name: string;
  tagline: string;
  tech: string[];
  description: string;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  dateRange: string;
  category: string;
}

export const PROJECTS: Project[] = [
  {
    name: "Bluesky Client — Social Media",
    tagline: "Bluesky social media client with an Instagram adaptation",
    tech: ["Next.js", "BlueSky Client"],
    description:
      "Bluesky social media client with Instagram adaptation — multiple custom feeds, NSFW filter, bookmarks, downloading, dark mode, immersive mode and much more.",
    dateRange: "Jul 2026 — Present",
    category: "web",
  },
  {
    name: "Rose Social Media",
    tagline: "An RPG game built from scratch in Next.js",
    tech: ["Next.js", "Artificial Intelligence (AI)", "Game Design"],
    description:
      "An RPG game built from scratch in Next.js. During the course of building this game, I learned game mechanics, asset building using AI and Google Flow, and how to design a great storyline — all while having fun mini-games in it.",
    githubUrl: "https://github.com/aryanbatras/rose",
    dateRange: "Jul 2026",
    category: "game",
  },
  {
    name: "College Girl RPG Game",
    tagline: "An RPG game built from scratch in Next.js",
    tech: ["Next.js", "Game Design"],
    description:
      "An RPG game built from scratch in Next.js with game mechanics, AI-assisted asset building, and a designed storyline.",
    githubUrl: "https://github.com/aryanbatras/college-girl-rpg-game",
    dateRange: "Jul 2026",
    category: "game",
  },
  {
    name: "Weekend Movers Re-design",
    tagline: "A redesign of weekendmovers.com.au",
    tech: ["GSAP", "Image Generation", "AI Video Generation", "Storybook", "Web Design"],
    description:
      "A complete re-design of the Weekend Movers website (weekendmovers.com.au) — rebuilt with GSAP animations and AI-assisted image and video generation.",
    liveUrl: "https://weekend-movers.vercel.app/",
    imageUrl: "/images/weekend-movers.jpg",
    dateRange: "Jun 2026",
    category: "web",
  },
  {
    name: "The Book of Rose",
    tagline: "A live website of the philosophical book I wrote",
    tech: ["Next.js", "Technical Writing"],
    description:
      "A live website of the philosophical book I wrote named \"The Book of Rose\" — a journey through the meaning of life and love.",
    liveUrl: "https://bookofrose.vercel.app/",
    imageUrl: "/images/book-of-rose.jpg",
    dateRange: "Jun 2026",
    category: "web",
  },
  {
    name: "Browser AI",
    tagline: "AI that runs on your machine — no server required",
    tech: ["Next.js", "JavaScript", "ONNX Runtime Web", "Small Language Models (SLMs)"],
    description:
      "AI that runs on your browser using the latest ONNX Runtime Web technology for daily tools such as image background remover, object detection and much more — no server required. Flagship feature: summarize long PDF books and documents completely client-side using a 300 MB T5-Small Model downloaded and stored in the browser's IndexedDB.",
    liveUrl: "https://browser-ai-dun.vercel.app/",
    imageUrl: "/images/browser-ai.jpg",
    dateRange: "May 2026",
    category: "web",
  },
  {
    name: "Browser Tools for Everyday Files",
    tagline: "Free browser tools for everyday files",
    tech: ["Next.js", "JavaScript"],
    description:
      "Image compression, PDF compression, PDF merge and more tools fully client-side with 100% privacy.",
    dateRange: "May 2026",
    category: "web",
  },
  {
    name: "Curated Design Skills — Installed as Code",
    tagline: "Curated design skills installed as code",
    tech: ["shadcn", "npm", "Web Design"],
    description:
      "Entire websites, images, videos, illustrations and much more as shadcn-like packs to be downloaded — a new AI-native way with all code and information directly in the repo, consumed as part of a spec-driven instruction.",
    dateRange: "Apr 2026",
    category: "library",
  },
  {
    name: "My Blogging Website",
    tagline: "Aryan Batra's blog",
    tech: ["Next.js", "Technical Writing"],
    description:
      "My blogging website — writing about engineering, systems, and everything in between.",
    dateRange: "Apr 2026",
    category: "web",
  },
  {
    name: "StartX — AI Startup Validation Platform",
    tagline: "Validate your startup idea with AI",
    tech: ["Next.js", "Turso Cloud DB", "Groq AI", "Zai API", "Mistral AI", "Cerebras AI", "Instamojo", "Resend API", "Axiom Monitoring", "Pexels API", "Microsoft Clarity", "Mermaid.js", "React Flow", "GSAP", "Motion"],
    description:
      "A platform built on Turso DB, Groq API, Zai API, Mistral API, Cerebras API, Instamojo payment gateway, Resend API for email, Axiom monitoring, dynamic images using Pexels API, Microsoft Clarity integration, Mermaid.js, React Flow, GSAP, Motion and Next.js.",
    liveUrl: "https://startx-zeta.vercel.app/",
    imageUrl: "/images/startx.jpg",
    dateRange: "Apr 2026",
    category: "web",
  },
  {
    name: "Pixel Perfect Advanced UI Calendar",
    tagline: "My calendar — a pixel perfect advanced UI",
    tech: ["Tailwind CSS", "CSS"],
    description:
      "Built a pixel perfect advanced UI calendar.",
    dateRange: "Mar 2026",
    category: "web",
  },
  {
    name: "C Compiler",
    tagline: "Ultra simple C compiler for learning purposes",
    tech: ["CMake", "C (Programming Language)"],
    description:
      "Ultra simple C compiler for learning purposes with lexer, parser, and semantic analysis.",
    githubUrl: "https://github.com/aryanbatras/c-compiler",
    dateRange: "Mar 2026",
    category: "other",
  },
  {
    name: "Creative 3D Portfolio",
    tagline: "This very portfolio — a creative 3D experience",
    tech: ["Three.js", "React Three Fiber", "Next.js", "GSAP", "Motion"],
    description:
      "A creative 3D portfolio experience — the site you are inside right now, built with Three.js and React Three Fiber.",
    dateRange: "Feb 2026",
    category: "web",
  },
  {
    name: "Online Piano With Keyboard",
    tagline: "Play piano with your keyboard",
    tech: ["Next.js", "FFmpeg"],
    description:
      "Found piano sounds, highly compressed them using FFmpeg, and built piano keys that run with keyboard input with audio synchronization.",
    githubUrl: "https://github.com/aryanbatras/online-piano",
    liveUrl: "https://online-piano-two.vercel.app/",
    dateRange: "Feb 2026",
    category: "web",
  },
  {
    name: "Turbo C++ Graphics in Web Container",
    tagline: "Computer Graphics Lab — Turbo C++ online",
    tech: ["Next.js", "TypeScript", "Computer Graphics", "Webpack"],
    description:
      "A web-based Turbo C++ IDE that runs entirely in the browser using modern web technologies — bringing the classic DOS-based Turbo C++ compiler to modern devices without any installation requirements.",
    githubUrl: "https://github.com/aryanbatras/turboc-graphics",
    dateRange: "Feb 2026",
    category: "web",
  },
  {
    name: "JS Homepage — Interactive Coding Platform",
    tagline: "React JS Leetcode platform with 60+ challenges and AI assistance",
    tech: ["React.js", "JavaScript", "TypeScript", "SASS", "Monaco Editor", "Three.js", "React Three Fiber", "Cloudflare Workers", "React Hooks"],
    description:
      "A comprehensive interactive coding platform designed to help developers master JavaScript and React through hands-on practice — 60+ coding challenges across 20+ categories, AI-powered assistance, and real-time code editing.",
    githubUrl: "https://github.com/aryanbatras/js-homepage",
    liveUrl: "https://js-homepage.vercel.app",
    imageUrl: "/images/js-homepage.png",
    dateRange: "Jan 2026",
    category: "web",
  },
  {
    name: "Signal UI — Signal Layers",
    tagline: "A minimalist, intent-driven UI system where components are laws, not presets",
    tech: ["React.js", "Tailwind CSS", "Node.js", "Open-Source Software"],
    description:
      "A minimalist, intent-driven UI system where components are laws, not presets. You copy the code. You own it. You change it. Built on a revolutionary signal-based architecture where props are signals of intention, not configuration — separated into 4 explicit layers (Input, Dimensions, Data, State) and distributed via a custom CLI (npx signal-layers copy).",
    githubUrl: "https://github.com/aryanbatras/signal-ui",
    liveUrl: "https://aryanbatras.github.io/signal-ui/",
    imageUrl: "/images/signal-ui.png",
    dateRange: "Dec 2025",
    category: "library",
  },
  {
    name: "StudyFlow WebApp",
    tagline: "Study Stream alternative — 24x7 live study rooms",
    tech: ["Solid.js", "State Management", "YouTube API"],
    description:
      "A web app that lets you stream live YouTube study videos as study buddies, pin them, go live on YouTube and pin yourself alongside them — a perfect open source clone of StudyStream, built in Solid JS.",
    githubUrl: "https://github.com/aryanbatras/study-stream-youtube",
    liveUrl: "https://aryanbatras.github.io/study-stream-youtube/",
    imageUrl: "/images/study-stream.png",
    dateRange: "Nov 2025",
    category: "web",
  },
  {
    name: "DSA-IN-3D — Ray Tracing Engine",
    tagline: "3D data structure visualizer in Java",
    tech: ["Java", "Ray Tracing", "Concurrent Programming", "Data Structures", "Algorithms", "Java Swing"],
    description:
      "A full-fledged 3D data structure visualizer built from scratch in Java — ray tracing, realistic rendering, camera animations, interactive and video modes, and an intuitive .with() API inspired by the Java Collections framework. Engineered from a multithreaded 3D ray tracing engine (>5,000 LOC, zero third-party engines) with photon light bouncing physics and spatial controls.",
    githubUrl: "https://github.com/aryanbatras/DSA-IN-3D",
    imageUrl: "/images/dsa-in-3d.jpg",
    dateRange: "Jul 2024 — Aug 2024",
    category: "desktop",
  },
  {
    name: "Java 3D Ray Tracing Engine",
    tagline: "3D interactive ray tracing engine built from scratch in Java",
    tech: ["Java", "Ray Tracing", "Concurrent Programming"],
    description:
      "A 3D interactive ray tracing engine built entirely from scratch in Java. It simulates the physics of light using pure ray tracing principles in a self-built 3D environment — realistic rendering, user interaction, procedural scenes, object dragging, and multithreaded performance in a single, powerful, extensible codebase.",
    githubUrl: "https://github.com/aryanbatras/JavaReflect-3D-Engine",
    imageUrl: "/images/java-3d-engine.jpg",
    dateRange: "Jun 2024 — Jul 2024",
    category: "desktop",
  },
];

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

export interface Note {
  title: string;
  date: string;
  body: string;
}

export const NOTES: Note[] = [
  {
    title: "Why this desktop exists",
    date: "Today",
    body: "Every portfolio shows a timeline. I wanted to show a workspace — the machine where the work actually happens. Every icon on this desktop opens a real file: my resume, my projects, photos and videos straight from the showreel.",
  },
  {
    title: "On smooth scroll video",
    date: "Yesterday",
    body: "The trick is keyframes: encode the whole film as ONE file where every single frame is a keyframe (an all-intra encode). Scrubbing then decodes exactly one frame per seek — instant, frame-accurate, no buffering and no flicker. The chapters (and the black break between the two acts) are stitched into that one file, so the transitions are seamless by construction.",
  },
  {
    title: "Design rules I keep",
    date: "Last week",
    body: "1. One accent colour max. 2. Motion explains hierarchy. 3. Black and white first, colour only when it earns its place. 4. Every animation must answer to the scroll, not the clock.",
  },
  {
    title: "Reading list",
    date: "Last month",
    body: "Designing Data-Intensive Applications — Kleppmann. The Mythical Man-Month — Brooks. Creative Selection — Kocienda. Refactoring UI — Wathan & Schoger.",
  },
];

/* ------------------------------------------------------------------ */
/* Read Me (TextEdit file)                                             */
/* ------------------------------------------------------------------ */

export const README_TEXT = `ARYAN BATRA — PORTFOLIO OS
==========================

Welcome to my desktop. This is a fully interactive take on my
portfolio, built as a macOS-style operating system.

WHAT'S HERE
-----------
  · Finder        — the file browser; every file on this machine is real.
                    Drop a .zip or .iso on the desktop and double-click to
                    browse inside it (read-only) or Extract Here to a folder,
                    and extract 7z / tar / gz / xz / bz2 / rar archives too
                    (7-Zip compiled to WASM, running locally); select files
                    and right-click → Add to Archive to pack a .zip, drag
                    files to arrange them (or onto a folder to move them
                    in), and sort by name/kind/size/date in either direction
                    — your sort + arrangement are remembered per folder
  · About Me      — who I am and what I care about
  · Resume        — experience, education, skills
  · Projects      — a few things I've shipped
  · Notes         — things I think about
  · Photos        — frames pulled straight from the showreel
  · Videos        — the full scroll-scrubbed showreel, with sound
  · Maps          — where I work, think and wander
  · TextEdit      — a real code editor: syntax highlighting, line numbers
                    and ⌘S saving (try notes.md and its Preview mode)
  · Safari        — the machine's browser, opens Google right away:
                    Google search works (basic-HTML mode), real favicons,
                    back/forward history dropdowns (right-click or the
                    caret), and a proxy menu — AllOrigins, Wayback Machine,
                    and Old Net (1996–2012) that opens sites which refuse
                    iframes
  · Emulator      — a console emulator right in the browser: drop an NES,
                    SNES, Game Boy, GBA, N64 or Sega ROM and it plays with
                    the right core picked automatically
  · Ruffle        — Flash Player in the browser: drop any .swf (game or
                    animation) and it runs
  · DOS           — js-dos DOSBox: drop a .jsdos bundle, .exe or .zip DOS
                    game and play it — save states and all
  · Winamp        — the real Winamp (Webamp) in the browser: drop an .mp3
                    on the desktop or open one in Finder, play URLs and .m3u
                    playlists, save your playlist, even load .wsz skins
  · VLC           — a proper dark VLC-style media player: the showreel films
                    with custom controls, and any .mp4/.mov/.webm opened from
                    Finder
  · Vim           — the real vim.js (the actual Vim, compiled for the
                    browser): open any text file from Finder and edit it with
                    real vim keys; :w saves straight back to the file system
  · Monaco        — the real VS Code editor (Monaco) right in the browser:
                    code files (.ts/.tsx/.js/.json/.py/…) open here from
                    Finder with full syntax highlighting, IntelliSense and
                    ⌘S saving — the runtime is served locally, fully offline
  · DevTools      — eruda, a real developer console: Console, Elements,
                    Network, Resources and Sources panels for the machine
                    itself (⌥⌘I or the Apple menu)
  · OpenType      — font viewer: drop an .otf/.ttf/.woff font and inspect
                    it — name, version, outline type — with a specimen at
                    every point size drawn from the font's own vector paths
  · TinyMCE       — the real WYSIWYG rich-text editor: open any .rtf or
                    .whtml document from Finder and edit it visually — bold,
                    headings, links, images — ⌘S saves back to the file system
  · IRC           — KiwiIRC, a real IRC chat client: connects over WebSockets
                    to Libera.Chat, ErgoTestnet and InspIRCd's testnet
  · BoxedWine     — a real Windows-in-the-browser emulator: drop an .exe or
                    .zip Windows program and it runs (Wine 1.7.55 served
                    locally, ~60MB)
  · Virtual x86   — a full x86 PC emulator: drop an .img disk image or .iso
                    CD and it boots in a real virtual machine (V86)
  · Messenger     — encrypted direct messaging over Nostr (NIP-04, the
                    daedalOS protocol): your keypair is generated locally,
                    messages are end-to-end encrypted, and it connects to
                    the same public relay pool
  · Games         — mini arcade: 2048, Memory, Heap Worm, Binary Pong,
                    Breakout, Offline Dino, Chess (REAL Stockfish engine,
                    skill 0-20, play as White or Black, and opening a .pgn
                    file from Finder reviews it move-by-move), Minesweeper,
                    Tetris and a real Online Piano — plus the full WASM
                    games ported from daedalOS (Space Cadet Pinball, Quake
                    III Arena)                    and my live projects to play — plus TIC-80 (the fantasy
                    computer: a .tic cart dropped in Finder boots straight
                    into it), ClassiCube (a Minecraft Classic-compatible
                    client with a singleplayer world) and DX-Ball (the
                    classic break-out block breaker, ported from daedalOS)
  · Terminal      — type 'help' and see what happens (weather is live,
                    pipes work, \`open <app>\` and \`edit <file>\` launch apps,
                    and \`python <code>\` runs a REAL CPython 3 interpreter —
                    Pyodide, served locally, fully offline)
  · The desktop responds to URLs, just like daedalOS: /?app=notes opens an
                    app, /?url=https://github.com opens the Browser at a
                    site, and /?app=browser&url=… launches the Browser with
                    a page loaded

TIPS
----
  · ⌘K or ⌘Space  — Spotlight search
  · F3 or ⌃↑      — Mission Control
  · F4            — Launchpad (drag apps to rearrange, drop one on another
                    to make a folder, long-press an icon to edit — wiggle +
                    × to remove, double-click a folder name to rename,
                    drag apps to the bottom strip to pull them out of a
                    folder)
  · ⌃⌘Q           — Lock the screen
  · Apple menu → Restart… / Log Out… — the daedalOS Power menu: clears your
                    session (files, settings, everything) and starts fresh
  · Two-finger pinch — Launchpad (Settings → Trackpad & Mouse, replaces
                    the browser's zoom)
  · Two-finger swipe up over the wallpaper — Mission Control
  · Right-click the desktop — Clean Up / Sort By (icons snap to a grid
                    and never overlap; drag an icon and it snaps into place),
                    Capture Screen… to record a video of the machine
                    (saved to Documents), and Spawn a Sheep — the classic
                    eSheep desktop pet wanders your desktop (or run
                    \`esheep\` in the Run dialog / Terminal)
  · Hover a running app's Dock icon — a live peek preview of its windows
                    appears above the shelf (daedalOS's taskbar peek)
  · Settings → Wallpaper → Menu Bar Clock — NTP Time syncs the clock to a
                    network time server (daedalOS ntp.js); hover the clock for
                    the full date, and click it for Notification Center
  · Esc           — close the machine (or dismiss the topmost surface)
  · ⌃⌘Space       — Emoji & Symbols
  · ⌃⌘F           — Enter / exit full screen
  · ⌘\`           — Cycle windows of the frontmost app
  · Space         — Quick Look (select a file in Finder)
  · F11 / F12     — Volume down / up (with on-screen display)
  · F1 / F2       — Brightness down / up (with on-screen display)
  · Green ▸ button — tiling menu (Fill, Tile Left/Right, Full Screen)
  · ⌘Tab (via Control Center) — app switcher
  · ⌘,            — System Settings
  · Right-click anything — menus everywhere
  · Right-click a Finder folder — New Folder / New Text Document
  · Drag files from your computer onto the desktop — images go to Photos,
    .txt / .md documents go to Documents
  · Settings → Wallpaper — rotate the macOS Tahoe wallpapers (Liquid Glass,
    Tahoe Dark/Light and the Tahoe Beach dynamic series) with the slideshow
  · Settings → Desktop & Dock — Screen Saver: try Flurry, Aerial, Clock,
    Matrix or Pipes
  · Finder — right-click for New Folder / New Text Document / Open Terminal
    Here; ⌘C / ⌘X / ⌘V to copy, cut and paste files; ⌘I for Get Info; F2 to
    rename; Pictures folder → Set as Wallpaper
  · Windows remember their position and size between sessions
  · Drag a window to the left/right edge — macOS-style tiling preview
  · Drag a window to the very top — it zooms to full screen
  · Open the machine with an app pre-loaded: /?app=notes or /?app=games

HOW IT'S BUILT
--------------
  · Next.js (pages router) — same architecture as the rest of the site
  · GSAP ScrollTrigger    — pins + scrubs the video section
  · FFmpeg                — stitches the films into one all-intra
                            (every-frame-keyframe) file, so scroll-scrubbing
                            decodes exactly one frame per seek — no
                            buffering, no flicker, seamless chapters
  · CSS Modules           — every window, icon and menu hand-rolled

TIPS
----
  · Double-click desktop icons to open files
  · Drag windows by their title bar — they're fully movable
  · Use the traffic lights to close, minimise or zoom a window
  · Hover the dock — it magnifies

Enjoy the machine.
— Aryan
`;

/* ------------------------------------------------------------------ */
/* Terminal commands                                                   */
/* ------------------------------------------------------------------ */

export interface TerminalCommand {
  name: string;
  help: string;
  /** Real system info read from the browser — passed in so `uname` and
   *  `neofetch` report the visitor's actual hardware, not a scripted one. */
  run: (raw: string, sys: {
    platform: string;
    platformVersion: string | null;
    cpuCores: number | null;
    memoryGB: number | null;
    gpu: string | null;
    online: boolean;
    network: { effectiveType: string; downlink: number; rtt: number } | null;
    screen: { width: number; height: number };
  }) => string;
}

export const TERMINAL_COMMANDS: TerminalCommand[] = [
  {
    name: "help",
    help: "List available commands",
    run: () =>
      Object.keys(TERMINAL_HELP)
        .map((k) => `${k.padEnd(12)} ${TERMINAL_HELP[k]}`)
        .join("\n"),
  },
  {
    name: "whoami",
    help: "Who is using this machine",
    run: () => "aryan — software engineer, full-stack developer, 3D enthusiast.",
  },
  {
    name: "skills",
    help: "Show tech stack",
    run: () => RESUME.skills.join("  ·  "),
  },
  {
    name: "projects",
    help: "List notable projects",
    run: () => PROJECTS.map((p) => `· ${p.name} — ${p.tagline}`).join("\n"),
  },
  {
    name: "resume",
    help: "Print a summary of experience",
    run: () =>
      RESUME.experience
        .map((e) => `${e.role} @ ${e.company} (${e.period})`)
        .join("\n"),
  },
  {
    name: "contact",
    help: "How to reach me",
    run: () => RESUME.contact,
  },
  {
    name: "clear",
    help: "Clear the terminal",
    run: () => "__CLEAR__",
  },
  {
    name: "ls",
    help: "List files in the current directory",
    run: () =>
      "Resume.pdf   showreel.mp4   README.txt   Projects/   Notes/   Photos/   Maps/",
  },
  {
    name: "cat",
    help: "Print a file — e.g. cat README.txt",
    run: (raw: string) => {
      const file = raw.split(/\s+/)[1];
      if (!file) return "usage: cat <file>";
      if (file === "README.txt")
        return (
          README_TEXT.split("\n").slice(0, 14).join("\n") +
          "\n… (full file in the Read Me app)"
        );
      if (file === "Resume.pdf")
        return "Resume.pdf is a binary document — open the Resume app to view it.";
      return `cat: ${file}: No such file or directory`;
    },
  },
  {
    name: "pwd",
    help: "Print working directory",
    run: () => "/Users/aryan",
  },
  {
    name: "date",
    help: "Show the current date and time",
    run: () => new Date().toString(),
  },
  {
    name: "echo",
    help: "Echo text back — e.g. echo hello",
    run: (raw: string) => raw.split(/\s+/).slice(1).join(" "),
  },
  {
    name: "python",
    help: "Run code through a real Python 3 interpreter (Pyodide) — e.g. python 2+2",
    run: () => "python: booting…",
  },
  {
    name: "uname",
    help: "Show real system information",
    run: (_raw, sys) =>
      `AryanOS 2027 — running on ${sys.platform}${
        sys.platformVersion ? ` ${sys.platformVersion}` : ""
      }${sys.cpuCores != null ? ` · ${sys.cpuCores} cores` : ""}`,
  },
  {
    name: "neofetch",
    help: "Real system info with a touch of ASCII art",
    run: (_raw, sys) =>
      [
        "            AryanOS 2027",
        "            --------------",
        `            Platform: ${sys.platform}${sys.platformVersion ? ` ${sys.platformVersion}` : ""}`,
        "            Shell: zsh 5.9",
        `            Resolution: ${sys.screen.width}x${sys.screen.height}`,
        "            DE: AryanOS (Liquid Glass)",
        `            CPU: ${sys.cpuCores != null ? `${sys.cpuCores} logical cores` : "not reported"}`,
        `            GPU: ${sys.gpu ?? "not reported"}`,
        `            Memory: ${sys.memoryGB != null ? `${sys.memoryGB} GB` : "not reported"}`,
        `            Network: ${sys.online ? "online" : "offline"}${sys.network?.downlink ? ` @ ${sys.network.downlink} Mbps` : ""}`,
      ].join("\n"),
  },
  {
    name: "say",
    help: "Speak text aloud — e.g. say hello there",
    run: (raw: string) => {
      const text = raw.split(/\s+/).slice(1).join(" ");
      if (!text) return "usage: say <text>";
      try {
        window.speechSynthesis?.cancel();
        window.speechSynthesis?.speak(new SpeechSynthesisUtterance(text));
        return `Speaking: “${text}”`;
      } catch {
        return "say: speech synthesis unavailable";
      }
    },
  },
  {
    name: "weather",
    help: "Live conditions for Jammu (open-meteo)",
    run: () => "weather: fetching live conditions…",
  },
  {
    name: "open",
    help: "Open an app — e.g. open textedit",
    run: () => "usage: open <app> — try: finder, textedit, notes, photos, maps, games, settings",
  },
  {
    name: "edit",
    help: "Open a file in TextEdit — e.g. edit notes.md",
    run: () => "usage: edit <file>",
  },
  {
    name: "matrix",
    help: "Raining code, just for fun",
    run: () => "matrix: the simulation is watching.",
  },
  {
    name: "sudo",
    help: "Try it. You are not root here.",
    run: () => "sudo: command not found — you are not root here.",
  },
  {
    name: "banner",
    help: "Print a boxed banner — e.g. banner hello",
    run: (raw: string) => {
      const text = raw.split(/\s+/).slice(1).join(" ");
      return text ? `banner: ${text}` : "usage: banner <text>";
    },
  },
  {
    name: "pipe",
    help: "Chain commands with | — e.g. ls | grep txt",
    run: () => "pipes: try `projects | grep AI` or `help | head -5`",
  },
  /* ---- Node.js / JavaScript ---- */
  {
    name: "node",
    help: "Run JavaScript — e.g. node 2+2, node console.log('hi')",
    run: (raw: string) => {
      const code = raw.split(/\s+/).slice(1).join(" ");
      if (!code) return "usage: node <javascript code>";
      try {
        const result = new Function(`return (${code})`)();
        return result === undefined ? "undefined" : String(result);
      } catch (e) {
        return `node: ${(e as Error).message}`;
      }
    },
  },
  {
    name: "js",
    help: "Alias for node — run JavaScript code",
    run: (raw: string) => {
      const code = raw.split(/\s+/).slice(1).join(" ");
      if (!code) return "usage: js <javascript code>";
      try {
        const result = new Function(`return (${code})`)();
        return result === undefined ? "undefined" : String(result);
      } catch (e) {
        return `js: ${(e as Error).message}`;
      }
    },
  },
  /* ---- Package managers ---- */
  {
    name: "pip",
    help: "Install Python packages via micropip — e.g. pip install numpy",
    run: () => "pip: handled by the shell (use pip install <package>)",
  },
  {
    name: "npm",
    help: "Stub — npm packages run in the browser via CDN, not installable here",
    run: () => "npm: browser-based JS uses CDN imports (import('https://...')), not npm install",
  },
  /* ---- File system ---- */
  {
    name: "mkdir",
    help: "Create a directory — e.g. mkdir projects",
    run: () => "mkdir: created (virtual filesystem — files persist in browser storage)",
  },
  {
    name: "touch",
    help: "Create a file — e.g. touch notes.md",
    run: () => "touch: created (use 'edit' to open in TextEdit)",
  },
  {
    name: "rm",
    help: "Remove a file — e.g. rm old-notes.txt",
    run: () => "rm: removed (use Finder for full file management)",
  },
  {
    name: "mv",
    help: "Move/rename a file — e.g. mv old.txt new.txt",
    run: () => "mv: use Finder to drag-and-drop or right-click rename",
  },
  {
    name: "cp",
    help: "Copy a file — e.g. cp file.txt backup.txt",
    run: () => "cp: use Finder to drag-and-drop or ⌘C / ⌘V",
  },
  {
    name: "cd",
    help: "Change directory (visual) — e.g. cd Projects",
    run: (raw: string) => {
      const dir = raw.split(/\s+/)[1];
      if (!dir || dir === "~") return "/Users/aryan";
      return `/Users/aryan/${dir}`;
    },
  },
  /* ---- Git (stubs) ---- */
  {
    name: "git",
    help: "Git commands (stubs) — e.g. git status, git log",
    run: (raw: string) => {
      const sub = raw.split(/\s+/)[1];
      if (sub === "status") return "On branch main. Working tree clean.";
      if (sub === "log") return "a1b2c3d Latest commit — Aryan Batra";
      if (sub === "branch") return "* main";
      if (sub === "clone") return "git clone: requires a real git server (use GitHub links in Finder)";
      return "git: status, log, branch, clone (stubs — this is a browser, not a real git)";
    },
  },
  {
    name: "curl",
    help: "Fetch a URL — e.g. curl https://api.github.com/users/aryanbatras",
    run: (raw: string) => "curl: handled by the shell (async) — use 'fetch <url>' instead",
  },
  {
    name: "fetch",
    help: "Fetch a URL and print the response — e.g. fetch https://api.github.com/users/aryanbatras",
    run: () => "fetch: handled by the shell (async)",
  },
  {
    name: "history",
    help: "Show command history",
    run: () => "history: type ↑ and ↓ to navigate command history",
  },
  {
    name: "export",
    help: "Set an environment variable — e.g. export EDITOR=monaco",
    run: () => "export: environment variables are session-only (browser limitation)",
  },
  {
    name: "which",
    help: "Locate a command — e.g. which python",
    run: (raw: string) => {
      const cmd = raw.split(/\s+/)[1];
      if (!cmd) return "usage: which <command>";
      const found = TERMINAL_COMMANDS.find((c) => c.name === cmd);
      return found ? `/usr/bin/${cmd}` : `which: no ${cmd} in (/usr/bin /bin /usr/local/bin)`;
    },
  },
  {
    name: "man",
    help: "Manual page — e.g. man python",
    run: (raw: string) => {
      const cmd = raw.split(/\s+/)[1];
      if (!cmd) return "usage: man <command>";
      const found = TERMINAL_COMMANDS.find((c) => c.name === cmd);
      if (!found) return `No manual entry for ${cmd}`;
      return `${cmd.toUpperCase().slice(0,1)}${cmd.slice(1)}(1)\n\nNAME\n    ${cmd} — ${found.help}\n\nSYNOPSIS\n    ${cmd} [options]\n\nDESCRIPTION\n    ${found.help}`;
    },
  },
  {
    name: "env",
    help: "Print environment variables",
    run: () => [
      "SHELL=/bin/zsh",
      "EDITOR=monaco",
      "TERM=xterm-256color",
      "LANG=en_US.UTF-8",
      "ARYAN_OS=2027",
      `PWD=/Users/aryan`,
    ].join("\n"),
  },
  {
    name: "top",
    help: "Show running processes",
    run: () => [
      "PID   CPU%  MEM%  COMMAND",
      "1     0.0   0.1   AryanOS Kernel",
      "42    12.3  45.2  TerminalApp",
      "69    8.7   22.1  MonacoEditor",
      "100   3.1   11.4  FinderApp",
      "128   0.5   2.3   LiquidGlass",
    ].join("\n"),
  },
  {
    name: "df",
    help: "Show disk usage",
    run: () => [
      "Filesystem     Size    Used   Avail  Use%  Mounted on",
      "/dev/vda1      256GB   4.2GB  252GB   2%   /",
      "tmpfs           16GB   128MB   16GB   1%   /tmp",
    ].join("\n"),
  },
  {
    name: "uptime",
    help: "Show system uptime",
    run: () => {
      const up = Math.floor((Date.now() - performance.timeOrigin) / 1000);
      const h = Math.floor(up / 3600);
      const m = Math.floor((up % 3600) / 60);
      return ` ${new Date().toLocaleTimeString()}  up ${h}:${String(m).padStart(2, "0")},  1 user,  load averages: 1.23 0.89 0.45`;
    },
  },
  {
    name: "wc",
    help: "Word count — e.g. echo hello | wc",
    run: () => "wc: pipe it — e.g. echo 'hello world' | wc",
  },
  {
    name: "head",
    help: "First N lines — e.g. head -5 of output",
    run: () => "head: pipe it — e.g. projects | head -5",
  },
  {
    name: "tail",
    help: "Last N lines — e.g. tail -5 of output",
    run: () => "tail: pipe it — e.g. projects | tail -5",
  },
];

const TERMINAL_HELP: Record<string, string> = Object.fromEntries(
  TERMINAL_COMMANDS.map((c) => [c.name, c.help]),
);
