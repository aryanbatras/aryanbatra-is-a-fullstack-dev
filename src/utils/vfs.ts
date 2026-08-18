/**
 * VirtualFS — A persistent in-browser filesystem backed by IndexedDB.
 * Supports directories, files, permissions, timestamps, and file content.
 * Modeled after a minimal Linux filesystem.
 */

const DB_NAME = "aryan-os-vfs";
const DB_VERSION = 1;
const STORE_NAME = "nodes";

interface FSNode {
  id: string;
  type: "file" | "directory" | "symlink";
  name: string;
  parentId: string | null;
  content?: string; // For files
  size: number;
  permissions: number; // Unix-style (e.g., 0o755)
  createdAt: number;
  modifiedAt: number;
  symlinkTarget?: string;
}

class VirtualFS {
  private db: IDBDatabase | null = null;
  private cache: Map<string, FSNode> = new Map();

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("parentId", "parentId", { unique: false });
          store.createIndex("path", ["parentId", "name"], { unique: true });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private genId(): string {
    return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
  }

  private async tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    if (!this.db) throw new Error("VFS not initialized");
    const tx = this.db.transaction(STORE_NAME, mode);
    return tx.objectStore(STORE_NAME);
  }

  async mkdir(path: string, permissions = 0o755): Promise<void> {
    const { parent, name } = await this.resolveParent(path);
    const id = this.genId();
    const node: FSNode = {
      id, type: "directory", name, parentId: parent?.id ?? null,
      size: 0, permissions, createdAt: Date.now(), modifiedAt: Date.now(),
    };
    const store = await this.tx("readwrite");
    await new Promise<void>((res, rej) => {
      const req = store.add(node);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
    this.cache.set(path, node);
  }

  async writeFile(path: string, content: string, permissions = 0o644): Promise<void> {
    const { parent, name } = await this.resolveParent(path);
    const existing = await this.findByParentAndName(parent?.id ?? null, name);
    const now = Date.now();

    if (existing) {
      existing.content = content;
      existing.size = content.length;
      existing.modifiedAt = now;
      existing.type = "file";
      const store = await this.tx("readwrite");
      await new Promise<void>((res, rej) => {
        const req = store.put(existing);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      });
      this.cache.set(path, existing);
    } else {
      const id = this.genId();
      const node: FSNode = {
        id, type: "file", name, parentId: parent?.id ?? null,
        content, size: content.length, permissions,
        createdAt: now, modifiedAt: now,
      };
      const store = await this.tx("readwrite");
      await new Promise<void>((res, rej) => {
        const req = store.add(node);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      });
      this.cache.set(path, node);
    }
  }

  async readFile(path: string): Promise<string | null> {
    const node = await this.getNode(path);
    if (!node || node.type !== "file") return null;
    return node.content ?? "";
  }

  async exists(path: string): Promise<boolean> {
    const node = await this.getNode(path);
    return node !== null;
  }

  async isDir(path: string): Promise<boolean> {
    const node = await this.getNode(path);
    return node?.type === "directory";
  }

  async stat(path: string): Promise<FSNode | null> {
    return this.getNode(path);
  }

  async readdir(path: string): Promise<string[]> {
    const node = await this.getNode(path);
    if (!node || node.type !== "directory") return [];
    const store = await this.tx("readonly");
    return new Promise<string[]>((res, rej) => {
      const idx = store.index("parentId");
      const req = idx.getAll(node.id);
      req.onsuccess = () => res(req.result.map((n: FSNode) => n.name));
      req.onerror = () => rej(req.error);
    });
  }

  async rm(path: string, recursive = false): Promise<boolean> {
    const node = await this.getNode(path);
    if (!node) return false;
    if (node.type === "directory") {
      const children = await this.readdir(path);
      if (children.length > 0 && !recursive) return false;
      for (const child of children) {
        await this.rm(`${path}/${child}`, true);
      }
    }
    const store = await this.tx("readwrite");
    await new Promise<void>((res, rej) => {
      const req = store.delete(node.id);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
    this.cache.delete(path);
    return true;
  }

  async mv(srcPath: string, destPath: string): Promise<boolean> {
    const srcNode = await this.getNode(srcPath);
    if (!srcNode) return false;
    const { parent: destParent, name: destName } = await this.resolveParent(destPath);

    // If dest is a directory, move inside it
    const destIsDir = await this.isDir(destPath);
    const finalParent = destIsDir ? await this.getNode(destPath) : destParent;
    const finalName = destIsDir ? srcNode.name : destName;

    srcNode.parentId = finalParent?.id ?? null;
    srcNode.name = finalName;
    srcNode.modifiedAt = Date.now();

    const store = await this.tx("readwrite");
    await new Promise<void>((res, rej) => {
      const req = store.put(srcNode);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
    return true;
  }

  async cp(srcPath: string, destPath: string): Promise<boolean> {
    const srcNode = await this.getNode(srcPath);
    if (!srcNode) return false;
    const content = srcNode.content ?? "";
    await this.writeFile(destPath, content, srcNode.permissions);
    return true;
  }

  async appendFile(path: string, content: string): Promise<void> {
    const existing = await this.readFile(path);
    await this.writeFile(path, (existing ?? "") + content);
  }

  async chmod(path: string, mode: number): Promise<boolean> {
    const node = await this.getNode(path);
    if (!node) return false;
    node.permissions = mode;
    node.modifiedAt = Date.now();
    const store = await this.tx("readwrite");
    await new Promise<void>((res, rej) => {
      const req = store.put(node);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
    return true;
  }

  // --- Helpers ---

  private async getNode(path: string): Promise<FSNode | null> {
    if (this.cache.has(path)) return this.cache.get(path)!;
    if (path === "/" || path === "") {
      // Root node
      const store = await this.tx("readonly");
      return new Promise<FSNode | null>((res) => {
        const idx = store.index("parentId");
        const req = idx.getAll(null);
        req.onsuccess = () => {
          const root: FSNode = { id: "root", type: "directory", name: "/", parentId: null, size: 0, permissions: 0o755, createdAt: 0, modifiedAt: 0 };
          this.cache.set("/", root);
          res(root);
        };
        req.onerror = () => res(null);
      });
    }

    const parts = path.split("/").filter(Boolean);
    let current = await this.getNode("/");
    if (!current) return null;

    for (const part of parts) {
      if (!current || current.type !== "directory") return null;
      const store = await this.tx("readonly");
      const node = await new Promise<FSNode | null>((res) => {
        const idx = store.index("parentId");
        const req = idx.openCursor(IDBKeyRange.only(current!.id));
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor && cursor.value.name === part) {
            res(cursor.value);
          } else if (cursor) {
            cursor.continue();
          } else {
            res(null);
          }
        };
        req.onerror = () => res(null);
      });
      if (!node) return null;
      current = node;
    }

    const fullPath = "/" + parts.join("/");
    this.cache.set(fullPath, current);
    return current;
  }

  private async findByParentAndName(parentId: string | null, name: string): Promise<FSNode | null> {
    const store = await this.tx("readonly");
    return new Promise<FSNode | null>((res) => {
      const idx = store.index("parentId");
      const req = idx.openCursor(IDBKeyRange.only(parentId));
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor && cursor.value.name === name) {
          res(cursor.value);
        } else if (cursor) {
          cursor.continue();
        } else {
          res(null);
        }
      };
      req.onerror = () => res(null);
    });
  }

  private async resolveParent(path: string): Promise<{ parent: FSNode | null; name: string }> {
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) return { parent: null, name: "" };
    const name = parts.pop()!;
    const parentPath = "/" + parts.join("/");
    const parent = parentPath ? await this.getNode(parentPath) : null;
    return { parent, name };
  }

  // Initialize default filesystem
  async seedDefaults(): Promise<void> {
    const existing = await this.readdir("/");
    if (existing.length > 0) return; // Already seeded

    await this.mkdir("/home");
    await this.mkdir("/home/user");
    await this.mkdir("/home/user/documents");
    await this.mkdir("/home/user/projects");
    await this.mkdir("/home/user/downloads");
    await this.mkdir("/tmp");
    await this.mkdir("/usr");
    await this.mkdir("/usr/bin");
    await this.mkdir("/usr/lib");
    await this.mkdir("/etc");
    await this.mkdir("/var");
    await this.mkdir("/var/log");
    await this.mkdir("/proc");
    await this.mkdir("/opt");
    await this.mkdir("/root");

    await this.writeFile("/home/user/.bashrc", "# Browser Termux\nexport PS1='\\u@web-termux:\\w$ '\nexport PATH=/usr/bin:$PATH\nexport TERM=xterm-256color\n");
    await this.writeFile("/home/user/.profile", "# sourced by bash on login\nsource ~/.bashrc\n");
    await this.writeFile("/home/user/documents/readme.txt", "Welcome to Browser Termux!\nA pure client-side Linux terminal.\nType 'help' for available commands.\nType 'pkg install python' for Python support.\n");
    await this.writeFile("/home/user/documents/notes.md", "# Notes\n\n- Build cool stuff\n- Learn WASM\n- Ship fast\n");
    await this.writeFile("/home/user/projects/hello.py", "#!/usr/bin/env python3\nprint('Hello from Browser Termux!')\n\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nfor i in range(10):\n    print(f'fib({i}) = {fibonacci(i)}')\n");
    await this.writeFile("/home/user/projects/hello.js", "// Hello World\nconsole.log('Hello from Browser Termux!');\nconst arr = [1, 2, 3, 4, 5];\nconsole.log('Doubled:', arr.map(x => x * 2));\n");
    await this.writeFile("/home/user/projects/style.css", "body {\n  font-family: monospace;\n  background: #1b1c1e;\n  color: #c5c8c6;\n  margin: 0;\n  padding: 20px;\n}\n");
    await this.writeFile("/home/user/projects/index.html", "<!DOCTYPE html>\n<html>\n<head><title>My Page</title></head>\n<body>\n  <h1>Hello World</h1>\n  <p>Served from Browser Termux!</p>\n</body>\n</html>\n");
    await this.writeFile("/etc/hostname", "web-termux");
    await this.writeFile("/etc/os-release", "NAME=\"Browser Termux\"\nVERSION=\"1.0\"\nID=web-termux\nPRETTY_NAME=\"Browser Termux 1.0 (WASM)\"\n");
    await this.writeFile("/var/log/system.log", `[${new Date().toISOString()}] System boot complete\n[${new Date().toISOString()}] Virtual filesystem initialized\n[${new Date().toISOString()}] Shell ready\n`);
  }

  // File size estimation
  async diskUsage(path: string): Promise<number> {
    const node = await this.getNode(path);
    if (!node) return 0;
    if (node.type === "file") return node.size;
    const children = await this.readdir(path);
    let total = 0;
    for (const child of children) {
      total += await this.diskUsage(`${path === "/" ? "" : path}/${child}`);
    }
    return total;
  }
}

// Singleton
export const vfs = new VirtualFS();
export type { FSNode };
