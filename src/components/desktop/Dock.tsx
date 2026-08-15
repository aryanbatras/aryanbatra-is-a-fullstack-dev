import { useRef, useState } from "react";
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

const MAGNIFY_RADIUS = 150;

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
  const [scales, setScales] = useState<Record<string, number>>({});
  const [dockMenu, setDockMenu] = useState<DockMenuState | null>(null);
  const [trashMenu, setTrashMenu] = useState<TrashMenuState | null>(null);
  const [bounceId, setBounceId] = useState<string | null>(null);
  const bounceTimer = useRef<number | null>(null);

  const launch = (appId: string) => {
    onLaunch(appId);
    // macOS-style bounce while the app opens
    setBounceId(appId);
    if (bounceTimer.current) window.clearTimeout(bounceTimer.current);
    bounceTimer.current = window.setTimeout(() => setBounceId(null), 950);
  };

  const maxScale = dockMagnify ? Math.max(1, dockMagnifySize / dockSize) : 1;

  const handleMove = (e: React.MouseEvent) => {
    const dock = dockRef.current;
    if (!dock || !dockMagnify) return;
    const icons = Array.from(
      dock.querySelectorAll<HTMLElement>("[data-dock-icon]"),
    );
    const next: Record<string, number> = {};
    let magnified = false;
    for (const el of icons) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const t = Math.max(0, 1 - dist / MAGNIFY_RADIUS);
      const s = 1 + t * (maxScale - 1);
      next[el.dataset.dockIcon as string] = s;
      if (t > 0.02) magnified = true;
    }
    setScales(magnified ? next : {});
  };

  const dockClass = `${styles.dock} ${
    dockPosition === "left" ? styles.dockLeft : dockPosition === "right" ? styles.dockRight : ""
  } ${dockAutoHide ? styles.dockAutoHide : ""}`;

  return (
    <div
      className={dockClass}
      onMouseMove={handleMove}
      onMouseLeave={() => setScales({})}
      style={{ "--dock-size": `${dockSize}px` } as React.CSSProperties}
    >
      {dockAutoHide && <div className={styles.dockPeek} />}
      <div ref={dockRef} className={styles.dockInner}>
        {DESKTOP_APPS.filter((a) => a.inDock).map((app) => {
          const running = runningApps.includes(app.id);
          return (
            <button
              key={app.id}
              type="button"
              data-dock-icon={app.id}
              className={`${styles.dockItem} ${
                bounceId === app.id ? styles.dockBounce : ""
              }`}
              style={{ transform: `scale(${scales[app.id] ?? 1})` }}
              onClick={() => launch(app.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDockMenu({
                  appId: app.id,
                  x: Math.min(e.clientX, window.innerWidth - 220),
                  y: e.clientY - 20,
                });
              }}
              aria-label={app.title}
            >
              <AppIcon app={app} size={dockSize} />
              <span className={styles.dockLabel}>{app.title}</span>
              {running && <span className={styles.dockDot} />}
            </button>
          );
        })}

        <div className={styles.dockSeparator} />

        {/* minimized windows appear as thumbnails in the dock, like real macOS */}
        {minimizedWindows.map((w) => {
          const app = DESKTOP_APPS.find((a) => a.id === w.appId);
          return (
            <button
              key={w.id}
              type="button"
              data-dock-icon={`min-${w.id}`}
              className={styles.dockItem}
              style={{ transform: `scale(${scales[`min-${w.id}`] ?? 1})` }}
              onClick={() => onRestore(w.id)}
              aria-label={`Restore ${w.title}`}
            >
              <span className={styles.miniWindow}>
                <AppIcon app={app ?? DESKTOP_APPS[0]} size={40} />
                <span className={styles.miniWindowTitle}>{w.title}</span>
              </span>
              <span className={styles.dockLabel}>{w.title}</span>
            </button>
          );
        })}

        <button
          type="button"
          data-dock-icon="trash"
          className={styles.dockItem}
          style={{ transform: `scale(${scales.trash ?? 1})` }}
          onClick={onEmptyTrash}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setTrashMenu({
              x: Math.min(e.clientX, window.innerWidth - 220),
              y: e.clientY - 20,
            });
          }}
          aria-label="Trash"
        >
          <img
            src="/aryan/icons/trash.png"
            alt="Trash"
            width={48}
            height={48}
            draggable={false}
            className={styles.trashTile}
          />
          <span className={styles.dockLabel}>Trash</span>
        </button>
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
    </div>
  );
}
