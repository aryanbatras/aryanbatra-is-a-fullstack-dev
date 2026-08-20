import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Archive,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Clock,
  Cloud,
  Download,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  HardDrive,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  List,
  Monitor,
  PackageOpen,
  Pencil,
  Search,
  TerminalSquare,
  Trash2,
  Wallpaper,
  X,
} from "lucide-react";
import { DESKTOP_APPS, README_TEXT, RESUME, WEB_SHORTCUTS } from "@/constants/desktop";
import { projects } from "@/data/projects";
import AppIcon from "@/components/desktop/AppIcon";
import FolderIcon from "@/components/desktop/FolderIcon";
import Glyph from "@/components/desktop/Glyph";
import {
  BINARY_KINDS,
  BOXEDWINE_KINDS,
  FONT_KINDS,
  MONACO_KINDS,
  TIC80_KINDS,
  TINYMCE_KINDS,
  V86_KINDS,
  VLC_KINDS,
  WEBAMP_KINDS,
  addFile,
  addFolder,
  copyFileTo,
  copyFolderTo,
  deleteFile,
  deleteFolder,
  downloadText,
  downloadUrl,
  moveFileToFolder,
  moveFolderTo,
  readFiles,
  readFolders,
  renameFile,
  renameFolder,
  type CustomFile,
  type CustomFolder,
} from "@/utils/finderStorage";
import {
  bytesToDataUrl,
  bytesToStr,
  dataUrlToBytes,
  entryExtension,
  entryKind,
  entryName,
  isTextEntry,
  parseIso,
  strToBytes,
  unzipEntries,
  zipEntries,
  type ArchiveEntry,
} from "@/utils/archives";
import { unarchive } from "@/utils/unarchive";
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
  /** ISO date — custom files have a real creation date. */
  createdAt?: string;
  /** User-created (renamable / deletable / downloadable). */
  custom?: boolean;
  /** Custom folder id when this file lives inside one. */
  folderId?: string;
  /** macOS Tahoe folder color id (custom folders). */
  color?: string;
  /** Tahoe folder emoji badge (custom folders). */
  emoji?: string;
  /** Entry inside a mounted zip/iso (read-only, not in storage). */
  archive?: boolean;
  /** Id of the custom archive file this entry lives in. */
  archiveId?: string;
  /** "zip" | "iso" — how the archive bytes are parsed. */
  archiveType?: "zip" | "iso";
  /** Full path of the entry inside the archive. */
  archivePath?: string;
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
  { id: "resume", name: "Resume.pdf", kind: "PDF Document", icon: "file-text", size: "2.1 MB", appId: "resume", src: "/aryan/aryan_resume.pdf" },
  { id: "showreel", name: "showreel.mp4", kind: "MPEG-4 Movie", icon: "film", size: "35 MB", appId: "videos" },
  { id: "readme", name: "README.txt", kind: "Plain Text", icon: "book-open", size: "2 KB", appId: "textedit" },
  { id: "about", name: "About Me.txt", kind: "Plain Text", icon: "user", size: "4 KB", appId: "textedit" },
  { id: "notes", name: "Notes", kind: "Folder", icon: "folder", size: "--", appId: "notes" },
  { id: "photos", name: "Photos", kind: "Folder", icon: "folder", size: "--", appId: "photos" },
  { id: "projects", name: "Projects", kind: "Folder", icon: "folder", size: "--", appId: "projects" },
  { id: "maps", name: "Maps", kind: "Folder", icon: "folder", size: "--", appId: "maps" },
];

/** Each sidebar location shows its own files, like a real Finder. */
const FILE_SETS: Record<string, FinderFile[]> = {
  Recents: [
    { id: "rec-showreel", name: "showreel.mp4", kind: "MPEG-4 Movie", icon: "film", size: "35 MB", appId: "videos" },
    { id: "rec-resume", name: "Resume.pdf", kind: "PDF Document", icon: "file-text", size: "2.1 MB", appId: "resume" },
    { id: "rec-readme", name: "README.txt", kind: "Plain Text", icon: "book-open", size: "2 KB", appId: "textedit" },
    { id: "rec-about", name: "About Me.txt", kind: "Plain Text", icon: "user", size: "4 KB", appId: "textedit" },
    { id: "rec-projects", name: "Projects", kind: "Folder", icon: "folder", size: "--", appId: "projects" },
    { id: "rec-a2b-offer", name: "Offer Letter — A2B Digital.pdf", kind: "PDF Document", icon: "file-text", size: "~1 MB", appId: "pdf", src: "/aryan/documents/a2b-offer-letter.pdf" },
    { id: "rec-sashel-cert", name: "Certificate — Sashel.pdf", kind: "PDF Document", icon: "file-text", size: "~1 MB", appId: "pdf", src: "/aryan/documents/sashel-certificate.pdf" },
  ],
  Desktop: [
    { id: "d-about", name: "About Me", kind: "Application", icon: "user", size: "--", appId: "about" },
    { id: "d-resume", name: "Resume", kind: "Application", icon: "file-text", size: "--", appId: "resume" },
    { id: "d-projects", name: "Projects", kind: "Application", icon: "folder", size: "--", appId: "projects" },
    { id: "d-notes", name: "Notes", kind: "Application", icon: "sticky-note", size: "--", appId: "notes" },
    { id: "d-photos", name: "Photos", kind: "Application", icon: "image", size: "--", appId: "photos" },
    { id: "d-videos", name: "Videos", kind: "Application", icon: "film", size: "--", appId: "videos" },
    { id: "d-maps", name: "Maps", kind: "Application", icon: "map", size: "--", appId: "maps" },
    { id: "d-readme", name: "Read Me", kind: "Application", icon: "book-open", size: "--", appId: "readme" },
    { id: "d-textedit", name: "TextEdit", kind: "Application", icon: "file-text", size: "--", appId: "textedit" },
  ],
  Documents: [
    { id: "doc-resume", name: "Resume.pdf", kind: "PDF Document", icon: "file-text", size: "2.1 MB", appId: "resume" },
    { id: "doc-readme", name: "README.txt", kind: "Plain Text", icon: "book-open", size: "2 KB", appId: "textedit" },
    { id: "doc-about", name: "About Me.txt", kind: "Plain Text", icon: "user", size: "4 KB", appId: "textedit" },
    { id: "doc-games", name: "Games", kind: "Folder", icon: "gamepad", size: "--", appId: "games" },
    { id: "doc-textedit", name: "TextEdit", kind: "Application", icon: "file-text", size: "--", appId: "textedit" },
    ...WEB_FILES,
  ],
  Downloads: [
    { id: "dl-showreel", name: "showreel.mp4", kind: "MPEG-4 Movie", icon: "film", size: "35 MB", appId: "videos" },
    { id: "dl-resume", name: "Resume.pdf", kind: "PDF Document", icon: "file-text", size: "2.1 MB", appId: "resume" },
    { id: "dl-a2b-offer", name: "Offer Letter — A2B Digital.pdf", kind: "PDF Document", icon: "file-text", size: "~1 MB", appId: "pdf", src: "/aryan/documents/a2b-offer-letter.pdf" },
    { id: "dl-a2b-offer-email", name: "Offer Letter Email — A2B Digital.pdf", kind: "PDF Document", icon: "file-text", size: "~1 MB", appId: "pdf", src: "/aryan/documents/a2b-offer-letter-email.pdf" },
    { id: "dl-sashel-letter", name: "Experience Letter — Sashel.pdf", kind: "PDF Document", icon: "file-text", size: "~1 MB", appId: "pdf", src: "/aryan/documents/sashel-experience-letter.pdf" },
    { id: "dl-sashel-cert", name: "Certificate — Sashel.pdf", kind: "PDF Document", icon: "file-text", size: "~1 MB", appId: "pdf", src: "/aryan/documents/sashel-certificate.pdf" },
  ],
};

const FAVOURITES = ["Recents", "Applications", "Desktop", "Documents", "Downloads", "Projects"];
const LOCATIONS = ["Pictures", "Desktop SSD", "Desktop Cloud"];

/** Sidebar icons — the real Finder draws each location with a system icon. */
const SIDEBAR_ICONS: Record<string, React.ReactNode> = {
  Recents: <Clock size={13} />,
  Applications: <LayoutGrid size={13} />,
  Desktop: <Monitor size={13} />,
  Documents: <FolderOpen size={13} />,
  Downloads: <Download size={13} />,
  Projects: <Folder size={13} />,
  Pictures: <ImageIcon size={13} />,
  "Desktop SSD": <HardDrive size={13} />,
  "Desktop Cloud": <Cloud size={13} />,
};

