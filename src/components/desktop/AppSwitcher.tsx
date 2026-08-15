import { DESKTOP_APPS } from "@/constants/desktop";
import AppIcon from "@/components/desktop/AppIcon";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface AppSwitcherProps {
  apps: string[];
  index: number;
  windows: Array<{ appId: string; title: string }>;
  onSelect: (appId: string) => void;
  onClose: () => void;
}

/** The ⌘Tab app switcher: floating glass strip with mini window previews. */
export default function AppSwitcher({
  apps,
  index,
  windows,
  onSelect,
  onClose,
}: AppSwitcherProps) {
  const active = apps[index];

  return (
    <div className={styles.switcherBackdrop} onClick={onClose}>
      <div className={styles.switcher} onClick={(e) => e.stopPropagation()}>
        <div className={styles.switcherRow}>
          {apps.map((appId, i) => {
            const app = DESKTOP_APPS.find((a) => a.id === appId);
            if (!app) return null;
            const winTitles = windows
              .filter((w) => w.appId === appId)
              .slice(0, 1)
              .map((w) => w.title);
            return (
              <button
                key={appId}
                type="button"
                className={`${styles.switcherItem} ${
                  i === index ? styles.switcherItemActive : ""
                }`}
                onClick={() => onSelect(appId)}
                aria-label={app.title}
              >
                {winTitles.length > 0 && (
                  <span className={styles.switcherPreview}>
                    <AppIcon app={app} size={38} />
                    <span className={styles.switcherPreviewTitle}>
                      {winTitles[0]}
                    </span>
                  </span>
                )}
                <AppIcon app={app} size={54} />
                <span className={styles.switcherLabel}>{app.title}</span>
              </button>
            );
          })}
        </div>
        {active && (
          <div className={styles.switcherActiveLabel}>
            {DESKTOP_APPS.find((a) => a.id === active)?.title}
          </div>
        )}
      </div>
    </div>
  );
}
