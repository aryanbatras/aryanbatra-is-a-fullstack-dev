import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DESKTOP_APPS, type LaunchpadFolder, type LaunchpadItem } from "@/constants/desktop";
import AppIcon from "@/components/desktop/AppIcon";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface LaunchpadProps {
  items: LaunchpadItem[];
  folders: LaunchpadFolder[];
  hidden: string[];
  onChange: (items: LaunchpadItem[], folders: LaunchpadFolder[], hidden: string[]) => void;
  onLaunch: (appId: string) => void;
  onClose: () => void;
}

const appById = (id: string) => DESKTOP_APPS.find((a) => a.id === id);

/**
 * macOS Tahoe replaced Launchpad with the App Library — a categorized
 * "Applications" interface. Like the real one: a search field up top, a
 * Suggested row of the apps you're most likely to open, then apps grouped
 * into category sections (Utilities, Creativity, Entertainment, …). The
 * old Launchpad folder/drag machinery is gone — Tahoe dropped it too.
 */
export default function Launchpad({
  items,
  folders,
  hidden,
  onChange,
  onLaunch,
  onClose,
}: LaunchpadProps) {
  const [query, setQuery] = useState("");

  // Folders were removed in Tahoe — flatten their apps back into the grid
  // so nothing is lost when a saved session has Launchpad folders.
  const visibleApps = useMemo(() => {
    const ids = new Set<string>();
    for (const it of items) {
      if (it.kind === "app") ids.add(it.id);
      else {
        const f = folders.find((x) => x.id === it.id);
        f?.apps.forEach((a) => ids.add(a));
      }
    }
    // Everything else (apps not in a saved layout) appears too.
    DESKTOP_APPS.forEach((a) => ids.add(a.id));
    hidden.forEach((h) => ids.delete(h));
    ids.delete("pdf");
    ids.delete("markdown");
    return ids;
  }, [items, folders, hidden]);

  const q = query.trim().toLowerCase();

  const matches = (id: string) =>
    !q || (appById(id)?.title.toLowerCase().includes(q) ?? false);

  /** The apps the machine suggests — what a visitor actually opens. */
  const SUGGESTED = ["website", "resume", "projects", "games", "finder", "settings", "notes"];

  /** Tahoe's App Library categories, in order, with the apps in each. */
  const CATEGORIES: { label: string; appIds: string[] }[] = [
    {
      label: "Utilities",
      appIds: [
        "terminal",
        "textedit",
        "vim",
        "monaco",
        "devtools",
        "opentype",
        "tinymce",
        "boxedwine",
        "v86",
        "pdf",
        "markdown",
        "settings",
      ],
    },
    {
      label: "Creativity",
      appIds: ["paint", "photos", "videos", "webamp"],
    },
    {
      label: "Entertainment",
      appIds: ["games", "vlc", "emulator", "ruffle", "jsdos", "tic80", "classicube", "dxball", "webamp"],
    },
    {
      label: "Productivity & Finance",
      appIds: ["projects", "notes", "finder", "maps"],
    },
    {
      label: "Social",
      appIds: ["messenger", "irc"],
    },
    {
      label: "Information & Reading",
      appIds: ["about", "readme", "resume", "maps", "website"],
    },
  ];

  const suggestedApps = SUGGESTED.filter((id) => visibleApps.has(id) && matches(id));
  const shown = new Set<string>();
  const sections = CATEGORIES.map((cat) => ({
    label: cat.label,
    apps: cat.appIds.filter((id) => {
      if (shown.has(id)) return false;
      shown.add(id);
      return visibleApps.has(id) && matches(id);
    }),
  })).filter((s) => s.apps.length > 0);

  const nothing = suggestedApps.length === 0 && sections.every((s) => s.apps.length === 0);

  return (
    <div className={styles.launchpad} data-app-library onClick={onClose}>
      <div className={styles.launchpadSearch} onClick={(e) => e.stopPropagation()}>
        <Search size={16} strokeWidth={2} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          spellCheck={false}
          autoComplete="off"
          autoFocus
        />
      </div>

      <div className={styles.appLibraryScroll} onClick={(e) => e.stopPropagation()}>
        {nothing && <div className={styles.launchpadEmpty}>No apps match “{query}”</div>}

        {suggestedApps.length > 0 && (
          <section className={styles.appLibrarySection}>
            <h3 className={styles.appLibraryHeading}>Suggested</h3>
            <div className={styles.appLibraryGrid}>
              {suggestedApps.map((id) => {
                const app = appById(id);
                if (!app) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    className={styles.launchpadItem}
                    onClick={() => onLaunch(id)}
                    aria-label={app.title}
                  >
                    <span className={styles.launchpadIconWrap}>
                      <AppIcon app={app} size={72} />
                    </span>
                    <span className={styles.launchpadLabel}>{app.title}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {sections.map((section) => (
          <section key={section.label} className={styles.appLibrarySection}>
            <h3 className={styles.appLibraryHeading}>{section.label}</h3>
            <div className={styles.appLibraryGrid}>
              {section.apps.map((id) => {
                const app = appById(id);
                if (!app) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    className={styles.launchpadItem}
                    onClick={() => onLaunch(id)}
                    aria-label={app.title}
                  >
                    <span className={styles.launchpadIconWrap}>
                      <AppIcon app={app} size={72} />
                    </span>
                    <span className={styles.launchpadLabel}>{app.title}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className={styles.launchpadHint}>
        Click an app to open it — press Esc to close
      </div>
    </div>
  );
}