// Projects is a real folder in the Finder: each project is an Internet
// Location file that opens the live site (or GitHub) in the Browser.
FILE_SETS["Projects"] = projects
  .filter((p) => p.liveUrl || p.githubUrl)
  .map((p) => ({
    id: `proj-${p.id}`,
    name: `${p.title}.url`,
    kind: "Internet Location",
    icon: "globe",
    size: "--",
    appId: "website",
    url: p.liveUrl ?? p.githubUrl ?? "",
    createdAt: p.sortDate ? `${p.sortDate}T00:00:00Z` : undefined,
  }));

// Showreel frames as real image files (right-click → Set as Wallpaper).
FILE_SETS["Pictures"] = Array.from({ length: 32 }, (_, i) => ({
  id: `pic-${i + 1}`,
  name: `Showreel Frame ${String(i + 1).padStart(2, "0")}.jpg`,
  kind: "Image",
  icon: "image",
  size: "—",
  appId: "photos",
  src: `/aryan/photos/photo_${String(i + 1).padStart(2, "0")}.webp`,
}));

// Honest empty volumes — a real machine with nothing mounted on them yet.
FILE_SETS["Desktop SSD"] = [];
FILE_SETS["Desktop Cloud"] = [];

type SortMode = "name" | "kind" | "size" | "date";

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "zip:<fileId>/<path>" | "iso:<fileId>/<path>" → parsed parts. */
function parseArchiveLoc(loc: string): { type: "zip" | "iso"; fileId: string; path: string } | null {
  const m = loc.match(/^(zip|iso):([^/]+)(?:\/(.*))?$/);
  if (!m) return null;
  return { type: m[1] as "zip" | "iso", fileId: m[2], path: m[3] ?? "" };
}

const isArchiveLoc = (loc: string): boolean => parseArchiveLoc(loc) !== null;

/** MIME type for archive entry previews (images). */
function mimeOf(name: string): string {
  const mime: Record<string, string> = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
    ".ico": "image/x-icon", ".bmp": "image/bmp",".tiff": "image/tiff",
  };
  return mime[entryExtension(name)] ?? "application/octet-stream";
}

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".bmp"]);

/** Icon key for a file inside an archive (folders + by-extension). */
function archiveIcon(name: string, directory: boolean): string {
  if (directory) return "folder";
  const ext = entryExtension(name);
  if (IMAGE_EXTS.has(ext)) return "image";
  if (ext === ".md") return "book-open";
  if (ext === ".pgn") return "chess";
  if ([".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac"].includes(ext)) return "webamp";
  if (ext === ".zip") return "archive";
  if (ext === ".iso") return "hard-drive";
  if (ext === ".pdf") return "file-text";
  return "file-text";
}

/** A Finder row for an entry inside a mounted zip/iso — read-only, not in
 *  storage, so no custom-file actions (rename/trash/move) apply to it. */
function archiveEntryToFinder(e: ArchiveEntry, archive: FinderFile): FinderFile {
  const name = entryName(e.path);
  return {
    id: `arc:${archive.id}:${e.path}`,
    name,
    kind: e.directory ? "Folder" : entryKind(name),
    icon: archiveIcon(name, e.directory),
    size: e.directory ? "--" : fmtSize(e.bytes.length),
    appId: e.directory ? "folder" : isTextEntry(name) ? "textedit" : "finder",
    archive: true,
    archiveId: archive.id,
    archiveType: archive.archiveType,
    archivePath: e.path,
  };
}

/* ---- per-directory sort + manual arrangement (daedalOS sortOrders) ---- */

interface SortState {
  mode: SortMode;
  ascending: boolean;
}

const SORTS_KEY = "aryanos.finder.sorts";
const ORDER_KEY = "aryanos.finder.order";

/** Default direction per column (name/kind ascend; size/date descend). */
const DEFAULT_ASC: Record<SortMode, boolean> = { name: true, kind: true, size: false, date: false };

type OrderMap = Record<string, string[]>;

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Text content for downloadable plain-text files (custom or known built-ins). */
function textContentOf(file: FinderFile): string | null {
  if (file.custom) {
    const f = readFiles().find((x) => x.id === file.id);
    return f?.content ?? null;
  }
  if (file.name === "README.txt") return README_TEXT;
  if (file.name === "About Me.txt") return RESUME.summary;
  return null;
}

function fileToFinder(f: CustomFile): FinderFile {
  const kind = f.kind;
  // Markdown → Marked viewer, PGN → Chess, audio/playlists/skins → Webamp,
  // archives → opened by Finder itself (zip:/iso: navigation), emulator
  // files → the matching emulator app (daedalOS file associations).
  const icon =
    kind === "Markdown"
      ? "book-open"
      : kind === "PGN Game"
        ? "chess"
        : kind === "Zip Archive"
          ? "archive"
          : kind === "Disk Image" || kind === "Disc Image"
            ? "hard-drive"
            : kind === "Image"
              ? "image"
              : kind === "ROM Game"
                ? "emulator"
                : kind === "Flash Movie"
                  ? "ruffle"
                  : kind === "DOS Game" || kind === "DOS Program"
                    ? "jsdos"                    : WEBAMP_KINDS.has(kind)
                      ? "webamp"
                      : VLC_KINDS.has(kind)
                        ? "film"
                        : FONT_KINDS.has(kind)
                          ? "file-text"
                          : TINYMCE_KINDS.has(kind)
                            ? "file-text"
                            : TIC80_KINDS.has(kind)
                              ? "emulator"
                              : MONACO_KINDS.has(kind)
                                ? "file-text"
                                : "file-text";
  const appId =
    kind === "Markdown"
      ? "markdown"
      : kind === "PGN Game"
        ? "chess"
        : kind === "Zip Archive" || kind === "Disc Image"
          ? "finder"
          : kind === "Image"
            ? "quicklook"
            : kind === "ROM Game"
              ? "emulator"
              : kind === "Flash Movie"
                ? "ruffle"
                : BOXEDWINE_KINDS.has(kind)
                  ? "boxedwine"
                  : V86_KINDS.has(kind)
                    ? "v86"
                    : kind === "DOS Game" || kind === "DOS Program"
                      ? "jsdos"
                      : WEBAMP_KINDS.has(kind)
                        ? "webamp"
                        : VLC_KINDS.has(kind)
                          ? "vlc"
                          : FONT_KINDS.has(kind)
                            ? "opentype"
                            : TINYMCE_KINDS.has(kind)
                              ? "tinymce"
                              : TIC80_KINDS.has(kind)
                                ? "tic80"
                                : MONACO_KINDS.has(kind)
                                  ? "monaco"
                                  : "textedit";
  return {
    id: f.id,
    name: f.name,
    kind,
    icon,
    size: fmtSize(new Blob([f.content]).size),
    appId,
    createdAt: f.createdAt,
    custom: true,
    folderId: f.folderId,
  };
}

function folderToFinder(f: CustomFolder): FinderFile {
  return {
    id: f.id,
    name: f.name,
    kind: "Folder",
    icon: "folder",
    size: "--",
    appId: "folder",
    createdAt: f.createdAt,
    custom: true,
    color: f.color,
    emoji: f.emoji,
    folderId: f.folderId,
  };
}

interface FinderAppProps {
  onOpenApp: (appId: string, src?: string, name?: string, url?: string, content?: string) => void;
  onLaunchpad: () => void;
  onQuickLook: (file: FinderFile) => void;
  /** daedalOS “Set as wallpaper”: images can become the desktop background. */
  onSetWallpaper?: (src: string, name: string) => void;
  /** Open this window at a location (e.g. the Projects folder). */
  initialLocation?: string;
}

/** A working Finder: navigation, search, sort, context menus and a real
 *  (localStorage) file system for user-created folders and documents. */
