/**
 * A tiny client-side file system, persisted in localStorage.
 *
 * Mirrors daedalOS's IndexedDB-backed file system in spirit: users can
 * create folders and text documents in Finder, save files from TextEdit,
 * and drop files onto the desktop — everything survives a reload.
 */

export interface CustomFile {
  id: string;
  name: string;
  /** "Plain Text" | "Markdown" | "JSON" | ... */
  kind: string;
  /** Body for text files (opened in TextEdit). */
  content: string;
  /** ISO date the file was created. */
  createdAt: string;
  /** Parent custom folder id (folders keep their files, like real Finder). */
  folderId?: string;
}

export interface CustomFolder {
  id: string;
  name: string;
  createdAt: string;
  /** macOS Tahoe folder color id (blue / gray / green / orange / pink / purple / red / yellow). */
  color?: string;
  /** Optional emoji badge (Tahoe folder emoji). */
  emoji?: string;
  /** Parent custom folder id — folders nest like real Finder (undefined = Documents). */
  folderId?: string;
}

export interface DroppedPhoto {
  id: string;
  name: string;
  /** A data: URL (kept small, stored in localStorage). */
  dataUrl: string;
  createdAt: string;
}

const FS_KEY = "aryanos.fs";
const PHOTOS_KEY = "aryanos.photos";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded — drop silently; storage is best-effort.
  }
}

let seq = 0;
function uid(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

/* ----------------------------- files/folders ----------------------------- */

export function readFolders(): CustomFolder[] {
  // Folders and files share one localStorage array — disambiguate by id
  // prefix, otherwise every dropped file also shows up as a phantom folder.
  return read<CustomFolder[]>(FS_KEY, []).filter(
    (f) => f && typeof f.id === "string" && f.id.startsWith("folder-"),
  );
}

export function readFiles(): CustomFile[] {
  return read<CustomFile[]>(FS_KEY, []).filter(
    (f) => f && typeof f.id === "string" && f.id.startsWith("file-"),
  );
}

function saveAll(folders: CustomFolder[], files: CustomFile[]) {
  write(FS_KEY, [...folders, ...files]);
}

export function addFolder(name: string, folderId?: string): CustomFolder {
  const folder: CustomFolder = {
    id: uid("folder"),
    name,
    createdAt: new Date().toISOString(),
    folderId,
  };
  saveAll([...readFolders(), folder], readFiles());
  return folder;
}

export function addFile(name: string, content = "", folderId?: string): CustomFile {
  const kind = kindOf(name);
  const file: CustomFile = {
    id: uid("file"),
    name,
    kind,
    content,
    createdAt: new Date().toISOString(),
    folderId,
  };
  saveAll(readFolders(), [...readFiles(), file]);
  return file;
}

/** Update a custom file's content by name (TextEdit saves keep Finder in sync). */
export function saveFileContent(name: string, content: string) {
  const files = readFiles().map((f) =>
    f.name === name ? { ...f, content } : f,
  );
  saveAll(readFolders(), files);
}

/** Append “ copy” before the extension (README.txt → README copy.txt). */
function copyName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot > 0) return `${name.slice(0, dot)} copy${name.slice(dot)}`;
  return `${name} copy`;
}

/** Move a file into a folder (undefined = Documents root). */
export function moveFileToFolder(id: string, folderId?: string) {
  const files = readFiles().map((f) => (f.id === id ? { ...f, folderId } : f));
  saveAll(readFolders(), files);
}

/** Move a folder into another folder (undefined = Documents root). Prevents
 *  a folder from becoming its own descendant. */
export function moveFolderTo(id: string, folderId?: string) {
  if (folderId === id) return;
  const all = readFolders();
  // Walk up the chain — if moving INTO this folder's own subtree, refuse.
  let cursor = folderId;
  while (cursor) {
    if (cursor === id) return;
    cursor = all.find((f) => f.id === cursor)?.folderId;
  }
  saveAll(all.map((f) => (f.id === id ? { ...f, folderId } : f)), readFiles());
}

/** Duplicate a file into a folder (daedalOS copy). */
export function copyFileTo(id: string, folderId?: string) {
  const src = readFiles().find((f) => f.id === id);
  if (!src) return;
  const copy: CustomFile = {
    ...src,
    id: uid("file"),
    name: copyName(src.name),
    folderId,
    createdAt: new Date().toISOString(),
  };
  saveAll(readFolders(), [...readFiles(), copy]);
}

