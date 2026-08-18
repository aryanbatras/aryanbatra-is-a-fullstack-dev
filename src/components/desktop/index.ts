/**
 * Desktop OS — barrel export.
 *
 * Import desktop components from here instead of deep-paths:
 *   import { Window, Dock, LockScreen } from "@/components/desktop";
 *
 * Apps are imported individually from ./apps/ since there are 40+ and
 * most are only used by MacDesktop's dynamic app-view map.
 */

// Core shell
export { default as Window } from "./Window";
export { default as Dock } from "./Dock";
export { default as MenuBar } from "./MenuBar";
export { default as LockScreen } from "./LockScreen";

// Navigation & overlays
export { default as Spotlight } from "./Spotlight";
export { default as Launchpad } from "./Launchpad";
export { default as MissionControl } from "./MissionControl";
export { default as AppSwitcher } from "./AppSwitcher";
export { default as NotificationCenter } from "./NotificationCenter";
export { default as AboutThisMac } from "./AboutThisMac";
export { default as RunDialog } from "./RunDialog";
export { default as AlertDialog } from "./AlertDialog";
export { default as QuickLook } from "./QuickLook";
export { default as EmojiPicker } from "./EmojiPicker";
export { default as Screensaver } from "./Screensaver";

// Visual system
export { default as LiquidGlass } from "./LiquidGlass";
export { default as Glyph } from "./Glyph";
export { default as AppIcon } from "./AppIcon";
export { default as FolderIcon } from "./FolderIcon";

// Widgets & layout
export { default as WidgetStack } from "./WidgetStack";
export { default as StageStrip } from "./StageStrip";
export { default as MarkdownPreview } from "./MarkdownPreview";