export default function FinderApp({
  onOpenApp,
  onLaunchpad,
  onQuickLook,
  onSetWallpaper,
  initialLocation,
}: FinderAppProps) {
  const [bump, setBump] = useState(0);
  const customFiles = useMemo(() => readFiles(), [bump]);
  const customFolders = useMemo(() => readFolders(), [bump]);
  const refresh = () => setBump((b) => b + 1);

  // Navigation history — back / forward / up, like a real file browser.
  const [nav, setNav] = useState<{ stack: string[]; index: number }>({
    stack: [initialLocation && FILE_SETS[initialLocation] ? initialLocation : "Recents"],
    index: 0,
  });
  const current = nav.stack[nav.index];
  // daedalOS group selection: shift-click ranges, ⌘/ctrl-click toggles.
  const [selected, setSelected] = useState<string[]>([]);
  const rangeAnchor = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  // Thumbnail (grid) or Details (list) view, like a real Finder.
  const [view, setView] = useState<"grid" | "list">("grid");
  // Editable address bar — type a location and Enter to navigate.
  const [addrEdit, setAddrEdit] = useState<string | null>(null);
  // Per-directory sort (daedalOS sortOrders): mode + direction, persisted.
  const [sorts, setSorts] = useState<Record<string, SortState>>(() =>
    loadJson<Record<string, SortState>>(SORTS_KEY, {}),
  );
  useEffect(() => {
    window.localStorage.setItem(SORTS_KEY, JSON.stringify(sorts));
  }, [sorts]);
  const sort = sorts[current] ?? { mode: "name" as SortMode, ascending: true };
  const sortMode = sort.mode;
  const setSort = (mode: SortMode, forceAscending?: boolean) => {
    setSorts((prev) => {
      const cur = prev[current] ?? { mode: "name" as SortMode, ascending: true };
      const ascending =
        forceAscending ?? (cur.mode === mode ? !cur.ascending : DEFAULT_ASC[mode]);
      return { ...prev, [current]: { mode, ascending } };
    });
    // Sorting replaces any manual arrangement (daedalOS clears iconPositions).
    setOrders((prev) => {
      if (!(current in prev)) return prev;
      const { [current]: _removed, ...rest } = prev;
      return rest;
    });
  };
  // Manual drag-arrange per location, persisted (daedalOS iconPositions).
  const [orders, setOrders] = useState<OrderMap>(() => loadJson<OrderMap>(ORDER_KEY, {}));
  useEffect(() => {
    window.localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  }, [orders]);
  // Live drag state: ids being dragged + the reorder preview + drop target.
  const dragIdsRef = useRef<string[]>([]);
  const orderDraftRef = useRef<string[] | null>(null);
  const [dragIds, setDragIds] = useState<string[] | null>(null);
  const [orderDraft, setOrderDraft] = useState<string[] | null>(null);
  const [dropFolderId, setDropFolderId] = useState<string | null>(null);
  // Parsed zip/iso trees, cached per archive id for instant re-navigation.
  const archiveCache = useRef<Map<string, ArchiveEntry[]>>(new Map());
  const [sortOpen, setSortOpen] = useState(false);
  const [ctx, setCtx] = useState<{ x: number; y: number; file?: FinderFile } | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [info, setInfo] = useState<FinderFile | null>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  // daedalOS clipboard: ⌘C / ⌘X / ⌘V on custom files.
  const clipboardRef = useRef<{ mode: "cut" | "copy"; id: string; name: string } | null>(null);
  const [cutId, setCutId] = useState<string | null>(null);
  const [clipMsg, setClipMsg] = useState<string | null>(null);
  const flashClip = (m: string) => {
    setClipMsg(m);
    window.setTimeout(() => setClipMsg((cur) => (cur === m ? null : cur)), 1700);
  };

  const paste = () => {
    const clip = clipboardRef.current;
    if (!clip) return;
    const folderId = current.startsWith("folder:")
      ? current.slice("folder:".length)
      : undefined;
    if (clip.mode === "cut") {
      // Folders cut+paste as folders; files move into the target folder.
      const isFolder = customFolders.some((f) => f.id === clip.id);
      if (isFolder) moveFolderTo(clip.id, folderId);
      else moveFileToFolder(clip.id, folderId);
      setCutId(null);
      flashClip(`Moved “${clip.name}” here`);
    } else {
      const isFolder = customFolders.some((f) => f.id === clip.id);
      if (isFolder) copyFolderTo(clip.id, folderId);
      else copyFileTo(clip.id, folderId);
      flashClip(`Copied “${clip.name}” here`);
    }
    clipboardRef.current = null;
    refresh();
  };

  // Focus the rename input just after the creating click settles, so the
  // browser's default post-click focus can't steal it (which would fire an
  // immediate blur and drop the rename state). The dependency is the rename
  // TARGET id — keying on the whole `renaming` object would re-run this on
  // every keystroke and re-select the text 40ms later, silently wiping each
  // typed character (the “can't type more than 2-3 letters” bug).
  useEffect(() => {
    if (!renaming) return;
    const t = window.setTimeout(() => {
      renameRef.current?.focus();
      renameRef.current?.select();
    }, 40);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renaming?.id]);

  const go = (loc: string) => {
    if (loc === current) return;
    const stack = nav.stack.slice(0, nav.index + 1);
    stack.push(loc);
    setNav({ stack, index: stack.length - 1 });
    setSelected([]);
    setQuery("");
  };
  const back = () => nav.index > 0 && setNav({ ...nav, index: nav.index - 1 });
  const forward = () =>
    nav.index < nav.stack.length - 1 && setNav({ ...nav, index: nav.index + 1 });
  const up = () => {
    // macOS: Up from inside a folder goes to its PARENT folder (or Documents).
    if (current.startsWith("folder:")) {
      const fid = current.slice("folder:".length);
      const parent = customFolders.find((f) => f.id === fid)?.folderId;
      go(parent ? `folder:${parent}` : "Documents");
    } else {
      const arc = parseArchiveLoc(current);
      if (arc) {
        const parent = arc.path.includes("/")
          ? arc.path.slice(0, arc.path.lastIndexOf("/"))
          : "";
        go(parent ? `${arc.type}:${arc.fileId}/${parent}` : "Documents");
      } else if (current !== "Recents") go("Recents");
    }
  };

  /* ------------------------------ files ------------------------------ */

  // Entries inside a mounted zip/iso — cached so re-navigation is instant.
  const archiveEntriesOf = (file: FinderFile): ArchiveEntry[] => {
    if (!file.archiveId || !file.archiveType) return [];
    const cached = archiveCache.current.get(file.archiveId);
    if (cached) return cached;
    const src = customFiles.find((f) => f.id === file.archiveId);
    if (!src) return [];
    let entries: ArchiveEntry[] = [];
    try {
      const bytes = dataUrlToBytes(src.content);
      entries = file.archiveType === "zip" ? unzipEntries(bytes) : parseIso(bytes);
    } catch {
      entries = [];
    }
    archiveCache.current.set(file.archiveId, entries);
    return entries;
  };

  const base: FinderFile[] = useMemo(() => {
    const arc = parseArchiveLoc(current);
    if (arc) {
      const owner: FinderFile = {
        id: arc.fileId,
        name: "",
        kind: arc.type === "zip" ? "Zip Archive" : "Disk Image",
        icon: arc.type === "zip" ? "archive" : "hard-drive",
        size: "--",
        appId: "finder",
        archiveId: arc.fileId,
        archiveType: arc.type,
      };
      const all = archiveEntriesOf(owner);
      if (!all.length) return [];
      const prefix = arc.path ? `${arc.path}/` : "";
      return all
        .filter((e) => {
          const slash = e.path.lastIndexOf("/");
          const dir = slash === -1 ? "" : e.path.slice(0, slash);
          return dir === arc.path && !e.directory;
        })
        .concat(
          all.filter((e) => {
            const slash = e.path.lastIndexOf("/");
            const dir = slash === -1 ? "" : e.path.slice(0, slash);
            return dir === arc.path && e.directory;
          }),
        )
        .map((e) => archiveEntryToFinder(e, owner));
    }
    const staticSet = FILE_SETS[current] ?? HOME_FILES;
    if (current === "Recents") {
      return [
        ...staticSet,
        ...customFiles.map(fileToFinder),
        ...customFolders.map(folderToFinder),
      ];
    }
    if (current === "Documents") {
      return [
        ...staticSet,
        ...customFolders.filter((f) => !f.folderId).map(folderToFinder),
        ...customFiles.filter((f) => !f.folderId).map(fileToFinder),
      ];
    }
    if (current.startsWith("folder:")) {
      const folderId = current.slice("folder:".length);
      // A folder shows its nested folders AND files (real Finder behavior).
      return [
        ...customFolders.filter((f) => f.folderId === folderId).map(folderToFinder),
        ...customFiles.filter((f) => f.folderId === folderId).map(fileToFinder),
      ];
    }
    return staticSet;
  }, [current, customFiles, customFolders]);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    let list = base.filter((f) => f.name.toLowerCase().includes(q));
    const kindRank: Record<string, number> = {
      Folder: 0,
      Application: 1,
      "PDF Document": 2,
      "Plain Text": 2,
      Markdown: 2,
      "MPEG-4 Movie": 3,
      "Internet Location": 4,
    };
    const sizeVal = (s: string) => {
      const m = s.match(/^([\d.]+) ?(B|KB|MB|GB)?/);
      if (!m) return -1;
      const units: Record<string, number> = { B: 0, KB: 1, MB: 2, GB: 3 };
      return Number(m[1]) * Math.pow(1024, units[m[2] ?? "B"] ?? 0);
    };
    const dir = sort.ascending ? 1 : -1;
    const primary = (a: FinderFile, b: FinderFile): number => {
      if (sortMode === "kind") return (kindRank[a.kind] ?? 9) - (kindRank[b.kind] ?? 9);
      if (sortMode === "size") return sizeVal(a.size) - sizeVal(b.size);
      if (sortMode === "date") {
        const da = a.createdAt ?? "1970-01-01";
        const db = b.createdAt ?? "1970-01-01";
        return da.localeCompare(db);
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    };
    list = [...list].sort((a, b) => {
      const cmp = primary(a, b);
      if (cmp !== 0) return dir * cmp;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
    // A manual arrangement (drag-to-sort) overrides the column order, like
    // daedalOS's persisted icon positions — but not during a search.
    const arranged = orders[current];
    if (arranged && !q) {
      const index = new Map(arranged.map((id, i) => [id, i]));
      list = [...list].sort((a, b) => (index.get(a.id) ?? 9999) - (index.get(b.id) ?? 9999));
    }
    // Live drag preview: the dragged group shifts to the insertion point.
    if (orderDraft && !q) {
      const index = new Map(orderDraft.map((id, i) => [id, i]));
      list = [...list].sort((a, b) => (index.get(a.id) ?? 9999) - (index.get(b.id) ?? 9999));
    }
    return list;
  }, [base, query, sort, sortMode, orders, orderDraft]);

  const selectedFile = visible.find((f) => f.id === selected[selected.length - 1]) ?? null;

  // daedalOS group selection helpers.
  const selectOne = (id: string) => {
    setSelected([id]);
    rangeAnchor.current = visible.findIndex((f) => f.id === id);
  };
  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const rangeSelect = (id: string) => {
    const idx = visible.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const anchor = rangeAnchor.current ?? idx;
    const [lo, hi] = anchor <= idx ? [anchor, idx] : [idx, anchor];
    setSelected(visible.slice(lo, hi + 1).map((f) => f.id));
  };

  const openFile = (file: FinderFile) => {
    // Built-in folders (Projects, Pictures…) are real Finder locations.
    if (file.kind === "Folder" && FILE_SETS[file.name]) {
      go(file.name);
      return;
    }
    if (file.kind === "Folder" && file.custom) {
      go(`folder:${file.id}`);
      return;
    }
    // Custom images (extracted from an archive / dropped) preview via Quick Look.
    if (file.custom && file.kind === "Image") {
      const f = readFiles().find((x) => x.id === file.id);
      if (f?.content.startsWith("data:")) {
        onQuickLook({ ...file, src: f.content });
        return;
      }
    }
    // Entries inside a mounted zip/iso — folders navigate, text opens in
    // TextEdit, images preview via Quick Look (daedalOS mounts archives).
    if (file.archive) {
      if (file.kind === "Folder") {
        go(`${current}/${file.name}`);
        return;
      }
      const entry = file.archiveId
        ? archiveCache.current.get(file.archiveId)?.find((e) => e.path === file.archivePath)
        : undefined;
      if (entry && entry.bytes.length) {
        if (isTextEntry(file.name)) {
          onOpenApp("textedit", undefined, file.name, undefined, bytesToStr(entry.bytes));
          return;
        }
        if (IMAGE_EXTS.has(entryExtension(file.name))) {
          onQuickLook({
            ...file,
            kind: "Image",
            src: bytesToDataUrl(entry.bytes, mimeOf(file.name)),
            size: fmtSize(entry.bytes.length),
          });
          return;
        }
      }
      return;
    }
    onOpenApp(file.appId, file.src, file.name, file.url);
  };

  /* --------------------------- context menu --------------------------- */

  const menuNewFolder = () => {
    // macOS: New Folder creates in the CURRENT location — the folder you're
    // inside, or Documents when browsing a top-level location.
    const inFolder = current.startsWith("folder:");
    const folderId = inFolder ? current.slice("folder:".length) : undefined;
    const folder = addFolder("untitled folder", folderId);
    originalNameRef.current = folder.name;
    refresh();
    // Only land on Documents when we weren't already inside a folder.
    if (!inFolder && current !== "Documents") go("Documents");
    setCtx(null);
    setRenaming({ id: folder.id, name: folder.name });
  };

  const menuNewDoc = () => {
    const inFolder = current.startsWith("folder:");
    const folderId = inFolder ? current.slice("folder:".length) : undefined;
    const file = addFile("untitled.txt", "", folderId);
    originalNameRef.current = file.name;
    refresh();
    // New files land in the current folder (or Documents when at a location).
    if (!inFolder && current !== "Documents") go("Documents");
    setCtx(null);
    setRenaming({ id: file.id, name: file.name });
  };

  const menuRename = (file: FinderFile) => {
    setCtx(null);
    originalNameRef.current = file.name;
    setRenaming({ id: file.id, name: file.name });
  };

  const menuDelete = (file: FinderFile) => {
    setCtx(null);
    if (file.custom) {
      if (file.kind === "Folder") deleteFolder(file.id);
      else deleteFile(file.id);
      refresh();
      setSelected((s) => s.filter((x) => x !== file.id));
    }
  };

  // Group delete: trash every selected custom item at once (daedalOS).
  const menuDeleteMany = () => {
    setCtx(null);
    selected.forEach((id) => {
      const f = visible.find((x) => x.id === id);
      if (!f?.custom) return;
      if (f.kind === "Folder") deleteFolder(id);
      else deleteFile(id);
    });
    refresh();
    setSelected([]);
  };

  const menuDownload = (file: FinderFile) => {
    setCtx(null);
    if (file.custom) {
      // Binary custom files are stored as data: URLs — download the bytes.
      const f = readFiles().find((x) => x.id === file.id);
      if (f?.content.startsWith("data:")) downloadUrl(f.content, file.name);
      else if (f) downloadText(file.name, f.content);
      return;
    }
    const content = textContentOf(file);
    if (content !== null) {
      downloadText(file.name, content);
    } else if (file.src) {
      downloadUrl(file.src, file.name);
    }
  };

  // daedalOS Extract: materialize a zip/iso into a real folder of files.
  const menuExtract = async (file: FinderFile) => {
    setCtx(null);
    // 7z / tar / gz / xz / bz2 / rar — extract straight from the stored
    // bytes via the 7-Zip WASM engine (ported from daedalOS).
    if (file.kind === "Archive" && file.custom) {
      const src = customFiles.find((f) => f.id === file.id);
      if (!src) return;
      let files: Record<string, Uint8Array> = {};
      try {
        files = await unarchive(src.name, dataUrlToBytes(src.content));
      } catch {
        flashClip("Extract failed — is the archive valid?");
        return;
      }
      const folder = addFolder(src.name.replace(/\.[^.]+$/, ""));
      let count = 0;
      for (const [path, bytes] of Object.entries(files)) {
        const base = path.split("/").pop() || path;
        addFile(
          base,
          isTextEntry(base) ? bytesToStr(bytes) : bytesToDataUrl(bytes, mimeOf(base)),
          folder.id,
        );
        count++;
      }
      flashClip(`Extracted ${count} file${count === 1 ? "" : "s"} into “${folder.name}”`);
      refresh();
      go(`folder:${folder.id}`);
      return;
    }
    const entries = file.archiveId ? archiveCache.current.get(file.archiveId) : undefined;
    if (!entries?.length) return;
    const folder = addFolder(file.name.replace(/\.(zip|iso)$/i, ""));
    // Colliding basenames get a parent-path prefix so nothing is lost.
    const byName = new Map<string, ArchiveEntry[]>();
    for (const e of entries) {
      if (e.directory) continue;
      const base = entryName(e.path);
      if (!byName.has(base)) byName.set(base, []);
      byName.get(base)!.push(e);
    }
    for (const [base, group] of byName) {
      const display =
        group.length > 1
          ? `${group[0].path.split("/").slice(0, -1).join(" › ") || "root"} — ${base}`
          : base;
      const bytes = group[0].bytes;
      addFile(
        display,
        isTextEntry(base) ? bytesToStr(bytes) : bytesToDataUrl(bytes, mimeOf(base)),
        folder.id,
      );
    }
    flashClip(`Extracted ${byName.size} file${byName.size === 1 ? "" : "s"} into “${folder.name}”`);
    refresh();
    go(`folder:${folder.id}`);
  };

  // daedalOS Add to archive: pack the selection into a .zip in this folder.
  const menuAddToArchive = () => {
    setCtx(null);
    const targets = visible.filter((f) => selected.includes(f.id) && f.custom);
    if (!targets.length) return;
    const entries: ArchiveEntry[] = [];
    const addCustom = (cf: CustomFile, prefix: string) => {
      const path = prefix ? `${prefix}/${cf.name}` : cf.name;
      entries.push({
        path,
        directory: false,
        bytes:
          BINARY_KINDS.has(cf.kind) || cf.content.startsWith("data:")
            ? dataUrlToBytes(cf.content)
            : strToBytes(cf.content),
      });
    };
    const addFolderRec = (folder: CustomFolder, prefix: string) => {
      const path = prefix ? `${prefix}/${folder.name}` : folder.name;
      entries.push({ path, directory: true, bytes: new Uint8Array(0) });
      customFiles
        .filter((cf) => cf.folderId === folder.id)
        .forEach((cf) => addCustom(cf, path));
    };
    targets.forEach((file) => {
      if (file.kind === "Folder" && file.custom) {
        const folder = customFolders.find((f) => f.id === file.id);
        if (folder) addFolderRec(folder, "");
      } else {
        const cf = customFiles.find((f) => f.id === file.id);
        if (cf) addCustom(cf, "");
      }
    });
    const label = currentLabel(current, customFolders) || "Archive";
    const folderId = current.startsWith("folder:")
      ? current.slice("folder:".length)
      : undefined;
    addFile(`${label}.zip`, bytesToDataUrl(zipEntries(entries), "application/zip"), folderId);
    flashClip(`Added ${targets.length} item${targets.length > 1 ? "s" : ""} to “${label}.zip”`);
    refresh();
  };

  // The root container must be focusable so keyboard shortcuts keep routing
  // through the Finder after a rename input unmounts (Escape/Enter) —
  // otherwise focus falls to <body> and F5/Delete/arrows hit the browser.
  const rootRef = useRef<HTMLDivElement>(null);
  const refocusRoot = () => {
    window.setTimeout(() => rootRef.current?.focus(), 0);
  };

  // Remember the name at the start of a rename, so blur-without-change is a
  // no-op instead of a silent rename.
  const originalNameRef = useRef<string | null>(null);

  const commitRename = () => {
    if (!renaming) return;
    const name = renaming.name.trim();
    // Skip the no-op commit (blur with the name unchanged) but always clear
    // the editing state.
    if (name && name !== originalNameRef.current) {
      const isFolder = customFolders.some((f) => f.id === renaming.id);
      if (isFolder) renameFolder(renaming.id, name);
      else renameFile(renaming.id, name);
      refresh();
    }
    setRenaming(null);
    refocusRoot();
  };

  /* ----------------------------- keyboard ----------------------------- */

  // daedalOS arrow navigation: probe the grid with elementFromPoint so the
  // selection follows the actual on-screen layout (works in grid AND list).
  const selectByArrow = (e: React.KeyboardEvent) => {
    if (!visible.length) return;
    e.preventDefault();
    const dir = e.key as "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
    const from = selected.length
      ? visible.findIndex((f) => f.id === selected[selected.length - 1])
      : -1;
    if (from === -1) {
      setSelected([visible[0].id]); // nothing selected → start at the first
      return;
    }
    const fromFile = visible[from];
    const targetEl = document.querySelector<HTMLElement>(
      `[data-finder-id="${CSS.escape(fromFile.id)}"]`,
    );
    if (!targetEl) return;
    const { x, y, width, height } = targetEl.getBoundingClientRect();
    const probe =
      dir === "ArrowUp" || dir === "ArrowDown"
        ? [x + width / 2, y + height / 2 + (dir === "ArrowUp" ? -height : height)]
        : [x + width / 2 + (dir === "ArrowLeft" ? -width : width), y + height / 2];
    const hit = document.elementFromPoint(probe[0], probe[1]);
    const row = hit?.closest<HTMLElement>("[data-finder-id]");
    const nextId = row?.dataset.finderId;
    if (!nextId) return; // edge of the grid
    if (e.shiftKey) {
      // Shift+arrow extends the selection from the anchor to the target.
      const anchor = visible.findIndex((f) => f.id === selected[0]);
      const to = visible.findIndex((f) => f.id === nextId);
      if (to === -1) return;
      const lo = Math.min(anchor === -1 ? from : anchor, to);
      const hi = Math.max(anchor === -1 ? from : anchor, to);
      setSelected(visible.slice(lo, hi + 1).map((f) => f.id));
    } else {
      setSelected([nextId]);
    }
    row.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Esc with a menu open closes the menu (macOS) — and must NOT fall
    // through to the desktop's global Esc (which would quit the machine).
    if (e.key === "Escape" && (ctx || sortOpen)) {
      e.stopPropagation();
      setCtx(null);
      setSortOpen(false);
      return;
    }
    // F5 / ⌘R refresh — prevent the browser's default reload even when the
    // focus is inside a Finder input (otherwise pressing F5 nukes the page).
    if (e.key === "F5" || (e.metaKey && e.key.toLowerCase() === "r")) {
      e.preventDefault();
      refresh();
      return;
    }
    const t = e.target as HTMLElement;
    if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
    if (e.key === " " && selectedFile) {
      e.preventDefault();
      onQuickLook(selectedFile);
    } else if (e.key === "Enter" && selectedFile) {
      e.preventDefault();
      openFile(selectedFile);
    } else if (e.key.startsWith("Arrow")) {
      selectByArrow(e);
    } else if (e.key === "Delete" && selected.length) {
      e.preventDefault();
      const anyCustom = selected.some(
        (id) => visible.find((f) => f.id === id)?.custom,
      );
      if (anyCustom) menuDeleteMany();
    } else if (e.key.toLowerCase() === "f2" && selectedFile && selectedFile.custom) {
      e.preventDefault();
      menuRename(selectedFile);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      back();
    } else if (e.metaKey && e.key.toLowerCase() === "i" && selectedFile) {
      e.preventDefault();
      setInfo(selectedFile);
    } else if (e.metaKey && e.key.toLowerCase() === "c" && selectedFile?.custom) {
      e.preventDefault();
      clipboardRef.current = { mode: "copy", id: selectedFile.id, name: selectedFile.name };
      setCutId(null);
      flashClip(`Copied “${selectedFile.name}”`);
    } else if (e.metaKey && e.key.toLowerCase() === "x" && selectedFile?.custom) {
      e.preventDefault();
      clipboardRef.current = { mode: "cut", id: selectedFile.id, name: selectedFile.name };
      setCutId(selectedFile.id);
      flashClip(`Cut “${selectedFile.name}”`);
    } else if (e.metaKey && e.key.toLowerCase() === "v" && clipboardRef.current) {
      e.preventDefault();
      paste();
    } else if (e.metaKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setSelected(visible.map((f) => f.id));
    }
  };

  /* --------------------------- drag to arrange --------------------------- */

  // Only the file grid can be manually arranged (never archives or searches).
  const canArrange = !isArchiveLoc(current) && !query;

  const onDragStartItem = (file: FinderFile, e: React.DragEvent) => {
    if (!canArrange) {
      e.preventDefault();
      return;
    }
    const ids = selected.includes(file.id) ? [...selected] : [file.id];
    dragIdsRef.current = ids;
    setDragIds(ids);
    setDropFolderId(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", file.id);
  };

  const onDragOverItem = (file: FinderFile, e: React.DragEvent) => {
    if (!dragIdsRef.current.length) return;
    e.preventDefault();
    e.stopPropagation();
    if (file.kind === "Folder" && file.custom) {
      setDropFolderId(file.id);
      return;
    }
    setDropFolderId(null);
    const ids = visible.map((f) => f.id);
    const moving = new Set(dragIdsRef.current);
    const rest = ids.filter((id) => !moving.has(id));
    const targetIdx = rest.indexOf(file.id);
    if (targetIdx < 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    const insert = targetIdx + (after ? 1 : 0);
    const movingIds = ids.filter((id) => moving.has(id));
    const draft = [...rest.slice(0, insert), ...movingIds, ...rest.slice(insert)];
    orderDraftRef.current = draft;
    setOrderDraft((prev) => (prev && prev.join("|") === draft.join("|") ? prev : draft));
  };

  const onDropItem = (file: FinderFile, e: React.DragEvent) => {
    if (!dragIdsRef.current.length) return;
    e.preventDefault();
    e.stopPropagation();
    const ids = dragIdsRef.current;
    if (file.kind === "Folder" && file.custom) {
      let moved = 0;
      ids.forEach((id) => {
        if (id === file.id) return;
        const f = visible.find((x) => x.id === id);
        if (!f?.custom) return;
        if (f.kind === "Folder") moveFolderTo(id, file.id);
        else moveFileToFolder(id, file.id);
        moved += 1;
      });
      if (moved) flashClip(`Moved ${moved} item${moved > 1 ? "s" : ""} into “${file.name}”`);
      refresh();
    } else if (orderDraftRef.current) {
      setOrders((prev) => ({ ...prev, [current]: orderDraftRef.current! }));
      flashClip("Rearranged");
    }
    dragIdsRef.current = [];
    orderDraftRef.current = null;
    setDragIds(null);
    setOrderDraft(null);
    setDropFolderId(null);
  };

  const clearDrag = () => {
    dragIdsRef.current = [];
    orderDraftRef.current = null;
    setDragIds(null);
    setOrderDraft(null);
    setDropFolderId(null);
  };

  const onDragOverBackground = (e: React.DragEvent) => {
    if (dragIdsRef.current.length) e.preventDefault();
  };
  const onDropBackground = (e: React.DragEvent) => {
    if (!dragIdsRef.current.length) return;
    e.preventDefault();
    clearDrag();
  };

  /* ------------------------------ render ------------------------------ */

  const openSidebar = (item: string) => {
    if (item === "Applications") {
      onLaunchpad();
      return;
    }
    go(item);
  };

  const sortLabel =
    sortMode === "kind" ? "Kind" : sortMode === "size" ? "Size" : sortMode === "date" ? "Date Modified" : "Name";

  // The archive owning the current zip:/iso: view (for the banner + extract).
  const archiveOwner = useMemo(() => {
    const arc = parseArchiveLoc(current);
    if (!arc) return null;
    const src = customFiles.find((f) => f.id === arc.fileId);
    if (!src) return null;
    return {
      ...src,
      kind: arc.type === "zip" ? "Zip Archive" : "Disk Image",
      icon: arc.type === "zip" ? "archive" : "hard-drive",
      size: "--",
      appId: "finder",
      archiveId: src.id,
      archiveType: arc.type,
    } as FinderFile;
  }, [current, customFiles]);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      className={styles.finder}
      data-app="finder"
      onKeyDown={onKeyDown}
    >
      {/* toolbar */}
      <div className={styles.finderToolbar}>
        <span className={styles.finderNav}>
          <button
            type="button"
            className={styles.finderNavBtn}
            aria-label="Back"
            onClick={back}
            style={{ opacity: nav.index > 0 ? 1 : 0.35 }}
          >
            <ChevronLeft size={17} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={styles.finderNavBtn}
            aria-label="Forward"
            onClick={forward}
            style={{ opacity: nav.index < nav.stack.length - 1 ? 1 : 0.35 }}
          >
            <ChevronRight size={17} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={styles.finderNavBtn}
            aria-label="Up one level"
            onClick={up}
            style={{ opacity: current !== "Recents" ? 1 : 0.35 }}
          >
            <ArrowUp size={15} strokeWidth={2} />
          </button>
        </span>
        {addrEdit !== null ? (
          <input
            autoFocus
            className={styles.finderAddrInput}
            value={addrEdit}
            onChange={(e) => setAddrEdit(e.target.value)}
            onBlur={() => setAddrEdit(null)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                const target = addrEdit.trim().split("/").filter(Boolean).join("/");
                const known = [...FAVOURITES, ...LOCATIONS, ...customFolders.map((f) => f.name)]
                  .find((loc) => loc.toLowerCase() === target.toLowerCase());
                if (known) {
                  const loc = customFolders.some((f) => f.name === known)
                    ? `folder:${customFolders.find((f) => f.name === known)!.id}`
                    : known;
                  go(loc);
                }
                setAddrEdit(null);
              }
              if (e.key === "Escape") setAddrEdit(null);
            }}
            aria-label="Address"
          />
        ) : (
          <button
            type="button"
            className={styles.finderTitle}
            onClick={() => setAddrEdit(currentLabel(current, customFolders, customFiles))}
            title="Click to type a location (e.g. Documents, Downloads)"
          >
            {currentLabel(current, customFolders, customFiles)}
          </button>
        )}
        <span className={styles.finderToolbarRight}>
          <button
            type="button"
            className={styles.finderToolbarBtn}
            onClick={menuNewFolder}
            title="New Folder"
          >
            <FolderPlus size={13} /> New Folder
          </button>
          <button
            type="button"
            className={styles.finderToolbarBtn}
            onClick={menuNewDoc}
            title="New Text Document"
          >
            <FilePlus2 size={13} /> New Document
          </button>
          {/* Move to Trash — a visible delete for selected custom items,
              exactly like Finder's toolbar trash. Disabled until something
              deletable is selected. */}
          <button
            type="button"
            className={`${styles.finderToolbarBtn} ${styles.finderTrashBtn}`}
            onClick={menuDeleteMany}
            title="Move to Trash"
            disabled={
              selected.length === 0 ||
              !selected.some((id) => visible.find((x) => x.id === id)?.custom)
            }
          >
            <Trash2 size={13} /> Move to Trash
          </button>
          <div className={styles.finderSortWrap}>
            <button
              type="button"
              className={styles.finderSortBtn}
              onClick={() => setSortOpen((o) => !o)}
            >
              {sortLabel} {sort.ascending ? "↑" : "↓"} <ChevronDown size={12} />
            </button>
            {sortOpen && (
              <>
                <div
                  className={styles.finderCtxBackdrop}
                  onClick={() => setSortOpen(false)}
                />
                <div className={styles.finderSortMenu}>
                  {(["name", "kind", "size", "date"] as SortMode[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.finderCtxItem} ${
                        sortMode === s ? styles.finderCtxItemActive : ""
                      }`}
                      onClick={() => {
                        setSort(s);
                        setSortOpen(false);
                      }}
                    >
                      {s === "name" ? "Name" : s === "kind" ? "Kind" : s === "size" ? "Size" : "Date Modified"}
                    </button>
                  ))}
                  <div className={styles.finderCtxSep} />
                  <button
                    type="button"
                    className={`${styles.finderCtxItem} ${
                      sort.ascending ? styles.finderCtxItemActive : ""
                    }`}
                    onClick={() => {
                      setSort(sortMode, true);
                      setSortOpen(false);
                    }}
                  >
                    Ascending
                  </button>
                  <button
                    type="button"
                    className={`${styles.finderCtxItem} ${
                      !sort.ascending ? styles.finderCtxItemActive : ""
                    }`}
                    onClick={() => {
                      setSort(sortMode, false);
                      setSortOpen(false);
                    }}
                  >
                    Descending
                  </button>
                  {orders[current] && (
                    <button
                      type="button"
                      className={styles.finderCtxItem}
                      onClick={() => {
                        setOrders((prev) => {
                          const { [current]: _removed, ...rest } = prev;
                          return rest;
                        });
                        setSortOpen(false);
                      }}
                    >
                      Clear Custom Order
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
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
          <span className={styles.finderViewToggle} role="group" aria-label="View">
            <button
              type="button"
              className={`${styles.finderViewBtn} ${
                view === "grid" ? styles.finderViewBtnActive : ""
              }`}
              onClick={() => setView("grid")}
              aria-label="Icon view"
            >
              <LayoutGrid size={14} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              className={`${styles.finderViewBtn} ${
                view === "list" ? styles.finderViewBtnActive : ""
              }`}
              onClick={() => setView("list")}
              aria-label="List view"
            >
              <List size={14} strokeWidth={1.8} />
            </button>
          </span>
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
                current === item ? styles.finderSidebarItemActive : ""
              }`}
              onClick={() => openSidebar(item)}
            >
              <span className={styles.finderSidebarIcon} aria-hidden>
                {SIDEBAR_ICONS[item]}
              </span>
              {item}
            </button>
          ))}
          {customFolders.length > 0 && (
            <>
              <div className={styles.finderSection}>Folders</div>
              {customFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`${styles.finderSidebarItem} ${
                    current === `folder:${f.id}` ? styles.finderSidebarItemActive : ""
                  }`}
                  onClick={() => go(`folder:${f.id}`)}
                >
                  <span className={styles.finderSidebarIcon} aria-hidden>
                    <Folder size={13} />
                  </span>
                  {f.name}
                </button>
              ))}
            </>
          )}
          <div className={styles.finderSection}>Locations</div>
          {LOCATIONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`${styles.finderSidebarItem} ${
                current === item ? styles.finderSidebarItemActive : ""
              }`}
              onClick={() => go(item)}
            >
              <span className={styles.finderSidebarIcon} aria-hidden>
                {SIDEBAR_ICONS[item]}
              </span>
              {item}
            </button>
          ))}
        </aside>

        {/* file grid */}
        <div
          className={`${styles.finderFiles} ${
            view === "list" ? styles.finderFilesList : ""
          }`}
          onContextMenu={(e) => {
            e.preventDefault();
            setCtx({ x: e.clientX, y: e.clientY });
          }}
          onClick={() => {
            setSelected([]);
            setInfo(null);
          }}
          onDragOver={onDragOverBackground}
          onDrop={onDropBackground}
        >
          {archiveOwner && (
            <div className={styles.finderArchiveBanner}>
              <Archive size={14} />
              <span>
                Inside <strong>{archiveOwner.name}</strong> — read-only archive
                contents. Extract to a real folder to edit.
              </span>
              <button
                type="button"
                className={styles.finderArchiveBtn}
                onClick={() => menuExtract(archiveOwner)}
              >
                <PackageOpen size={12} /> Extract Here
              </button>
            </div>
          )}
          {visible.length === 0 && (
            <div className={styles.finderEmpty}>
              {query ? `No results for “${query}”` : "This folder is empty."}
            </div>
          )}
          {view === "grid" ? (
            visible.map((file) => {
              const app = DESKTOP_APPS.find((a) => a.id === file.appId);
              const isRenaming = renaming?.id === file.id;
              return (
                <button
                  key={file.id}
                  type="button"
                  data-finder-id={file.id}
                  draggable={canArrange && !file.archive}
                  className={`${styles.finderFile} ${
                    selected.includes(file.id) ? styles.finderFileSelected : ""
                  } ${cutId === file.id ? styles.finderFileCut : ""} ${
                    dragIds?.includes(file.id) ? styles.finderFileDragging : ""
                  } ${dropFolderId === file.id ? styles.finderDropTarget : ""}`}
                  title={`${file.name} — ${file.kind} · ${file.size}${
                    file.createdAt
                      ? ` · ${new Date(file.createdAt).toLocaleDateString()}`
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Touch devices can't double-click — a single tap opens.
                    if (
                      typeof window !== "undefined" &&
                      window.matchMedia("(hover: none)").matches
                    ) {
                      openFile(file);
                    } else if (e.shiftKey) {
                      rangeSelect(file.id);
                    } else if (e.metaKey || e.ctrlKey) {
                      toggleSelect(file.id);
                    } else {
                      selectOne(file.id);
                    }
                  }}
                  onDoubleClick={() => openFile(file)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!selected.includes(file.id)) selectOne(file.id);
                    setCtx({ x: e.clientX, y: e.clientY, file });
                  }}
                  onDragStart={(e) => onDragStartItem(file, e)}
                  onDragOver={(e) => onDragOverItem(file, e)}
                  onDrop={(e) => onDropItem(file, e)}
                  onDragEnd={clearDrag}
                >
                  {file.custom && file.kind === "Folder" ? (
                    <FolderIcon size={40} color={file.color} emoji={file.emoji} />
                  ) : (file.custom || file.archive) && file.icon ? (
                    <Glyph id={file.icon} size={40} />
                  ) : app && file.kind !== "Folder" ? (
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
                  {isRenaming ? (
                    <input
                      ref={renameRef}
                      className={styles.finderRenameInput}
                      value={renaming.name}
                      onChange={(e) =>
                        setRenaming({ id: renaming.id, name: e.target.value })
                      }
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        // Commit only on an explicit Enter — a stray blur can
                        // never drop the rename state mid-edit.
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") {
                          setRenaming(null);
                          refocusRoot();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Rename file"
                    />
                  ) : (
                    <>
                      <span className={styles.finderFileName}>{file.name}</span>
                      <span className={styles.finderFileMeta}>
                        {file.kind} · {file.size}
                      </span>
                    </>
                  )}
                </button>
              );
            })
          ) : (
            <div className={styles.finderList}>
              <div className={styles.finderListHead}>
                {(
                  [
                    ["name", "Name", "left"],
                    ["kind", "Kind", "left"],
                    ["size", "Size", "right"],
                    ["date", "Date Modified", "right"],
                  ] as const
                ).map(([mode, label, align]) => (
                  <button
                    key={mode}
                    type="button"
                    className={`${styles.finderListHeadCell} ${
                      align === "right" ? styles.finderListHeadRight : ""
                    } ${sortMode === mode ? styles.finderListHeadActive : ""}`}
                    onClick={() => setSort(mode)}
                  >
                    {label}
                    {sortMode === mode ? (
                      <span className={styles.finderListHeadDir}>
                        {sort.ascending ? "↑" : "↓"}
                      </span>
                    ) : (
                      <ArrowUpDown size={10} strokeWidth={2} />
                    )}
                  </button>
                ))}
              </div>
              {visible.map((file) => {
                const app = DESKTOP_APPS.find((a) => a.id === file.appId);
                const isRenaming = renaming?.id === file.id;
                return (
                  <div
                    key={file.id}
                    role="button"
                    tabIndex={0}
                    data-finder-id={file.id}
                    draggable={canArrange && !file.archive}
                    className={`${styles.finderListRow} ${
                      selected.includes(file.id) ? styles.finderFileSelected : ""
                    } ${cutId === file.id ? styles.finderFileCut : ""} ${
                      dragIds?.includes(file.id) ? styles.finderFileDragging : ""
                    } ${dropFolderId === file.id ? styles.finderDropTarget : ""}`}
                    title={`${file.name} — ${file.kind} · ${file.size}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (e.shiftKey) rangeSelect(file.id);
                      else if (e.metaKey || e.ctrlKey) toggleSelect(file.id);
                      else selectOne(file.id);
                    }}
                    onDoubleClick={() => openFile(file)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openFile(file);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!selected.includes(file.id)) selectOne(file.id);
                      setCtx({ x: e.clientX, y: e.clientY, file });
                    }}
                    onDragStart={(e) => onDragStartItem(file, e)}
                    onDragOver={(e) => onDragOverItem(file, e)}
                    onDrop={(e) => onDropItem(file, e)}
                    onDragEnd={clearDrag}
                  >
                    <span className={styles.finderListName}>
                      {file.custom && file.kind === "Folder" ? (
                        <FolderIcon size={18} color={file.color} emoji={file.emoji} />
                      ) : (file.custom || file.archive) && file.icon ? (
                        <Glyph id={file.icon} size={18} />
                      ) : app && file.kind !== "Folder" ? (
                        <AppIcon app={app} size={18} />
                      ) : (
                        <img
                          src="/aryan/icons/folder.png"
                          alt=""
                          width={18}
                          height={18}
                          draggable={false}
                          className={styles.finderFileIcon}
                        />
                      )}
                      {isRenaming ? (
                        <input
                          ref={renameRef}
                          className={styles.finderRenameInput}
                          value={renaming.name}
                          onChange={(e) =>
                            setRenaming({ id: renaming.id, name: e.target.value })
                          }
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") {
                              setRenaming(null);
                              refocusRoot();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Rename file"
                        />
                      ) : (
                        <span className={styles.finderListFileName}>{file.name}</span>
                      )}
                    </span>
                    <span className={styles.finderListCell}>{file.kind}</span>
                    <span className={`${styles.finderListCell} ${styles.finderListCellRight}`}>
                      {file.size}
                    </span>
                    <span className={`${styles.finderListCell} ${styles.finderListCellRight}`}>
                      {file.createdAt
                        ? new Date(file.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Get Info panel */}
        {info && (
          <div className={styles.finderInfo}>
            <div className={styles.finderInfoHead}>
              <strong>Get Info</strong>
              <button
                type="button"
                className={styles.finderInfoClose}
                onClick={() => setInfo(null)}
                aria-label="Close info"
              >
                <X size={13} />
              </button>
            </div>
            <div className={styles.finderInfoThumb}>
              {info.kind === "Folder" ? (
                <FolderIcon size={56} color={info.color} emoji={info.emoji} />
              ) : (
                <AppIcon
                  app={DESKTOP_APPS.find((a) => a.id === info.appId) ?? DESKTOP_APPS[0]}
                  size={56}
                />
              )}
            </div>
            <div className={styles.finderInfoRow}>
              <span className={styles.finderInfoLabel}>Name</span>
              <span className={styles.finderInfoValue}>{info.name}</span>
            </div>
            <div className={styles.finderInfoRow}>
              <span className={styles.finderInfoLabel}>Kind</span>
              <span className={styles.finderInfoValue}>{info.kind}</span>
            </div>
            <div className={styles.finderInfoRow}>
              <span className={styles.finderInfoLabel}>Size</span>
              <span className={styles.finderInfoValue}>{info.size}</span>
            </div>
            <div className={styles.finderInfoRow}>
              <span className={styles.finderInfoLabel}>Created</span>
              <span className={styles.finderInfoValue}>
                {info.createdAt
                  ? new Date(info.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </span>
            </div>
            <div className={styles.finderInfoRow}>
              <span className={styles.finderInfoLabel}>Where</span>
              <span className={styles.finderInfoValue}>
                {current.startsWith("folder:") ? "Documents" : current}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* context menu — portaled to <body>: the window's transform would
          otherwise make this fixed menu land offset from the cursor */}
      {ctx &&
        createPortal(
          <>
          <div
            className={styles.finderCtxBackdrop}
            onClick={() => setCtx(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setCtx(null);
            }}
          />
          <div
            className={styles.finderCtx}
            style={{
              left: Math.min(ctx.x, (typeof window !== "undefined" ? window.innerWidth : 1000) - 220),
              top: Math.min(ctx.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 220),
            }}
          >
            {ctx.file && selected.length > 1 && ctx.file.custom ? (
              <>
                <button
                  type="button"
                  className={`${styles.finderCtxItem} ${styles.finderCtxDanger}`}
                  onClick={menuDeleteMany}
                >
                  <Trash2 size={12} /> Move {selected.length} Items to Trash
                </button>
                <div className={styles.finderCtxSep} />
                <button type="button" className={styles.finderCtxItem} onClick={menuAddToArchive}>
                  <Archive size={12} /> Add {selected.length} Items to Archive…
                </button>
                <div className={styles.finderCtxSep} />
                <button
                  type="button"
                  className={styles.finderCtxItem}
                  onClick={() => setCtx(null)}
                >
                  <Info size={12} /> Get Info on {selected.length} Items
                </button>
              </>
            ) : ctx.file ? (
              <>
                <button type="button" className={styles.finderCtxItem} onClick={() => { setCtx(null); openFile(ctx.file!); }}>
                  Open
                </button>
                {ctx.file.kind !== "Folder" && (
                  <button
                    type="button"
                    className={styles.finderCtxItem}
                    onClick={() => { setCtx(null); onQuickLook(ctx.file!); }}
                  >
                    Quick Look
                  </button>
                )}
                <div className={styles.finderCtxSep} />
                {ctx.file.custom && (
                  <>
                    <button type="button" className={styles.finderCtxItem} onClick={() => menuRename(ctx.file!)}>
                      <Pencil size={12} /> Rename
                    </button>
                    <button
                      type="button"
                      className={`${styles.finderCtxItem} ${styles.finderCtxDanger}`}
                      onClick={() => menuDelete(ctx.file!)}
                    >
                      <Trash2 size={12} /> Move to Trash
                    </button>
                    <div className={styles.finderCtxSep} />
                    {(ctx.file.kind === "Zip Archive" || ctx.file.kind === "Disk Image" || ctx.file.kind === "Disc Image" || ctx.file.kind === "Archive") && (
                      <button type="button" className={styles.finderCtxItem} onClick={() => menuExtract(ctx.file!)}>
                        <PackageOpen size={12} /> Extract Here
                      </button>
                    )}
                    <button type="button" className={styles.finderCtxItem} onClick={menuAddToArchive}>
                      <Archive size={12} /> Add to Archive…
                    </button>
                    <div className={styles.finderCtxSep} />
                  </>
                )}
                {(textContentOf(ctx.file) !== null || ctx.file.src) && (
                  <button type="button" className={styles.finderCtxItem} onClick={() => menuDownload(ctx.file!)}>
                    <Download size={12} /> Download
                  </button>
                )}
                {ctx.file.kind === "Image" && ctx.file.src && onSetWallpaper && (
                  <button
                    type="button"
                    className={styles.finderCtxItem}
                    onClick={() => {
                      onSetWallpaper(ctx.file!.src!, ctx.file!.name);
                      setCtx(null);
                    }}
                  >
                    <Wallpaper size={12} /> Set as Wallpaper
                  </button>
                )}
                <button
                  type="button"
                  className={styles.finderCtxItem}
                  onClick={() => { setInfo(ctx.file ?? null); setCtx(null); }}
                >
                  <Info size={12} /> Get Info
                </button>
              </>
            ) : (
              <>
                <button type="button" className={styles.finderCtxItem} onClick={menuNewFolder}>
                  <FolderPlus size={12} /> New Folder
                </button>
                <button type="button" className={styles.finderCtxItem} onClick={menuNewDoc}>
                  <FilePlus2 size={12} /> New Text Document
                </button>
                {clipboardRef.current && (
                  <>
                    <div className={styles.finderCtxSep} />
                    <button type="button" className={styles.finderCtxItem} onClick={() => { setCtx(null); paste(); }}>
                      <Clipboard size={12} /> Paste
                    </button>
                  </>
                )}
                <div className={styles.finderCtxSep} />
                <button
                  type="button"
                  className={styles.finderCtxItem}
                  onClick={() => {
                    setCtx(null);
                    onOpenApp("terminal");
                  }}
                >
                  <TerminalSquare size={12} /> Open Terminal Here
                </button>
                <div className={styles.finderCtxSep} />
                <span className={styles.finderCtxLabel}>Sort By</span>
                {(["name", "kind", "size", "date"] as SortMode[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.finderCtxItem} ${
                      sortMode === s ? styles.finderCtxItemActive : ""
                    }`}
                    onClick={() => {
                      setSort(s);
                      setCtx(null);
                    }}
                  >
                    {s === "name" ? "Name" : s === "kind" ? "Kind" : s === "size" ? "Size" : "Date Modified"}
                  </button>
                ))}
                <div className={styles.finderCtxSep} />
                <button
                  type="button"
                  className={`${styles.finderCtxItem} ${
                    sort.ascending ? styles.finderCtxItemActive : ""
                  }`}
                  onClick={() => {
                    setSort(sortMode, true);
                    setCtx(null);
                  }}
                >
                  Ascending
                </button>
                <button
                  type="button"
                  className={`${styles.finderCtxItem} ${
                    !sort.ascending ? styles.finderCtxItemActive : ""
                  }`}
                  onClick={() => {
                    setSort(sortMode, false);
                    setCtx(null);
                  }}
                >
                  Descending
                </button>
                {orders[current] && (
                  <button
                    type="button"
                    className={styles.finderCtxItem}
                    onClick={() => {
                      setOrders((prev) => {
                        const { [current]: _removed, ...rest } = prev;
                        return rest;
                      });
                      setCtx(null);
                    }}
                  >
                    Clear Custom Order
                  </button>
                )}
              </>
            )}
          </div>
          </>,
          document.body,
        )}

      {/* status bar — “X items” plus the selection count, like the real
          Finder's View → Show Status Bar */}
      <div className={styles.finderStatusbar}>
        <span className={styles.finderStatusItem}>
          {visible.length} item{visible.length === 1 ? "" : "s"}
        </span>
        {selected.length > 0 && (
          <span className={styles.finderStatusItem}>
            {selected.length} selected
          </span>
        )}
        {archiveOwner && (
          <span className={styles.finderStatusItem}>
            Inside {archiveOwner.name}
          </span>
        )}
      </div>

      {/* clipboard status (path bar left of the breadcrumbs) */}
      {clipMsg && <div className={styles.finderClipToast}>{clipMsg}</div>}

      {/* path bar */}
      <div className={styles.finderPathbar}>
        <span>Aryan</span>
        <span className={styles.finderPathSep}>›</span>
        <span>{currentLabel(current, customFolders, customFiles)}</span>
        {query && (
          <>
            <span className={styles.finderPathSep}>›</span>
            <span>“{query}”</span>
          </>
        )}
      </div>

      {/* Mobile bottom tab bar — iOS-style navigation. Hidden on desktop. */}
      <div className={styles.finderMobileTabs}>
        {["Recents", "Desktop", "Documents", "Downloads", "Projects"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.finderMobileTab} ${
              current === tab ? styles.finderMobileTabActive : ""
            }`}
            onClick={() => openSidebar(tab)}
          >
            <span className={styles.finderMobileTabIcon}>
              {SIDEBAR_ICONS[tab]}
            </span>
            <span className={styles.finderMobileTabLabel}>
              {tab === "Recents" ? "Recent" : tab === "Downloads" ? "Downloads" : tab === "Documents" ? "Docs" : tab}
            </span>
          </button>
        ))}
        {/* Grid / List view toggle */}
        <button
          type="button"
          className={`${styles.finderMobileTab} ${styles.finderViewToggle}`}
          onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}
          aria-label={view === "grid" ? "Switch to list view" : "Switch to grid view"}
        >
          <span className={styles.finderMobileTabIcon}>
            {view === "grid" ? <List size={14} /> : <LayoutGrid size={14} />}
          </span>
          <span className={styles.finderMobileTabLabel}>
            {view === "grid" ? "List" : "Grid"}
          </span>
        </button>
      </div>
    </div>
  );
}

function currentLabel(
  current: string,
  folders: CustomFolder[],
  files?: CustomFile[],
): string {
  if (current.startsWith("folder:")) {
    return folders.find((f) => f.id === current.slice("folder:".length))?.name ?? "Folder";
  }
  const arc = parseArchiveLoc(current);
  if (arc) {
    const src = files?.find((f) => f.id === arc.fileId);
    const base = src?.name ?? (arc.type === "zip" ? "Archive.zip" : "Image.iso");
    return arc.path ? `${base} › ${arc.path}` : base;
  }
  return current;
}
