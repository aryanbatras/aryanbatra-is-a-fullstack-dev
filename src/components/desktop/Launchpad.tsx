import { useState } from "react";
import { Search } from "lucide-react";
import { DESKTOP_APPS } from "@/constants/desktop";
import AppIcon from "@/components/desktop/AppIcon";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface LaunchpadProps {
  onLaunch: (appId: string) => void;
  onClose: () => void;
}

/** Launchpad (F4): a fullscreen frosted-glass grid of every app. */
export default function Launchpad({ onLaunch, onClose }: LaunchpadProps) {
  const [query, setQuery] = useState("");

  const apps = DESKTOP_APPS.filter(
    (a) =>
      !query.trim() || a.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className={styles.launchpad} onClick={onClose}>
      <div className={styles.launchpadSearch}>
        <Search size={16} strokeWidth={2} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          spellCheck={false}
          autoComplete="off"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className={styles.launchpadGrid} onClick={(e) => e.stopPropagation()}>
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            className={styles.launchpadItem}
            onClick={() => onLaunch(app.id)}
            aria-label={app.title}
          >
            <AppIcon app={app} size={72} />
            <span className={styles.launchpadLabel}>{app.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
