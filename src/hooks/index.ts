/**
 * Hooks — barrel export.
 *
 * Active hooks (used by the desktop OS):
 *   import { useWindowManager, useWallpaperTint } from "@/hooks";
 *
 * Legacy hooks (only used by /legacy or /3d):
 *   import { useScrubVideo } from "@/hooks/useScrubVideo";
 */

// Desktop OS hooks
export { useWindowManager, setSpaceContext } from "./useWindowManager";
export { default as useWallpaperTint } from "./useWallpaperTint";
export { default as useLiveWeather } from "./useLiveWeather";
export { default as useSystemInfo } from "./useSystemInfo";
export { useIsMobile, useIsTouchDevice } from "./useIsMobile";

// Legacy hooks (import directly for /legacy or /3d)
// export { useScrubVideo } from "./useScrubVideo";
// export { default as useScreenWidth } from "./useScreenWidth";
