/**
 * Archive support — daedalOS's ZIP/ISO read + add-to-archive, adapted to the
 * machine's localStorage file system.
 *
 * - ZIP: read via fflate (unzip), write via fflate (zip) — the same library
 *   daedalOS ships.
 * - ISO: a minimal ISO9660 reader with Joliet support (UCS-2 names), since
 *   the machine has no BrowserFS IsoFS. Only the parts the Finder needs:
 *   directory tree, per-file extents, and data reads.
 */

import { unzipSync, zipSync, type Zippable } from "fflate";

/* ------------------------------ byte helpers ------------------------------ */

/** data: URL → bytes (handles base64 and plain). */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return new TextEncoder().encode(dataUrl);
  const meta = dataUrl.slice(0, comma);
  const body = dataUrl.slice(comma + 1);
  if (meta.includes(";base64")) {
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  return new TextEncoder().encode(decodeURIComponent(body));
}

/** bytes → data: URL (used to persist archives in the file system). */
export function bytesToDataUrl(bytes: Uint8Array, mime = "application/octet-stream"): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return `data:${mime};base64,${btoa(bin)}`;
}

export function strToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function bytesToStr(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/* ---------------------------------- ZIP ---------------------------------- */

export interface ArchiveEntry {
  /** Full path inside the archive, "/"-separated. */
  path: string;
  directory: boolean;
  /** File bytes (empty for directories). */
  bytes: Uint8Array;
}

/** List the entries of a .zip (directories + files), like daedalOS's unzip. */
export function unzipEntries(data: Uint8Array): ArchiveEntry[] {
  const unzipped = unzipSync(data);
  const byPath = new Map<string, ArchiveEntry>();
  for (const raw of Object.keys(unzipped)) {
    const name = raw.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!name) continue;
    const isDir = name.endsWith("/");
    const clean = isDir ? name.replace(/\/+$/, "") : name;
    if (!clean) continue;
    byPath.set(clean, {
      path: clean,
      directory: isDir,
      bytes: isDir ? new Uint8Array(0) : unzipped[raw],
    });
  }
  // Some archives omit explicit directory entries — synthesize the tree from
  // the file paths so folders always appear (same as daedalOS's unarchive).
  const dirs = new Set<string>();
  for (const p of byPath.keys()) {
    const parts = p.split("/");
    for (let i = 1; i < parts.length; i += 1) {
      dirs.add(parts.slice(0, i).join("/"));
    }
  }
  for (const d of dirs) {
    if (!byPath.has(d)) {
      byPath.set(d, { path: d, directory: true, bytes: new Uint8Array(0) });
    }
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

/** Build a .zip from entries (daedalOS's zipAsync / createZippable). */
export function zipEntries(entries: ArchiveEntry[]): Uint8Array {
  const zippable: Zippable = {};
  // Materialize parent directories so the archive keeps its tree shape.
  const dirs = new Set<string>();
  for (const e of entries) {
    const parts = e.path.split("/");
    for (let i = 1; i < parts.length; i += 1) {
      const dir = parts.slice(0, i).join("/");
      if (dir) dirs.add(`${dir}/`);
    }
  }
  for (const dir of dirs) zippable[dir] = new Uint8Array(0);
  for (const e of entries) {
    if (e.directory) zippable[`${e.path}/`] = new Uint8Array(0);
    else zippable[e.path] = e.bytes;
  }
  return zipSync(zippable, { level: 6 });
}

/* ---------------------------------- ISO ---------------------------------- */

const ISO_BLOCK = 2048;
const ISO_VOLUME_DESCRIPTOR_START = 16;

/** A volume descriptor — we keep the PVD (ISO9660) and Joliet SVD. */
interface IsoVolume {
  type: number;
  blockSize: number;
  root: IsoDirRecord;
  joliet: boolean;
}

interface IsoDirRecord {
  extent: number;
  length: number;
  flags: number;
  name: string;
}

function readBoth32(view: DataView, offset: number): number {
  return view.getUint32(offset + 4, false);
}

function readBoth16(view: DataView, offset: number): number {
  return view.getUint16(offset + 2, false);
}

/**
 * Parse the ISO9660 volume descriptors, preferring the Joliet Supplementary
 * Volume Descriptor (UCS-2 names) when present, like a real CD mount.
 */
function readVolumes(bytes: Uint8Array): IsoVolume[] {
  const volumes: IsoVolume[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let block = ISO_VOLUME_DESCRIPTOR_START; ; block += 1) {
    const offset = block * ISO_BLOCK;
    if (offset + ISO_BLOCK > bytes.byteLength) break;
    const type = bytes[offset];
    if (type === 255) break; // terminator
    if (bytes[offset + 1] !== 0x43 || bytes[offset + 2] !== 0x44) continue; // "CD"
    if (bytes[offset + 3] !== 0x30 || bytes[offset + 4] !== 0x30 || bytes[offset + 5] !== 0x31) continue; // "001"
    const joliet =
      type === 2 &&
      bytes[offset + 88] === 0x25 && // %
      bytes[offset + 89] === 0x2f && // /
      (bytes[offset + 90] === 0x40 || bytes[offset + 90] === 0x43 || bytes[offset + 90] === 0x45);
    const blockSize = Math.max(ISO_BLOCK, readBoth16(view, offset + 128));
    volumes.push({
      type,
      blockSize,
      joliet,
      root: {
        extent: readBoth32(view, offset + 156 + 2),
        length: readBoth32(view, offset + 156 + 10),
        flags: 2,
        name: "",
      },
    });
  }
  // Joliet first, then the plain PVD as fallback.
  return volumes.sort((a, b) => (a.joliet ? -1 : 1) - (b.joliet ? -1 : 1));
}

/** Decode an ISO file identifier: Joliet UCS-2BE or ISO uppercase ASCII. */
function decodeName(raw: Uint8Array, joliet: boolean): string {
  if (joliet) {
    let name = "";
    for (let i = 0; i + 1 < raw.length; i += 2) {
      const code = (raw[i] << 8) | raw[i + 1];
      if (code === 0) break;
      name += String.fromCharCode(code);
    }
    return name.replace(/;1$/, "");
  }
  let name = "";
  for (const b of raw) {
    if (b === 0) break;
    name += String.fromCharCode(b);
  }
  // ISO9660 d-characters are uppercase with a ";version" suffix.
  return name.replace(/;(\d+)$/, "");
}

/** List the directory records of one ISO directory extent. */
function readDirectory(
  view: DataView,
  bytes: Uint8Array,
  blockSize: number,
  record: IsoDirRecord,
  joliet: boolean,
): IsoDirRecord[] {
  const records: IsoDirRecord[] = [];
  const start = record.extent * blockSize;
  const end = Math.min(start + record.length, bytes.byteLength);
  let pos = start;
  while (pos + 34 <= end) {
    const len = bytes[pos];
    if (len === 0) {
      // Pad to the next block boundary.
      pos = Math.floor(pos / blockSize) * blockSize + blockSize;
      continue;
    }
    const flags = bytes[pos + 25];
    const nameLen = bytes[pos + 32];
    const nameStart = pos + 33;
    if (pos + 33 + nameLen > end) break;
    const nameRaw = bytes.slice(nameStart, nameStart + nameLen);
    const name = decodeName(nameRaw, joliet);
    if (name !== "." && name !== "..") {
      records.push({
        extent: readBoth32(view, pos + 2),
        length: readBoth32(view, pos + 10),
        flags,
        name,
      });
    }
    pos += len;
  }
  return records;
}

/** Walk the full ISO directory tree into flat ArchiveEntry list. */
function walkIso(
  view: DataView,
  bytes: Uint8Array,
  blockSize: number,
  record: IsoDirRecord,
  joliet: boolean,
  prefix: string,
  out: ArchiveEntry[],
): void {
  const dirRecords = readDirectory(view, bytes, blockSize, record, joliet);
  for (const child of dirRecords) {
    const path = prefix ? `${prefix}/${child.name}` : child.name;
    const directory = (child.flags & 0x02) !== 0;
    if (directory) {
      out.push({ path, directory: true, bytes: new Uint8Array(0) });
      // Guard against cycles / pathological trees.
      if (out.length < 20000) {
        walkIso(view, bytes, blockSize, child, joliet, path, out);
      }
    } else {
      const start = child.extent * blockSize;
      const end = Math.min(start + child.length, bytes.byteLength);
      out.push({
        path,
        directory: false,
        bytes: start < end ? bytes.slice(start, end) : new Uint8Array(0),
      });
    }
  }
}

/** List the entries of an ISO9660 (or Joliet) disk image. */
export function parseIso(data: Uint8Array): ArchiveEntry[] {
  const [volume] = readVolumes(data);
  if (!volume) return [];
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const out: ArchiveEntry[] = [];
  walkIso(view, data, volume.blockSize, volume.root, volume.joliet, "", out);
  return out;
}

/* ------------------------------ path helpers ------------------------------ */

/** "a/b/c.txt" → "c.txt"; never escapes up. */
export function entryName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export function entryDir(path: string): string {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

export function entryExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot).toLowerCase() : "";
}

/** Is this archive entry a text-like file the machine can open? */
const TEXT_EXTS = new Set([
  ".txt", ".md", ".markdown", ".json", ".js", ".ts", ".tsx", ".jsx",
  ".html", ".htm", ".css", ".java", ".py", ".sh", ".bash", ".c", ".cpp",
  ".h", ".pgn", ".csv", ".xml", ".yaml", ".yml", ".toml", ".ini", ".cfg",
  ".log", ".rtf", ".sql", ".m3u", ".m3u8", ".svg",
]);
export function isTextEntry(name: string): boolean {
  return TEXT_EXTS.has(entryExtension(name)) || /\.(md|txt)$/i.test(name);
}

/** Kind label for a file inside an archive (mirrors finderStorage.kindOf). */
export function entryKind(name: string): string {
  const ext = entryExtension(name);
  const map: Record<string, string> = {
    ".txt": "Plain Text", ".md": "Markdown", ".json": "JSON", ".js": "JavaScript",
    ".ts": "TypeScript", ".tsx": "TypeScript React", ".jsx": "JavaScript React",
    ".html": "HTML", ".css": "CSS", ".java": "Java", ".py": "Python",
    ".sh": "Shell Script", ".c": "C", ".cpp": "C++", ".pgn": "PGN Game",
    ".mp3": "MP3 Audio", ".png": "Image", ".jpg": "Image", ".jpeg": "Image",
    ".gif": "Image", ".webp": "Image", ".svg": "Image", ".ico": "Image",
    ".pdf": "PDF Document", ".zip": "Zip Archive", ".iso": "Disk Image",
  };
  return map[ext] ?? "Document";
}
