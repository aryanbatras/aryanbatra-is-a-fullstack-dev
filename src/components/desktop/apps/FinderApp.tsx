import { useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, Search, X } from "lucide-react";
import { DESKTOP_APPS, WEB_SHORTCUTS } from "@/constants/desktop";
import AppIcon from "@/components/desktop/AppIcon";
import styles from "@/styles/components/desktop/apps.module.css";

export interface FinderFile {
  id: string;
  name: string;
  kind: string;
  icon: string;
  size: string;
  /** appId to open when double-clicked. */
  appId: string;
  /** Document path (e.g. a PDF) opened by the pdf app when present. */
  src?: string;
  /** Internet-location (.url) target — opens the Browser at this URL. */
  url?: string;
}

/** Finder rows for the web shortcuts (opened in the Browser app). */
const WEB_FILES: FinderFile[] = WEB_SHORTCUTS.map((s) => ({
  id: `f-${s.id}`,
  name: s.name,
  kind: "Internet Location",
  icon: s.icon,
  size: "--",
  appId: "website",
  url: s.url,
}));

const HOME_FILES: FinderFile[] = [
  { id: "resume", name: "Resume.pdf", kind: "PDF Document", icon: "📄", size: "2.1 MB", appId: "resume" },
  { id: "showreel", name: "showreel.mp4", kind: "MPEG-4 Movie", icon: "🎬", size: "46 MB", appId: "videos" },
  { id: "readme", name: "README.txt", kind: "Plain Text", icon: "📖", size: "2 KB", appId: "readme" },
  { id: "notes", name: "Notes", kind: "Folder", icon: "📁", size: "--", appId: "notes" },
  { id: "photos", name: "Photos", kind: "Folder", icon: "📁", size: "--", appId: "photos" },
  { id: "projects", name: "Projects", kind: "Folder", icon: "📁", size: "--", appId: "projects" },
  { id: "maps", name: "Maps", kind: "Folder", icon: "📁", size: "--", appId: "maps" },
  { id: "about", name: "About Me.txt", kind: "Plain Text", icon: "🧑‍💻", size: "4 KB", appId: "about" },
];

/** Each sidebar location shows its own files, like a real Finder. */
const FILE_SETS: Record<string, FinderFile[]> = {
  Recents: [
    { id: "rec-showreel", name: "showreel.mp4", kind: "MPEG-4 Movie", icon: "🎬", size: "46 MB", appId: "videos" },
    { id: "rec-resume", name: "Resume.pdf", kind: "PDF Document", icon: "📄", size: "2.1 MB", appId: "resume" },
    { id: "rec-readme", name: "README.txt", kind: "Plain Text", icon: "📖", size: "2 KB", appId: "readme" },
    { id: "rec-about", name: "About Me.txt", kind: "Plain Text", icon: "🧑‍💻", size: "4 KB", appId: "about" },
    { id: "rec-projects", name: "Projects", kind: "Folder", icon: "📁", size: "--", appId: "projects" },
    ...WEB_FILES,
    { id: "rec-a2b-offer", name: "Offer Letter — A2B Digital.pdf", kind: "PDF Document", icon: "📄", size: "~1 MB", appId: "pdf", src: "/aryan/documents/a2b-offer-letter.pdf" },
    { id: "rec-sashel-cert", name: "Certificate — Sashel.pdf", kind: "PDF Document", icon: "📄", size: "~1 MB", appId: "pdf", src: "/aryan/documents/sashel-certificate.pdf" },
  ],
  Desktop: [
    { id: "d-about", name: "About Me", kind: "Application", icon: "🧑", size: "--", appId: "about" },
    { id: "d-resume", name: "Resume", kind: "Application", icon: "📄", size: "--", appId: "resume" },
    { id: "d-projects", name: "Projects", kind: "Application", icon: "🗂️", size: "--", appId: "projects" },
    { id: "d-notes", name: "Notes", kind: "Application", icon: "📝", size: "--", appId: "notes" },
    { id: "d-photos", name: "Photos", kind: "Application", icon: "🖼️", size: "--", appId: "photos" },
    { id: "d-videos", name: "Videos", kind: "Application", icon: "🎬", size: "--", appId: "videos" },
    { id: "d-maps", name: "Maps", kind: "Application", icon: "🗺️", size: "--", appId: "maps" },
    { id: "d-readme", name: "Read Me", kind: "Application", icon: "📖", size: "--", appId: "readme" },
  ],
  Documents: [
    { id: "doc-resume", name: "Resume.pdf", kind: "PDF Document", icon: "📄", size: "2.1 MB", appId: "resume" },
    { id: "doc-readme", name: "README.txt", kind: "Plain Text", icon: "📖", size: "2 KB", appId: "readme" },
    { id: "doc-about", name: "About Me.txt", kind: "Plain Text", icon: "🧑‍💻", size: "4 KB", appId: "about" },
    { id: "doc-notes", name: "Notes", kind: "Folder", icon: "📁", size: "--", appId: "notes" },
    { id: "doc-games", name: "Games", kind: "Folder", icon: "🎮", size: "--", appId: "games" },
    ...WEB_FILES,
  ],
  Downloads: [
    { id: "dl-showreel", name: "showreel.mp4", kind: "MPEG-4 Movie", icon: "🎬", size: "46 MB", appId: "videos" },
    { id: "dl-resume", name: "Resume.pdf", kind: "PDF Document", icon: "📄", size: "2.1 MB", appId: "resume" },
    { id: "dl-a2b-offer", name: "Offer Letter — A2B Digital.pdf", kind: "PDF Document", icon: "📄", size: "~1 MB", appId: "pdf", src: "/aryan/documents/a2b-offer-letter.pdf" },
    { id: "dl-a2b-offer-email", name: "Offer Letter Email — A2B Digital.pdf", kind: "PDF Document", icon: "📄", size: "~1 MB", appId: "pdf", src: "/aryan/documents/a2b-offer-letter-email.pdf" },
    { id: "dl-sashel-letter", name: "Experience Letter — Sashel.pdf", kind: "PDF Document", icon: "📄", size: "~1 MB", appId: "pdf", src: "/aryan/documents/sashel-experience-letter.pdf" },
    { id: "dl-sashel-cert", name: "Certificate — Sashel.pdf", kind: "PDF Document", icon: "📄", size: "~1 MB", appId: "pdf", src: "/aryan/documents/sashel-certificate.pdf" },
  ],
};

