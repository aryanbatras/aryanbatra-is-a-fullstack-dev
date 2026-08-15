import { DESKTOP_APPS } from "@/constants/desktop";
import type { DesktopWindow } from "@/hooks/useWindowManager";
import AppIcon from "@/components/desktop/AppIcon";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface StageStripProps {
  windows: DesktopWindow[];
  focusedId: string | null;
  onBring: (appId: string) => void;
}

/**
 * Stage Manager's left-edge strip: other apps' windows live here as glass
 * thumbnails. Clicking one brings that app's whole set forward.
 */
export default function StageStrip({ windows, focusedId, onBring }: StageStripProps) {
  const focusedApp = focusedId
    ? windows.find((w) => w.id === focusedId)?.appId
    : null;

  const apps = Array.from(
    new Set(
      windows
        .filter((w) => !w.minimized && w.appId !== focusedApp)
        .map((w) => w.appId),
    ),
  );

  if (apps.length === 0) return null;

  return (
    <div className={styles.stageStrip} role="complementary" aria-label="Stage Manager recent apps">
      {apps.map((appId) => {
        const app = DESKTOP_APPS.find((a) => a.id === appId);
        if (!app) return null;
        const count = windows.filter((w) => w.appId === appId && !w.minimized).length;
        return (
          <button
            key={appId}
            type="button"
            className={styles.stageThumb}
            onClick={() => onBring(appId)}
            aria-label={`Show ${app.title}${count > 1 ? ` (${count} windows)` : ""}`}
          >
            <AppIcon app={app} size={42} />
            <span className={styles.stageThumbName}>{app.title}</span>
            {count > 1 && <span className={styles.stageThumbCount}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
