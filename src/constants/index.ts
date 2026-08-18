/**
 * Constants — barrel export.
 *
 * Import from here:
 *   import { DESKTOP_APPS, WALLPAPERS, RESUME, PROJECTS } from "@/constants";
 */

export {
  DESKTOP_APPS,
  WALLPAPERS,
  DEFAULT_SPACES,
  DEFAULT_WIDGETS,
  DEFAULT_HOT_CORNERS,
  CONTROL_TILE_IDS,
  WIDGET_IDS,
  ACCENT_COLORS,
  FOLDER_COLORS,
  FOLDER_COLOR_FILL,
  SPOTLIGHT_ITEMS,
  APP_ICON,
  WEB_SHORTCUTS,
  RESUME,
  PROJECTS,
  NOTES,
  README_TEXT,
} from "./desktop";

export type {
  DesktopAppConfig,
  SystemState,
  DockPosition,
  MinimizeEffect,
  ClockStyle,
  WidgetStyle,
  AccentColorId,
  SpaceConfig,
  HotCornerAction,
  CornerId,
  NotifStyle,
  NotifPref,
  ControlTileId,
  WidgetId,
  FolderColor,
  DesktopFolder,
  LaunchpadItem,
  LaunchpadFolder,
  Wallpaper,
  SpotlightItem,
  WebShortcut,
  Project,
  Note,
} from "./desktop";

export {
  SCRUB_VIDEO_A,
  SCRUB_POSTER_A,
  ACT1_DURATIONS,
  ACT1_DURATION,
  SCRUB_FRAME_RATE,
  ORIGINAL_VIDEOS,
  PHOTOS,
} from "./video";

// 3D Scene constants
export const MODEL_PATH = "/aryan/models/tripo_animated_frog.glb";

export const RESPONSIVE_POSITIONS = {
  mobile: { baseX: 0, baseY: 0, baseZ: 0, rotY: 0, rotZ: 0, finalRotY: 0, scaleMultiplier: 0.6 },
  tablet: { baseX: 0, baseY: 0, baseZ: 0, rotY: 0, rotZ: 0, finalRotY: 0, scaleMultiplier: 0.8 },
  desktop: { baseX: 0, baseY: 0, baseZ: 0, rotY: 0, rotZ: 0, finalRotY: 0, scaleMultiplier: 1.0 },
};

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

export const TECH_ICONS = [
  { name: "React", symbol: "⚛", color: "#61DAFB", bgColor: "#0d1117" },
  { name: "TypeScript", symbol: "TS", color: "#3178C6", bgColor: "#0d1117" },
  { name: "Next.js", symbol: "N", color: "#FFFFFF", bgColor: "#000000" },
  { name: "Node.js", symbol: "N", color: "#339933", bgColor: "#0d1117" },
  { name: "Python", symbol: "Py", color: "#3776AB", bgColor: "#0d1117" },
  { name: "Rust", symbol: "Rs", color: "#CE422B", bgColor: "#0d1117" },
  { name: "Go", symbol: "Go", color: "#00ADD8", bgColor: "#0d1117" },
  { name: "Docker", symbol: "🐳", color: "#2496ED", bgColor: "#0d1117" },
];

export const COLOR_PRESETS = {
  blue: "#3b82f6",
  green: "#10b981",
  purple: "#8b5cf6",
  orange: "#f97316",
  pink: "#ec4899",
  cyan: "#06b6d4",
};

export const ANIMATION_DEFAULTS = {
  orbitSpeed: 0.5,
  glowIntensity: 0.5,
};
