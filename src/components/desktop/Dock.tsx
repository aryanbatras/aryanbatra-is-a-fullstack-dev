import { memo, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { toCanvas } from "html-to-image";
import { DESKTOP_APPS, type DockPosition } from "@/constants/desktop";
import AppIcon from "@/components/desktop/AppIcon";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface MinimizedDockWindow {
  id: string;
  appId: string;
  title: string;
}

interface DockProps {
  runningApps: string[];
  minimizedWindows: MinimizedDockWindow[];
  onLaunch: (appId: string) => void;
  onQuit: (appId: string) => void;
  onRestore: (id: string) => void;
  onEmptyTrash: () => void;
  onEmptyTrashRequest: () => void;
  /** Desktop & Dock settings (Settings → Desktop & Dock). */
  dockSize?: number;
  dockMagnify?: boolean;
  dockMagnifySize?: number;
  dockPosition?: DockPosition;
  dockAutoHide?: boolean;
}

interface DockMenuState {
  appId: string;
  x: number;
  y: number;
}

interface TrashMenuState {
  x: number;
  y: number;
}

interface PeekState {
  appId: string;
  title: string;
  image: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Pixels of cursor travel before an icon stops being affected by the mouse. */
const MAGNIFY_RADIUS = 150;
/** Pixels icons are pushed away from the cursor so magnified neighbours have room. */
const NUDGE = 54;
/** Breathing room between the glass shelf edge and the outermost icon. */
const SHELF_PAD = 12;
const PEEK_MAX_WIDTH = 320;
const PEEK_FPS = 8;
/* Build-UI's dock spring: low mass + moderate stiffness = fast, silky, with
   just a hint of the macOS overshoot. */
const SPRING = { mass: 0.1, stiffness: 170, damping: 12 };

/** True when the canvas has any non-transparent pixel (daedalOS's isCanvasDrawn). */
function isCanvasDrawn(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return true;
    }
  } catch {
    return true;
  }
  return false;
}

/** Find the visible window element for an app (topmost by z-index). */
function windowElementFor(appId: string): HTMLElement | null {
  let best: HTMLElement | null = null;
  let bestZ = -1;
  for (const el of document.querySelectorAll<HTMLElement>("[data-window-app]")) {
    if (el.dataset.windowApp !== appId || el.offsetParent === null) continue;
    const z = parseInt(getComputedStyle(el).zIndex, 10) || 0;
    if (z >= bestZ) {
      bestZ = z;
      best = el;
    }
  }
  return best;
}

interface DockIconProps {
  iconKey: string;
  /** Mouse position along the dock axis, measured from the row's origin. */
  mouse: MotionValue<number>;
  axis: "x" | "y";
  /** Transform origin for the growing art — bottom-centre on the bottom
   *  dock; anchored to the screen edge on side docks (macOS grows icons
   *  outward from the edge). */
  origin: { x: number; y: number };
  maxScale: number;
  className?: string;
  label?: string;
  dot?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
  onContextMenu?: React.MouseEventHandler<HTMLButtonElement>;
  ariaLabel?: string;
  children?: React.ReactNode;
}

/**
 * One dock icon: a FIXED-size layout cell whose inner art magnifies via
 * springs. The layout box never changes, so the row — and the glass shelf
 * around it — never grows taller. The art scales from the bottom edge and
 * pops up out of the bar, exactly like macOS.
 */