const FAVOURITES = ["Recents", "Applications", "Desktop", "Documents", "Downloads"];
const LOCATIONS = ["Aryan SSD", "Aryan Cloud"];

interface FinderAppProps {
  onOpenApp: (appId: string, src?: string, name?: string, url?: string) => void;
  onLaunchpad: () => void;
  onQuickLook: (file: FinderFile) => void;
}

/** A working Finder: sidebar locations with real files, search, and Quick Look. */
export default function FinderApp({
  onOpenApp,
  onLaunchpad,
  onQuickLook,
}: FinderAppProps) {
  const [sidebar, setSidebar] = useState("Recents");
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Space = Quick Look, exactly like real Finder
    if (e.key === " " && selected) {
      e.preventDefault();
      const file = visible.find((f) => f.id === selected);
      if (file) onQuickLook(file);
    }
  };

  const base = FILE_SETS[sidebar] ?? HOME_FILES;
  const visible = base.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()),
  );

  const openSidebar = (item: string) => {
    setSidebar(item);
    if (item === "Applications") onLaunchpad();
    if (item === "Desktop") onOpenApp("finder");
  };

  return (
    <div className={styles.finder} onKeyDown={onKeyDown}>
      {/* toolbar */}
      <div className={styles.finderToolbar}>
        <span className={styles.finderNav}>
          <ChevronLeft size={17} strokeWidth={2} className={styles.finderNavDim} />
          <ChevronRight size={17} strokeWidth={2} className={styles.finderNavDim} />
        </span>
        <span className={styles.finderTitle}>
          {sidebar}
        </span>
        <span className={styles.finderToolbarRight}>
          <div className={styles.finderSearch}>
            <Search size={13} strokeWidth={2} className={styles.finderSearchIcon} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              spellCheck={false}
              aria-label="Search files"
            />
            {query && (
              <button
                type="button"
                className={styles.finderSearchClear}
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={11} />
              </button>
            )}
          </div>
          <LayoutGrid size={16} strokeWidth={1.8} className={styles.finderViewIcon} />
        </span>
      </div>

      <div className={styles.finderBody}>
        {/* sidebar */}
        <aside className={styles.finderSidebar}>
          <div className={styles.finderSection}>Favourites</div>
          {FAVOURITES.map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.finderSidebarItem} ${
                sidebar === item ? styles.finderSidebarItemActive : ""
              }`}
              onClick={() => openSidebar(item)}
            >
              {item}
            </button>
          ))}
          <div className={styles.finderSection}>Locations</div>
          {LOCATIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.finderSidebarItem} ${
                sidebar === item ? styles.finderSidebarItemActive : ""
              }`}
              onClick={() => setSidebar(item)}
            >
              {item}
            </button>
          ))}
        </aside>

        {/* file grid */}
        <div className={styles.finderFiles}>
          {visible.length === 0 && (
            <div className={styles.finderEmpty}>
              {query ? `No results for “${query}”` : "This folder is empty."}
            </div>
          )}
          {visible.map((file) => {
            const app = DESKTOP_APPS.find((a) => a.id === file.appId);
            return (
              <button
                key={file.id}
                type="button"
                className={`${styles.finderFile} ${
                  selected === file.id ? styles.finderFileSelected : ""
                }`}
                onClick={() => {
                  // Touch devices can't double-click — a single tap opens.
                  if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
                    onOpenApp(file.appId, file.src, file.name, file.url);
                  } else {
                    setSelected(file.id);
                  }
                }}
                onDoubleClick={() => onOpenApp(file.appId, file.src, file.name, file.url)}
              >
                {app && file.kind !== "Folder" ? (
                  <AppIcon app={app} size={40} />
                ) : (
                  <img
                    src="/aryan/icons/folder.png"
                    alt={file.name}
                    width={40}
                    height={40}
                    draggable={false}
                    className={styles.finderFileIcon}
                  />
                )}
                <span className={styles.finderFileName}>{file.name}</span>
                <span className={styles.finderFileMeta}>
                  {file.kind} · {file.size}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* path bar */}
      <div className={styles.finderPathbar}>
        <span>Aryan</span>
        <span className={styles.finderPathSep}>›</span>
        <span>{sidebar}</span>
        {query && (
          <>
            <span className={styles.finderPathSep}>›</span>
            <span>“{query}”</span>
          </>
        )}
      </div>
    </div>
  );
}