/** Duplicate a folder and everything inside it (files + nested folders). */
export function copyFolderTo(id: string, folderId?: string) {
  const src = readFolders().find((f) => f.id === id);
  if (!src) return;
  const copy: CustomFolder = {
    ...src,
    id: uid("folder"),
    name: copyName(src.name),
    createdAt: new Date().toISOString(),
    folderId,
  };
  // Copy nested folders recursively, remapping each child's parent to the copy.
  const idMap = new Map<string, string>([[src.id, copy.id]]);
  const allFolders = readFolders();
  const nested = allFolders.filter((f) => f.folderId === src.id);
  const copies: CustomFolder[] = [copy];
  const clone = (parent: CustomFolder) => {
    allFolders
      .filter((f) => f.folderId === parent.id)
      .forEach((child) => {
        const childCopy: CustomFolder = {
          ...child,
          id: uid("folder"),
          createdAt: new Date().toISOString(),
          folderId: idMap.get(parent.id),
        };
        idMap.set(child.id, childCopy.id);
        copies.push(childCopy);
        clone(childCopy);
      });
  };
  if (nested.length) clone(src);
  const files = readFiles().map((f) =>
    f.folderId && idMap.has(f.folderId)
      ? { ...f, folderId: idMap.get(f.folderId) }
      : f,
  );
  saveAll([...allFolders, ...copies], files);
}

export function renameFile(id: string, name: string) {
  const files = readFiles().map((f) =>
    f.id === id ? { ...f, name, kind: kindOf(name) } : f,
  );
  saveAll(readFolders(), files);
}

export function deleteFile(id: string) {
  saveAll(readFolders(), readFiles().filter((f) => f.id !== id));
}

export function deleteFolder(id: string) {
  // Delete the folder, its nested folders, and everything inside them.
  const allFolders = readFolders();
  const doomed = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of allFolders) {
      if (f.folderId && doomed.has(f.folderId) && !doomed.has(f.id)) {
        doomed.add(f.id);
        grew = true;
      }
    }
  }
  saveAll(
    allFolders.filter((f) => !doomed.has(f.id)),
    readFiles().filter((f) => !(f.folderId && doomed.has(f.folderId))),
  );
}

export function renameFolder(id: string, name: string) {
  const folders = readFolders().map((f) => (f.id === id ? { ...f, name } : f));
  saveAll(folders, readFiles());
}

/** Set a folder's Tahoe color / emoji badge (kept in sync with the wallpaper). */
export function setFolderStyle(id: string, style: { color?: string; emoji?: string }) {
  const folders = readFolders().map((f) =>
    f.id === id ? { ...f, ...style } : f,
  );
  saveAll(folders, readFiles());
}

/** Guess a friendly kind + language from a file name. */
export function kindOf(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    txt: "Plain Text",
    md: "Markdown",
    json: "JSON",
    js: "JavaScript",
    ts: "TypeScript",
    tsx: "TypeScript React",
    jsx: "JavaScript React",
    html: "HTML",
    css: "CSS",
    java: "Java",
    py: "Python",
    sh: "Shell Script",
    c: "C",
    cpp: "C++",
    pgn: "PGN Game",
    tic: "TIC Cart",
    rtf: "Rich Text",
    whtml: "Rich Text",
    mp3: "MP3 Audio",
    wav: "Audio",
    ogg: "Audio",
    flac: "Audio",
    m4a: "Audio",
    aac: "Audio",
    mp4: "Movie",
    mov: "Movie",
    m4v: "Movie",
    webm: "Movie",
    mkv: "Movie",
    avi: "Movie",
    otf: "Font",
    ttf: "Font",
    woff: "Font",
    woff2: "Font",
    m3u: "Playlist",
    m3u8: "Playlist",
    wsz: "Winamp Skin",
    zip: "Zip Archive",
    "7z": "Archive",
    tar: "Archive",
    tgz: "Archive",
    gz: "Archive",
    xz: "Archive",
    bz2: "Archive",
    rar: "Archive",
    iso: "Disc Image",
    png: "Image",
    jpg: "Image",
    jpeg: "Image",
    gif: "Image",
    webp: "Image",
    svg: "Image",
    ico: "Image",
    bmp: "Image",
    swf: "Flash Movie",
    spl: "Flash Movie",
    jsdos: "DOS Game",
    exe: "Windows Application",
    dsk: "Disk Image",
    bin: "Disk Image",
    vhd: "Disk Image",
    vfd: "Disk Image",
    nes: "ROM Game",
    smc: "ROM Game",
    sfc: "ROM Game",
    gb: "ROM Game",
    gbc: "ROM Game",
    gba: "ROM Game",
    n64: "ROM Game",
    z64: "ROM Game",
    v64: "ROM Game",
    gen: "ROM Game",
    smd: "ROM Game",
    sms: "ROM Game",
    gg: "ROM Game",
    a26: "ROM Game",
    a52: "ROM Game",
    a78: "ROM Game",
    pce: "ROM Game",
    nds: "ROM Game",
    ws: "ROM Game",
    wsc: "ROM Game",
    vb: "ROM Game",
    vboy: "ROM Game",
    j64: "ROM Game",
    jag: "ROM Game",
    lnx: "ROM Game",
    ngp: "ROM Game",
    ngc: "ROM Game",
    "32x": "ROM Game",
  };
  return map[ext] ?? "Plain Text";
}

