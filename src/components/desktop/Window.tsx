import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { DESKTOP_APPS, type MinimizeEffect } from "@/constants/desktop";
import type { DesktopWindow, TilePlacement } from "@/hooks/useWindowManager";
import AppIcon from "@/components/desktop/AppIcon";
import styles from "@/styles/components/desktop/Window.module.css";

interface WindowProps {
  win: DesktopWindow;
  focused: boolean;
  /** True while the close animation plays (window is about to unmount). */
  closing?: boolean;
  /** True while the minimize-to-dock animation plays. */
  minimizing?: boolean;
  /** Genie (fly to dock) or Scale (shrink-fade) — Settings → Desktop & Dock. */
  minimizeEffect?: MinimizeEffect;
  children: ReactNode;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  onTile: (id: string, placement: TilePlacement) => void;
}

export default function Window({
  win,
  focused,
  closing = false,
  minimizing = false,
  minimizeEffect = "genie",
  children,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  onResize,
  onTile,
}: WindowProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [tileHint, setTileHint] = useState<TilePlacement | null>(null);
  const [zoomMenu, setZoomMenu] = useState<{ x: number; y: number } | null>(null);

  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    onFocus(win.id);

    // Start position: restore a maximized window and have it follow the cursor.
    let x = win.x;
    let y = win.y;
    if (win.maximized) {
      x = e.clientX - win.w / 2;
      y = e.clientY - 16;
      onMaximize(win.id); // un-maximize
      onMove(win.id, x, y);
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = x;
    const origY = y;
    let lastX = x;
    let lastY = y;
    let done = false;

    // macOS 15+ edge tiling: dragging to an edge shows a preview, applied on release.
    const hintAt = (ev: PointerEvent): TilePlacement | null => {
      const edge = 14;
      if (ev.clientY <= edge) return "top";
      if (ev.clientX <= edge) return "left";
      if (ev.clientX >= window.innerWidth - edge) return "right";
      return null;
    };

    const cleanup = () => {
      done = true;
      setTileHint(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    const move = (ev: PointerEvent) => {
      if (done) return;
      const nx = origX + ev.clientX - startX;
      const ny = origY + ev.clientY - startY;
      lastX = nx;
      lastY = ny;
      onMove(win.id, nx, ny);
      setTileHint(hintAt(ev));
    };
    const up = (ev: PointerEvent) => {
      const hint = hintAt(ev);
      cleanup();
      if (hint) onTile(win.id, hint);
      else onMove(win.id, lastX, lastY);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus(win.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = win.w;
    const origH = win.h;

    const move = (ev: PointerEvent) => {
      onResize(win.id, origW + (ev.clientX - startX), origH + (ev.clientY - startY));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Position is driven by CSS variables (--tx/--ty) so the entry animation's
  // transform keyframes (which read the same variables) don't fight dragging.
  const style: React.CSSProperties = win.maximized
    ? { zIndex: win.z }
    : ({
        zIndex: win.z,
        width: win.w,
        height: win.h,
        "--tx": `${win.x}px`,
        "--ty": `${win.y}px`,
      } as React.CSSProperties);

  return (
    <>
      <div
        ref={frameRef}
        className={`${styles.window} ${focused ? styles.focused : ""} ${
        win.maximized ? styles.maximized : ""
      } ${closing ? styles.closing : ""} ${
        minimizing
          ? minimizeEffect === "scale"
            ? styles.minimizingScale
            : styles.minimizing
          : ""
      }`}
      style={style}
      onPointerDown={() => onFocus(win.id)}
      onContextMenu={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={win.title}
    >
      <div
        className={styles.titlebar}
        onPointerDown={startDrag}
        onDoubleClick={() => onMaximize(win.id)}
      >
        <div className={styles.trafficLights}>
          <button
            type="button"
            className={`${styles.light} ${styles.lightClose}`}
            aria-label="Close"
            onClick={() => onClose(win.id)}
          >
            <span>×</span>
          </button>
          <button
            type="button"
            className={`${styles.light} ${styles.lightMin}`}
            aria-label="Minimize"
            onClick={() => onMinimize(win.id)}
          >
            <span>−</span>
          </button>
          <button
            type="button"
            className={`${styles.light} ${styles.lightZoom}`}
            aria-label="Zoom"
            onClick={(e) => {
              e.stopPropagation();
              onFocus(win.id);
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setZoomMenu(zoomMenu ? null : { x: r.left, y: r.bottom + 6 });
            }}
          >
            <span>+</span>
          </button>
        </div>
        <AppIcon app={DESKTOP_APPS.find((a) => a.id === win.appId)!} size={20} />
        <span className={styles.title}>{win.title}</span>
        <span className={styles.titleSpacer} />
      </div>
      <div className={styles.content}>{children}</div>
      {!win.maximized && (
        <div className={styles.resizeHandle} onPointerDown={startResize} />
      )}
      {tileHint && (
        <div
          className={`${styles.tileOverlay} ${
            styles[`tileOverlay${tileHint[0].toUpperCase()}${tileHint.slice(1)}`]
          }`}
        />
      )}
      </div>
      {zoomMenu &&
        createPortal(
          <>
            <div className={styles.zoomMenuBackdrop} onClick={() => setZoomMenu(null)} />
            <div className={styles.zoomMenu} style={{ left: zoomMenu.x, top: zoomMenu.y }}>
              <button
                type="button"
                className={styles.zoomItem}
                onClick={() => {
                  setZoomMenu(null);
                  onMaximize(win.id);
                }}
              >
                Fill & Arrange
              </button>
              <div className={styles.zoomSep} />
              <button
                type="button"
                className={styles.zoomItem}
                onClick={() => {
                  setZoomMenu(null);
                  onTile(win.id, "left");
                }}
              >
                Tile Window Left of Screen
              </button>
              <button
                type="button"
                className={styles.zoomItem}
                onClick={() => {
                  setZoomMenu(null);
                  onTile(win.id, "right");
                }}
              >
                Tile Window Right of Screen
              </button>
              <div className={styles.zoomSep} />
              <button
                type="button"
                className={styles.zoomItem}
                onClick={() => {
                  setZoomMenu(null);
                  onMaximize(win.id);
                }}
              >
                {win.maximized ? "Exit Full Screen" : "Enter Full Screen"}
              </button>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
