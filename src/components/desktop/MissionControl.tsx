import { DESKTOP_APPS, WALLPAPERS, type SpaceConfig } from "@/constants/desktop";
import type { DesktopWindow } from "@/hooks/useWindowManager";
import AppIcon from "@/components/desktop/AppIcon";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface MissionControlProps {
  windows: DesktopWindow[];
  wallpaperSrc: string;
  spaces: SpaceConfig[];
  currentSpaceId: number;
  onPickSpace: (spaceId: number) => void;
  onAddSpace: () => void;
  onPick: (appId: string) => void;
  onClose: () => void;
}

/**
 * Mission Control: a Spaces strip on top (each desktop thumbnail = its own
 * wallpaper), plus every open window of the current space spread across the
 * screen as glass cards. Clicking a space switches to it; clicking a window
 * restores + focuses it. Esc or clicking the backdrop exits.
 */
export default function MissionControl({
  windows,
  wallpaperSrc,
  spaces,
  currentSpaceId,
  onPickSpace,
  onAddSpace,
  onPick,
  onClose,
}: MissionControlProps) {
  return (
    <div className={styles.mcBackdrop} onClick={onClose}>
      <div className={styles.mcStage} onClick={(e) => e.stopPropagation()}>
        <div className={styles.mcSpaces}>
          {spaces.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`${styles.mcSpace} ${
                s.id === currentSpaceId ? styles.mcSpaceActive : ""
              }`}
              onClick={() => onPickSpace(s.id)}
              aria-label={s.name}
            >
              <span
                className={styles.mcSpaceArt}
                style={{
                  backgroundImage: `url(${WALLPAPERS[s.wallpaperIndex % WALLPAPERS.length].src})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <span className={styles.mcSpaceName}>{s.name}</span>
            </button>
          ))}
          {spaces.length < 6 && (
            <button
              type="button"
              className={styles.mcAddSpace}
              onClick={onAddSpace}
              aria-label="Add Space"
            >
              <span className={styles.mcAddSpacePlus}>＋</span>
              <span className={styles.mcSpaceName}>New Space</span>
            </button>
          )}
        </div>

        <div
          className={styles.mcCurrent}
          style={{
            backgroundImage: `url(${wallpaperSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {windows.map((win, i) => {
            const app = DESKTOP_APPS.find((a) => a.id === win.appId);
            return (
              <button
                key={win.id}
                type="button"
                className={styles.mcCard}
                style={
                  {
                    "--mcX": `${(i % 4) * 26}px`,
                    "--mcY": `${(i % 4) * 14}px`,
                  } as React.CSSProperties
                }
                onClick={() => onPick(win.appId)}
                aria-label={`Focus ${win.title}`}
              >
                <span className={styles.mcTitlebar}>
                  <span className={styles.mcLights}>
                    <span className={styles.mcLightRed} />
                    <span className={styles.mcLightYellow} />
                    <span className={styles.mcLightGreen} />
                  </span>
                  <span className={styles.mcTitle}>{win.title}</span>
                </span>
                <span className={styles.mcBody}>
                  {app && <AppIcon app={app} size={46} />}
                  <span className={styles.mcName}>{win.title}</span>
                  {win.minimized && (
                    <span className={styles.mcMinimizedTag}>Minimized</span>
                  )}
                </span>
              </button>
            );
          })}

          {windows.length === 0 && (
            <div className={styles.mcEmpty}>
              No windows open — launch something from the dock.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
