/**
 * 7-Zip WASM — extracts 7z / tar / gz / xz / bz2 / rar archives in the
 * browser (ported from daedalOS's zipFunctions.unarchive). The 7-Zip engine
 * (7zz.umd.js + 7zz.wasm) is served locally from /aryan/apps/7zip.
 */

type SevenZipModule = {
  FS: {
    mkdir: (path: string) => void;
    chdir: (path: string) => void;
    open: (path: string, flags: string) => number;
    write: (fd: number, data: Uint8Array, offset: number, length: number) => void;
    close: (fd: number) => void;
    readdir: (path: string) => string[];
    stat: (path: string) => { mode: number };
    isDir: (mode: number) => boolean;
    chmod: (path: string, mode: number) => void;
    readFile: (path: string, opts?: { flags?: string; encoding?: string }) => Uint8Array;
  };
  callMain: (args: string[]) => void;
};

declare global {
  interface Window {
    SevenZip?: () => Promise<SevenZipModule>;
  }
}

export interface UnarchiveEntry {
  path: string;
  bytes: Uint8Array;
}

let loading: Promise<SevenZipModule> | null = null;

const loadScript = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

const getSevenZip = (): Promise<SevenZipModule> => {
  if (loading) return loading;
  loading = (async () => {
    await loadScript("/aryan/apps/7zip/7zz.umd.js");
    if (!window.SevenZip) throw new Error("7-Zip failed to load");
    return window.SevenZip();
  })();
  return loading;
};

/**
 * Extract an archive's bytes into a flat { path -> bytes } map.
 * Format is sniffed from the file extension (7z/tar/gz/xz/bz2/rar/zip).
 */
/** True for single-file wrappers that need a second pass (gz -> tar -> files). */
const isWrappedTar = (name: string): boolean =>
  /\.(tgz|tar\.gz|tar\.xz|tar\.bz2)$/i.test(name);

export const unarchive = async (
  fileName: string,
  data: Uint8Array,
): Promise<Record<string, Uint8Array>> => {
  const sevenZip = await getSevenZip();
  const extractFolder = `/${fileName.replace(/\.[^.]+$/, "")}`;
  const files: Record<string, Uint8Array> = {};

  sevenZip.FS.mkdir(extractFolder);
  sevenZip.FS.chdir(extractFolder);

  // Write the archive into the in-memory FS and let 7-Zip do the rest.
  // 7-Zip unwraps one layer per pass — tar.gz/tgz yield the inner .tar,
  // which a second callMain then expands into the real files.
  // Pass 1: write the archive and extract it.
  const first = sevenZip.FS.open(fileName, "w+");
  sevenZip.FS.write(first, data, 0, data.length);
  sevenZip.FS.close(first);
  sevenZip.callMain(["-y", "x", fileName]);

  // Pass 2: tar.gz / tgz / tar.xz / tar.bz2 unwrap to an inner .tar first —
  // expand that layer too so the real files come out (single callMain only
  // unwraps one layer).
  if (isWrappedTar(fileName)) {
    const innerTar = fileName.replace(/\.(gz|xz|bz2)$/i, "");
    if (sevenZip.FS.readdir(extractFolder).includes(innerTar)) {
      sevenZip.callMain(["-y", "x", innerTar]);
    }
  }

  const walk = (dir: string) => {
    for (const entry of sevenZip.FS.readdir(dir)) {
      if (entry === "." || entry === ".." || entry === fileName) continue;
      const full = `${dir}/${entry}`;
      try {
        sevenZip.FS.chmod(full, 0o777);
      } catch {
        // ignore permission failures
      }
      if (sevenZip.FS.isDir(sevenZip.FS.stat(full).mode)) {
        walk(full);
      } else {
        files[full.slice(extractFolder.length + 1)] =
          sevenZip.FS.readFile(full, { flags: "r" });
      }
    }
  };
  walk(extractFolder);

  return files;
};