/** Kinds that open in the emulators (daedalOS EmulatorJS / Ruffle / js-dos). */
export const EMULATOR_KINDS = new Set([
  "ROM Game",
  "Flash Movie",
  "DOS Game",
  "DOS Program",
]);

/** Kinds stored as data: URLs (binary) rather than plain text. */
export const BINARY_KINDS = new Set([
  "MP3 Audio",
  "Audio",
  "Winamp Skin",
  "Zip Archive",
  "Archive",
  "Disk Image",
  "Image",
  "Movie",
  "Font",
  "ROM Game",
  "Flash Movie",
  "DOS Game",
  "DOS Program",
]);

/** True for kinds that open in Webamp (audio files, playlists, skins). */
export const WEBAMP_KINDS = new Set([
  "MP3 Audio",
  "Audio",
  "Playlist",
  "Winamp Skin",
]);

/** True for kinds that open in the VLC media player (movies). */
export const VLC_KINDS = new Set(["Movie"]);

/** True for kinds that open in the OpenType font viewer. */
export const FONT_KINDS = new Set(["Font"]);

/** True for kinds that open in the BoxedWine Windows emulator (daedalOS). */
export const BOXEDWINE_KINDS = new Set(["Windows Application"]);

/** True for kinds that open in the Virtual x86 emulator (daedalOS). */
export const V86_KINDS = new Set(["Disk Image"]);

/** True for kinds that open in the TinyMCE rich-text editor (daedalOS). */
export const TINYMCE_KINDS = new Set(["Rich Text"]);

/** True for kinds that open in the TIC-80 fantasy computer (daedalOS). */
export const TIC80_KINDS = new Set(["TIC Cart"]);

/** True for kinds that open in the Monaco code editor (daedalOS). */
export const MONACO_KINDS = new Set([
  "JavaScript",
  "JavaScript React",
  "TypeScript",
  "TypeScript React",
  "JSON",
  "HTML",
  "CSS",
  "Java",
  "Python",
  "Shell Script",
  "C",
  "C++",
]);

/** Language id for the TextEdit highlighter. */
export function langOf(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["js", "jsx", "ts", "tsx"].includes(ext)) return "javascript";
  if (ext === "json") return "json";
  if (ext === "html") return "html";
  if (ext === "css") return "css";
  if (ext === "md") return "markdown";
  if (ext === "java") return "java";
  if (ext === "py") return "python";
  if (ext === "sh" || ext === "bash" || ext === "zsh") return "bash";
  if (ext === "c" || ext === "cpp" || ext === "h") return "cpp";
  return "plaintext";
}

/* --------------------------------- photos -------------------------------- */

export function readDroppedPhotos(): DroppedPhoto[] {
  return read<DroppedPhoto[]>(PHOTOS_KEY, []).filter((p) => p && p.dataUrl);
}

export function addDroppedPhoto(name: string, dataUrl: string): DroppedPhoto {
  const photo: DroppedPhoto = {
    id: uid("photo"),
    name,
    dataUrl,
    createdAt: new Date().toISOString(),
  };
  write(PHOTOS_KEY, [...readDroppedPhotos(), photo]);
  return photo;
}

/**
 * Read a dropped File as a data URL (downscaled for images so localStorage
 * doesn't blow its quota). Returns null on failure.
 */
export function fileToDataUrl(
  file: File,
  maxDim = 1400,
): Promise<string | null> {
  return new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch {
          resolve(null);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/** Download a text file as a real file (daedalOS Download). */
export function downloadText(name: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Download a same-origin asset (image / video / pdf) as a real file. */
export function downloadUrl(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
