import { useCallback, useRef, useState } from "react";
import { APP_ICON, DESKTOP_APPS } from "@/constants/desktop";

export interface DesktopWindow {
  id: string;
  appId: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  maximized: boolean;
  z: number;
  /** macOS Space this window lives in (windows follow their space). */
  spaceId: number;
}

export type TilePlacement = "left" | "right" | "top";

/** Space that newly opened windows land in — set on space switch. */
let spaceContext = 1;

export function setSpaceContext(id: number) {
  spaceContext = id;
}

function defaultSize(appId: string) {
  const app = DESKTOP_APPS.find((a) => a.id === appId);
  return {
    w: app?.width ?? 600,
    h: app?.height ?? 460,
    minW: app?.minWidth ?? 440,
    minH: app?.minHeight ?? 340,
  };
}

export function useWindowManager() {
  const [windows, setWindows] = useState<DesktopWindow[]>([]);
  const zCounter = useRef(10);
  const openCount = useRef(0);
  const idSeq = useRef(0);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const bringToFront = useCallback((id: string) => {
    zCounter.current += 1;
    const z = zCounter.current;
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, z } : w)));
    setFocusedId(id);
  }, []);

  const openWindow = useCallback(
    (appId: string, opts?: { title?: string; multi?: boolean }) => {
      const existing = windows.find((w) => w.appId === appId);
      if (existing && !opts?.multi) {
        bringToFront(existing.id);
        setWindows((ws) =>
          ws.map((w) => (w.id === existing.id ? { ...w, minimized: false } : w)),
        );
        return existing.id;
      }

      const { w: deskW, h: deskH } = defaultSize(appId);
      const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      // Fit the window to the viewport (on phones: clamp and centre it).
      const w = Math.min(deskW, vw - 20);
      const h = Math.min(deskH, vh - 150);
      const narrow = vw < 640;
      const count = openCount.current % 7;
      openCount.current += 1;
      idSeq.current += 1;
      const id = `${appId}-${Date.now()}-${idSeq.current}`;
      const x = narrow ? Math.max(8, (vw - w) / 2) : Math.max(24, 64 + count * 34);
      const y = narrow ? Math.max(46, (vh - h) / 2) : Math.max(24, 48 + count * 30);
      zCounter.current += 1;
      setWindows((ws) => [
        ...ws,
        {
          id,
          appId,
          title: opts?.title ?? DESKTOP_APPS.find((a) => a.id === appId)?.title ?? appId,
          icon: APP_ICON[appId] ?? "•",
          x,
          y,
          w,
          h,
          minimized: false,
          maximized: false,
          z: zCounter.current,
          spaceId: spaceContext,
        },
      ]);
      setFocusedId(id);
      return id;
    },
    [windows, bringToFront],
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((ws) => ws.filter((w) => w.id !== id));
    setFocusedId((f) => (f === id ? null : f));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((ws) =>
      ws.map((w) =>
        w.id === id
          ? { ...w, maximized: !w.maximized, minimized: false }
          : w,
      ),
    );
    bringToFront(id);
  }, [bringToFront]);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const resizeWindow = useCallback((id: string, w: number, h: number) => {
    const { minW, minH } = defaultSize(
      windows.find((win) => win.id === id)?.appId ?? "about",
    );
    setWindows((ws) =>
      ws.map((win) =>
        win.id === id
          ? { ...win, w: Math.max(minW, w), h: Math.max(minH, h) }
          : win,
      ),
    );
  }, [windows]);

  const restoreWindow = useCallback((id: string) => {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: false } : w)));
    bringToFront(id);
  }, [bringToFront]);

  /** macOS 15+ edge tiling: drag to the left/right edge for half-screen, to the top for fullscreen. */
  const tileWindow = useCallback(
    (id: string, placement: TilePlacement) => {
      const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      const menuH = 40;
      const gap = 6;
      let x = gap;
      let y = menuH + gap;
      let w = vw - gap * 2;
      let h = vh - menuH - gap * 2;
      let maximized = false;
      if (placement === "left") {
        w = vw / 2 - gap * 1.5;
        h = vh - menuH - gap * 2;
      } else if (placement === "right") {
        x = vw / 2 + gap * 0.5;
        w = vw / 2 - gap * 1.5;
        h = vh - menuH - gap * 2;
      } else {
        maximized = true;
      }
      setWindows((ws) =>
        ws.map((win) =>
          win.id === id
            ? { ...win, x, y, w, h, maximized, minimized: false }
            : win,
        ),
      );
      bringToFront(id);
    },
    [bringToFront],
  );

  const runningApps = windows
    .filter((w) => !w.minimized)
    .map((w) => w.appId)
    .filter((v, i, a) => a.indexOf(v) === i);

  const minimizedApps = windows
    .filter((w) => w.minimized)
    .map((w) => w.appId)
    .filter((v, i, a) => a.indexOf(v) === i);

  return {
    windows,
    focusedId,
    runningApps,
    minimizedApps,
    openWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximize,
    bringToFront,
    moveWindow,
    resizeWindow,
    restoreWindow,
    tileWindow,
  };
}