const DockIcon = memo(function DockIcon({
  iconKey,
  mouse,
  axis,
  origin,
  maxScale,
  className,
  label,
  dot,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  ariaLabel,
  children,
}: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null);

  // Distance from the cursor to this icon's centre, along the dock axis.
  const distance = useTransform(() => {
    const el = ref.current;
    if (!el) return Infinity;
    const offset = axis === "x" ? el.offsetLeft : el.offsetTop;
    const size = axis === "x" ? el.offsetWidth : el.offsetHeight;
    return mouse.get() - offset - size / 2;
  });

  // Continuous, smooth falloff — the icon under the cursor grows most,
  // neighbours grow a little, the rest sit perfectly still.
  const scale = useTransform(() => {
    const d = distance.get();
    const t = Math.max(0, 1 - Math.abs(d) / MAGNIFY_RADIUS);
    const s = t * t * (3 - 2 * t); // smoothstep — gentle, never linear
    return 1 + (maxScale - 1) * s;
  });

  // Icons push apart around the cursor so the magnified ones have room.
  const nudge = useTransform(() => {
    const d = distance.get();
    if (!Number.isFinite(d)) return 0;
    if (d < -MAGNIFY_RADIUS || d > MAGNIFY_RADIUS) return Math.sign(d) * -NUDGE;
    return (-d / MAGNIFY_RADIUS) * NUDGE * scale.get();
  });

  const scaleSpring = useSpring(scale, SPRING);
  const nudgeSpring = useSpring(nudge, SPRING);

  const transformStyle = {
    scale: scaleSpring,
    ...(axis === "x" ? { x: nudgeSpring } : { y: nudgeSpring }),
    originX: origin.x,
    originY: origin.y,
  };

  return (
    <button
      ref={ref}
      type="button"
      data-dock-icon={iconKey}
      className={`${styles.dockItem}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={onContextMenu}
      aria-label={ariaLabel}
    >
      <motion.span
        data-dock-scale
        className={styles.dockScale}
        style={transformStyle}
      >
        {children}
      </motion.span>
      {label && <span className={styles.dockLabel}>{label}</span>}
      {dot && <span className={styles.dockDot} />}
    </button>
  );
});

export default function Dock({
  runningApps,
  minimizedWindows,
  onLaunch,
  onQuit,
  onRestore,
  onEmptyTrash,
  onEmptyTrashRequest,
  dockSize = 56,
  dockMagnify = true,
  dockMagnifySize = 88,
  dockPosition = "bottom",
  dockAutoHide = false,
}: DockProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const [dockMenu, setDockMenu] = useState<DockMenuState | null>(null);
  const [trashMenu, setTrashMenu] = useState<TrashMenuState | null>(null);
  const [bounceId, setBounceId] = useState<string | null>(null);
  const bounceTimer = useRef<number | null>(null);
  const [peek, setPeek] = useState<PeekState | null>(null);
  const peekTimer = useRef<number | null>(null);
  const peekAnim = useRef(false);
  const peekAppRef = useRef<string | null>(null);
  const iconHoverRef = useRef<Record<string, boolean>>({});
  const peekCardHoverRef = useRef(false);

  // Cursor position relative to the row. Updating these motion values never
  // re-renders React; the icons' springs just follow.
  const mouseX = useMotionValue(-Infinity);
  const mouseY = useMotionValue(-Infinity);

  // The glass shelf hugs the row: its left/right (bottom dock) or top/bottom
  // (side docks) edges are measured from the icons' actual spread each frame
  // and spring into place — so the bar grows to contain magnified icons
  // horizontally while its HEIGHT stays fixed (macOS never grows taller).
  // Each spring follows a plain target value, so .set() eases instead of
  // jumping. Start at the resting inset so the first paint already hugs.
  const shelfLeftTarget = useMotionValue(SHELF_PAD);
  const shelfRightTarget = useMotionValue(SHELF_PAD);
  const shelfTopTarget = useMotionValue(SHELF_PAD);
  const shelfBottomTarget = useMotionValue(SHELF_PAD);
  const shelfLeft = useSpring(shelfLeftTarget, SPRING);
  const shelfRight = useSpring(shelfRightTarget, SPRING);
  const shelfTop = useSpring(shelfTopTarget, SPRING);
  const shelfBottom = useSpring(shelfBottomTarget, SPRING);
  const shelfRaf = useRef<number | null>(null);
  /** Resting extent of the row (no magnification) — what the shelf snaps
   *  back to when the cursor leaves the dock. */
  const restExtent = useRef<{ a: number; b: number }>({ a: 12, b: 12 });

  const axis: "x" | "y" = dockPosition === "bottom" ? "x" : "y";
  const mouse = axis === "x" ? mouseX : mouseY;
  const maxScale = dockMagnify ? Math.max(1, dockMagnifySize / dockSize) : 1;
  // Where the growing art anchors — bottom-centre on the bottom dock;
  // flush to the screen edge on side docks (macOS grows icons outward).
  const origin =
    dockPosition === "left"
      ? { x: 0, y: 0.5 }
      : dockPosition === "right"
        ? { x: 1, y: 0.5 }
        : { x: 0.5, y: 1 };

  /** Measure the row's visual extent and drive the shelf edges with it.
   *  The magnified art lives on the inner [data-dock-scale] spans, so we
   *  measure THOSE — the fixed-size buttons would never show the spread. */
  const measureShelf = () => {
    const dock = dockRef.current;
    if (!dock) return;
    const art = Array.from(dock.querySelectorAll<HTMLElement>("[data-dock-scale]"));
    if (!art.length) return;
    const dockRect = dock.getBoundingClientRect();
    if (axis === "x") {
      let minL = Infinity;
      let maxR = -Infinity;
      for (const el of art) {
        const r = el.getBoundingClientRect();
        minL = Math.min(minL, r.left);
        maxR = Math.max(maxR, r.right);
      }
      shelfLeftTarget.set(minL - dockRect.left - SHELF_PAD);
      shelfRightTarget.set(dockRect.right - maxR - SHELF_PAD);
    } else {
      let minT = Infinity;
      let maxB = -Infinity;
      for (const el of art) {
        const r = el.getBoundingClientRect();
        minT = Math.min(minT, r.top);
        maxB = Math.max(maxB, r.bottom);
      }
      shelfTopTarget.set(minT - dockRect.top - SHELF_PAD);
      shelfBottomTarget.set(dockRect.bottom - maxB - SHELF_PAD);
    }
  };

  /** rAF-throttled shelf measurement while the cursor is over the dock. */
  const scheduleShelf = () => {
    if (shelfRaf.current !== null) return;
    shelfRaf.current = window.requestAnimationFrame(() => {
      shelfRaf.current = null;
      measureShelf();
    });
  };

  // Capture the resting extent (icons unmagnified) so the shelf returns to
  // it on mouse-leave, and keep it in sync when the row changes.
  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;
    const art = Array.from(dock.querySelectorAll<HTMLElement>("[data-dock-scale]"));
    if (!art.length) return;
    const dockRect = dock.getBoundingClientRect();
    if (axis === "x") {
      let minL = Infinity;
      let maxR = -Infinity;
      for (const el of art) {
        const r = el.getBoundingClientRect();
        minL = Math.min(minL, r.left);
        maxR = Math.max(maxR, r.right);
      }
      restExtent.current = {
        a: minL - dockRect.left - SHELF_PAD,
        b: dockRect.right - maxR - SHELF_PAD,
      };
      shelfLeftTarget.set(restExtent.current.a);
      shelfRightTarget.set(restExtent.current.b);
    } else {
      let minT = Infinity;
      let maxB = -Infinity;
      for (const el of art) {
        const r = el.getBoundingClientRect();
        minT = Math.min(minT, r.top);
        maxB = Math.max(maxB, r.bottom);
      }
      restExtent.current = {
        a: minT - dockRect.top - SHELF_PAD,
        b: dockRect.bottom - maxB - SHELF_PAD,
      };
      shelfTopTarget.set(restExtent.current.a);
      shelfBottomTarget.set(restExtent.current.b);
    }
  }, [axis, minimizedWindows.length]);

  /** Live window preview — macOS-style peek above the Dock (daedalOS). */
  const stopPeek = () => {
    peekAppRef.current = null;
    peekAnim.current = false;
    if (peekTimer.current) {
      window.clearTimeout(peekTimer.current);
      peekTimer.current = null;
    }
    setPeek(null);
  };

  /** Stop only once the mouse has left both the icon and the peek card. */
  const maybeStopPeek = (appId: string) => {
    if (peekAppRef.current !== appId) return;
    if (iconHoverRef.current[appId] || peekCardHoverRef.current) return;
    stopPeek();
  };

  const captureFrame = async (
    appId: string,
    title: string,
    el: HTMLElement,
    iconEl: HTMLElement,
  ) => {
    if (peekAppRef.current !== appId || !peekAnim.current) return;
    let dataUrl = "";
    try {
      const canvas = await toCanvas(el, {
        skipAutoScale: true,
        style: { inset: "0", margin: "0", padding: "0" },
      });
      if (isCanvasDrawn(canvas)) dataUrl = canvas.toDataURL();
    } catch {
      // ignore capture failures — keep the previous frame
    }
    if (peekAppRef.current !== appId || !peekAnim.current) return;
    if (dataUrl) {
      const r = el.getBoundingClientRect();
      const iconRect = iconEl.getBoundingClientRect();
      const cardW = Math.min(PEEK_MAX_WIDTH, Math.max(120, r.width));
      const cardH = Math.round(cardW * (r.height / r.width));
      const x = Math.min(
        Math.max(iconRect.left + iconRect.width / 2 - cardW / 2, 8),
        window.innerWidth - cardW - 8,
      );
      const y = Math.max(8, iconRect.top - cardH - 14);
      setPeek({ appId, title, image: dataUrl, x, y, w: cardW, h: cardH });
    }
    window.setTimeout(() => captureFrame(appId, title, el, iconEl), 1000 / PEEK_FPS);
  };

  const startPeek = (appId: string, iconEl: HTMLElement) => {
    const el = windowElementFor(appId);
    if (!el) return;
    const title = DESKTOP_APPS.find((a) => a.id === appId)?.title ?? appId;
    peekAppRef.current = appId;
    if (peekTimer.current) window.clearTimeout(peekTimer.current);
    peekTimer.current = window.setTimeout(() => {
      peekAnim.current = true;
      captureFrame(appId, title, el, iconEl);
    }, 450);
  };

  useEffect(
    () => () => {
      peekAppRef.current = null;
      peekAnim.current = false;
      if (peekTimer.current) window.clearTimeout(peekTimer.current);
    },
    [],
  );

  const launch = (appId: string) => {
    onLaunch(appId);
    // macOS-style bounce while the app opens
    setBounceId(appId);
    if (bounceTimer.current) window.clearTimeout(bounceTimer.current);
    bounceTimer.current = window.setTimeout(() => setBounceId(null), 950);
  };

  /** Feed the cursor position to the magnification springs. */
  const handleMove = (e: React.MouseEvent) => {
    const dock = dockRef.current;
    if (!dock || !dockMagnify) return;
    const r = dock.getBoundingClientRect();
    mouseX.set(e.clientX - r.left);
    mouseY.set(e.clientY - r.top);
    scheduleShelf();
  };

  /** Reset the cursor to infinity so every icon springs back to rest, and
   *  let the shelf return to the row's resting extent. */
  const handleLeave = () => {
    mouseX.set(-Infinity);
    mouseY.set(-Infinity);
    if (shelfRaf.current !== null) {
      window.cancelAnimationFrame(shelfRaf.current);
      shelfRaf.current = null;
    }
    shelfLeftTarget.set(restExtent.current.a);
    shelfRightTarget.set(restExtent.current.b);
    shelfTopTarget.set(restExtent.current.a);
    shelfBottomTarget.set(restExtent.current.b);
  };

  // Clean up the shelf rAF on unmount.
  useEffect(
    () => () => {
      if (shelfRaf.current !== null) window.cancelAnimationFrame(shelfRaf.current);
    },
    [],
  );

  const dockClass = `${styles.dock} ${
    dockPosition === "left" ? styles.dockLeft : dockPosition === "right" ? styles.dockRight : ""
  } ${dockAutoHide ? styles.dockAutoHide : ""}`;

  return (
    <div
      className={dockClass}
      data-dock
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={
        {
          "--dock-size": `${dockSize}px`,
          "--dock-magnify": `${dockMagnify ? dockMagnifySize : dockSize}px`,
        } as React.CSSProperties
      }
    >
      {dockAutoHide && <div className={styles.dockPeek} />}
      <div ref={dockRef} className={styles.dockInner}>
        {/* Fixed-height glass shelf — hugs the row horizontally via springs,
            never grows taller. The icons magnify up out of it. */}
        <motion.div
          className={styles.dockShelf}
          style={
            axis === "x"
              ? { left: shelfLeft, right: shelfRight }
              : { top: shelfTop, bottom: shelfBottom }
          }
          aria-hidden
        />

        {/* Apps area — a clean macOS dock starts with ONLY Finder (it can't
            be removed) plus whatever is actually running. Nothing is pinned:
            open an app and it appears here; quit it and it goes away. */}
        {(() => {
          const finder = DESKTOP_APPS.find((a) => a.id === "finder")!;
          // Finder is always running — it shows a permanent dot.
          const always = [finder];
          // Every other app currently running (unique, non-minimized).
          const rest = DESKTOP_APPS.filter(
            (a) => a.id !== "finder" && runningApps.includes(a.id),
          );
          return [...always, ...rest].map((app) => {
            const running = true; // Finder is always on; the rest are running
            return (
              <DockIcon
                key={app.id}
                iconKey={app.id}
                mouse={mouse}
                axis={axis}
                origin={origin}
                maxScale={maxScale}
                className={bounceId === app.id ? styles.dockBounce : undefined}
                label={app.title}
                dot={running}
                onClick={() => launch(app.id)}
                onMouseEnter={(e) => {
                  iconHoverRef.current[app.id] = true;
                  if (running) startPeek(app.id, e.currentTarget);
                }}
                onMouseLeave={() => {
                  iconHoverRef.current[app.id] = false;
                  maybeStopPeek(app.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDockMenu({
                    appId: app.id,
                    x: Math.min(e.clientX, window.innerWidth - 220),
                    y: e.clientY - 20,
                  });
                }}
                ariaLabel={app.title}
              >
                <AppIcon app={app} size={dockSize} />
              </DockIcon>
            );
          });
        })()}

        {/* macOS divider — separates apps from minimized windows + Trash. */}
        <div className={styles.dockSeparator} />

        {/* minimized windows appear as thumbnails in the dock, like real macOS */}
        {minimizedWindows.map((w) => {
          const app = DESKTOP_APPS.find((a) => a.id === w.appId);
          return (
            <DockIcon
              key={w.id}
              iconKey={`min-${w.id}`}
              mouse={mouse}
              axis={axis}
              origin={origin}
              maxScale={maxScale}
              label={w.title}
              onClick={() => onRestore(w.id)}
              ariaLabel={`Restore ${w.title}`}
            >
              <span className={styles.miniWindow}>
                <AppIcon app={app ?? DESKTOP_APPS[0]} size={40} />
                <span className={styles.miniWindowTitle}>{w.title}</span>
              </span>
            </DockIcon>
          );
        })}

        <DockIcon
          iconKey="trash"
          mouse={mouse}
          axis={axis}
          origin={origin}
          maxScale={maxScale}
          label="Trash"
          onClick={onEmptyTrash}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setTrashMenu({
              x: Math.min(e.clientX, window.innerWidth - 220),
              y: e.clientY - 20,
            });
          }}
          ariaLabel="Trash"
        >
          <img
            src="/aryan/icons/trash.png"
            alt="Trash"
            width={48}
            height={48}
            draggable={false}
            className={styles.trashTile}
          />
        </DockIcon>
      </div>

      {dockMenu && (
        <>
          <div
            className={styles.dockMenuBackdrop}
            onClick={() => setDockMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setDockMenu(null);
            }}
          />
          <div className={styles.dockMenu} style={{ left: dockMenu.x, top: dockMenu.y }}>
            <div className={styles.dockMenuTitle}>
              {DESKTOP_APPS.find((a) => a.id === dockMenu.appId)?.title}
            </div>
            <div className={styles.dropdownSeparator} />
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setDockMenu(null);
                onLaunch(dockMenu.appId);
              }}
            >
              Open
            </button>
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setDockMenu(null);
                onQuit(dockMenu.appId);
              }}
            >
              Quit
            </button>
          </div>
        </>
      )}

      {trashMenu && (
        <>
          <div
            className={styles.dockMenuBackdrop}
            onClick={() => setTrashMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setTrashMenu(null);
            }}
          />
          <div className={styles.dockMenu} style={{ left: trashMenu.x, top: trashMenu.y }}>
            <div className={styles.dockMenuTitle}>Trash</div>
            <div className={styles.dropdownSeparator} />
            <button
              type="button"
              className={styles.contextItem}
              onClick={() => {
                setTrashMenu(null);
                onEmptyTrashRequest();
              }}
            >
              Empty Trash…
            </button>
          </div>
        </>
      )}

      {peek && (
        <button
          type="button"
          className={styles.dockPeekCard}
          style={{ left: peek.x, top: peek.y, width: peek.w, height: peek.h }}
          onClick={() => {
            stopPeek();
            onLaunch(peek.appId);
          }}
          onMouseEnter={() => {
            peekCardHoverRef.current = true;
          }}
          onMouseLeave={() => {
            peekCardHoverRef.current = false;
            maybeStopPeek(peek.appId);
          }}
          aria-label={`Peek at ${peek.title}`}
        >
          <img src={peek.image} alt={peek.title} draggable={false} />
          <span className={styles.dockPeekTitle}>{peek.title}</span>
        </button>
      )}
    </div>
  );
}
