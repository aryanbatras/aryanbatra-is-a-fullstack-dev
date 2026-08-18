"use client";

import { useEffect, useRef, useState } from "react";
import { readFiles } from "@/utils/finderStorage";
import CDN from "@/constants/cdn";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Virtual x86 (V86) — a full x86 PC emulator in the browser, ported from
 * daedalOS. Boots .img disk images and .iso CDs from Finder with the BIOS and
 * wasm served locally from /aryan/apps/v86. (daedalOS mounts its BrowserFS
 * as a 9p share; we skip that since our file system is localStorage-based —
 * the machine itself boots identically.)
 */

type V86Starter = {
  add_listener: (event: string, cb: () => void) => void;
  destroy: () => void;
  keyboard_set_status: (enabled: boolean) => void;
  lock_mouse: () => void;
  save_state: () => Promise<ArrayBuffer>;
  v86: {
    cpu: { devices: { vga: { graphical_mode: boolean } } };
  };
};

type V86Config = {
  autostart: boolean;
  bios: { url: string };
  log_level: number;
  network_relay_url: string;
  vga_bios: { url: string };
  wasm_path: string;
  screen_container: HTMLElement;
  boot_order?: number;
  memory_size: number;
  vga_memory_size: number;
  cdrom?: { async: boolean; size: number; url: string; use_parts: boolean };
  fda?: { async: boolean; size: number; url: string; use_parts: boolean };
  hda?: { async: boolean; size: number; url: string; use_parts: boolean };
};

declare global {
  interface Window {
    V86Starter?: new (config: V86Config) => V86Starter;
  }
}

const BOOT_CD_FD_HD = 0x213;
const BOOT_FD_CD_HD = 0x231;

const CONFIG = {
  autostart: true,
  bios: { url: `${CDN.V86.local}/bios/seabios.bin` },
  log_level: 0,
  network_relay_url: "wss://relay.widgetry.org/",
  vga_bios: { url: `${CDN.V86.local}/bios/vgabios.bin` },
  wasm_path: CDN.V86.wasm,
};

const SUPPORTED_FLOPPY_SIZES = new Set([
  160, 180, 200, 320, 360, 400, 720, 1200, 1440, 1722, 2880,
]);

function isFloppy(size: number): boolean {
  // eslint-disable-next-line no-bitwise
  return (SUPPORTED_FLOPPY_SIZES.has(size >> 10) && (size & 0x3ff) === 0) || size === 512;
}

interface V86AppProps {
  /** An .img / .iso file in the Finder docs folder to boot. */
  file?: string;
}

export default function V86App({ file }: V86AppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading Virtual x86…");
  const emulatorRef = useRef<V86Starter | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    const boot = async () => {
      setStatus("Loading emulator…");
      try {
        const script = document.createElement("script");
        script.src = CDN.V86.js;
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load libv86.js"));
          document.head.appendChild(script);
        });
        if (cancelled || !window.V86Starter) return;

        // Load the disk image from the Finder file system as a blob URL.
        let contents = new Uint8Array(0);
        if (file) {
          const f = readFiles().find((x) => x.name === file);
          if (f?.content) {
            contents = new TextEncoder().encode(f.content);
          }
        }
        const isISO = file?.toLowerCase().endsWith(".iso") ?? false;
        const bufferUrl = URL.createObjectURL(
          new Blob([contents], { type: "application/octet-stream" }),
        );

        const imageConfig: { cdrom?: unknown; fda?: unknown; hda?: unknown } = {};
        if (isISO) {
          imageConfig.cdrom = {
            async: false,
            size: contents.length,
            url: bufferUrl,
            use_parts: false,
          };
        } else if (isFloppy(contents.length)) {
          imageConfig.fda = {
            async: false,
            size: contents.length,
            url: bufferUrl,
            use_parts: false,
          };
        } else {
          imageConfig.hda = {
            async: false,
            size: contents.length,
            url: bufferUrl,
            use_parts: false,
          };
        }

        const deviceMemory = Math.min(
          (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0.25,
          8,
        );
        const emulator = new window.V86Starter({
          ...CONFIG,
          boot_order: isISO ? BOOT_CD_FD_HD : BOOT_FD_CD_HD,
          memory_size: deviceMemory * 128 * 1024 * 1024,
          screen_container: container,
          vga_memory_size: deviceMemory * 8 * 1024 * 1024,
          ...imageConfig,
        } as V86Config);

        emulator.add_listener("emulator-loaded", () => {
          if (cancelled) {
            emulator.destroy();
            return;
          }
          setStatus("");
          container.addEventListener("click", emulator.lock_mouse);
        });
        emulatorRef.current = emulator;
      } catch {
        if (!cancelled) setStatus("Failed to load Virtual x86");
      }
    };

    void boot();

    return () => {
      cancelled = true;
      try {
        emulatorRef.current?.destroy();
      } catch {
        // Ignore destroy errors
      }
      emulatorRef.current = null;
    };
  }, [file]);

  return (
    <div className={styles.v86}>
      <div ref={containerRef} className={styles.v86Body} />
      {status && (
        <div className={styles.v86Loading}>
          <span className={styles.gameSpin} style={{ display: "inline-block" }} />
          {status}
        </div>
      )}
    </div>
  );
}
