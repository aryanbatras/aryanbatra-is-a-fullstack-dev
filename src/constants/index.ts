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
