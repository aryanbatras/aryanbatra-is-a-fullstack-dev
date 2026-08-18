/**
 * Context providers — barrel export.
 *
 *   import { ThemeProvider, useTheme } from "@/context";
 */

export { ThemeProvider, useTheme } from "./ThemeContext";
export { PanelProvider, usePanelVisible } from "./PanelContext";
// Legacy — only used by scroll-scrub video flow
// export { ScrollSmootherProvider, useScrollSmootherReady } from "./ScrollSmootherContext";
