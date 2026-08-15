"use client";

import { useEffect, useState } from "react";

/**
 * Real hardware / environment data read straight from browser APIs:
 *
 *  - CPU cores      navigator.hardwareConcurrency
 *  - RAM            navigator.deviceMemory            (Chromium only)
 *  - GPU            WebGL unmasked renderer string    (the real adapter)
 *  - Storage        navigator.storage.estimate()      (real quota + usage)
 *  - Battery        navigator.getBattery()            (real level, charging)
 *  - Network        navigator.connection + onLine     (real type, downlink, RTT)
 *  - Screen         window.screen + devicePixelRatio
 *  - Platform       navigator.userAgentData / userAgent
 *
 * Nothing here is simulated: every field is whatever the visitor's browser
 * actually reports. If an API is unavailable (e.g. no battery, Firefox
 * without deviceMemory), the field is `null` and the UI shows an honest
 * "not available" instead of inventing a number.
 */

export interface BatteryInfo {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

export interface SystemInfo {
  ready: boolean;
  /** Logical CPU cores (navigator.hardwareConcurrency). */
  cpuCores: number | null;
  /** RAM in GB (navigator.deviceMemory, Chromium). */
  memoryGB: number | null;
  /** Real GPU adapter name from WebGL. */
  gpu: string | null;
  /** OS family, e.g. "macOS", "Windows", "Linux", "iOS". */
  platform: string;
  /** Raw platform version string if available. */
  platformVersion: string | null;
  /** Real origin storage: usage + quota in bytes. */
  storage: { usage: number; quota: number } | null;
  /** Real battery state (null when no battery API / no battery). */
  battery: BatteryInfo | null;
  /** Real online status. */
  online: boolean;
  /** Real network info from the Network Information API. */
  network: { effectiveType: string; downlink: number; rtt: number } | null;
  /** Real screen metrics. */
  screen: { width: number; height: number; dpr: number };
}

function readPlatform(): { platform: string; version: string | null } {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return { platform: "iOS", version: null };
  if (/Mac OS X|Macintosh/i.test(ua)) {
    const m = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    return {
      platform: "macOS",
      version: m ? m[1].replace(/_/g, ".") : null,
    };
  }
  if (/Windows NT/i.test(ua)) {
    const m = ua.match(/Windows NT (\d+\.\d+)/);
    const map: Record<string, string> = {
      "10.0": "10 / 11",
      "6.3": "8.1",
      "6.2": "8",
      "6.1": "7",
    };
    return {
      platform: "Windows",
      version: m ? map[m[1]] ?? m[1] : null,
    };
  }
  if (/Linux/i.test(ua)) return { platform: "Linux", version: null };
  if (/Android/i.test(ua)) return { platform: "Android", version: null };
  return { platform: "Unknown", version: null };
}

function readGpu(): string | null {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return null;
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    if (typeof renderer !== "string") return null;
    // Browsers prefix the string; drop the "ANGLE (...)" wrapper and vendor.
    return renderer.replace(/^\s*ANGLE \(/, "").split("(")[0].trim() || renderer;
  } catch {
    return null;
  }
}

export function formatBytes(b: number): string {
  const gb = b / 1024 / 1024 / 1024;
  if (gb >= 1) return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
  const mb = b / 1024 / 1024;
  return `${Math.round(mb)} MB`;
}

export default function useSystemInfo(): SystemInfo {
  const [info, setInfo] = useState<SystemInfo>(() => {
    const { platform, version } = readPlatform();
    return {
      ready: false,
      cpuCores: null,
      memoryGB: null,
      gpu: null,
      platform,
      platformVersion: version,
      storage: null,
      battery: null,
      online: typeof navigator !== "undefined" ? navigator.onLine : true,
      network: null,
      screen: { width: 0, height: 0, dpr: 1 },
    };
  });

  useEffect(() => {
    let cancelled = false;

    const patch = (p: Partial<SystemInfo>) => {
      if (!cancelled) setInfo((prev) => ({ ...prev, ...p }));
    };

    // Synchronous values.
    patch({
      ready: true,
      cpuCores:
        typeof navigator.hardwareConcurrency === "number"
          ? navigator.hardwareConcurrency
          : null,
      memoryGB:
        (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? null,
      gpu: readGpu(),
      online: navigator.onLine,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        dpr: window.devicePixelRatio || 1,
      },
    });

    // Real origin storage quota + usage.
    if (navigator.storage?.estimate) {
      void navigator.storage
        .estimate()
        .then((est) =>
          patch({ storage: { usage: est.usage ?? 0, quota: est.quota ?? 0 } }),
        )
        .catch(() => patch({ storage: null }));
    }

    // Real network info.
    const conn = (navigator as unknown as {
      connection?: { effectiveType?: string; downlink?: number; rtt?: number };
    }).connection;
    if (conn) {
      patch({
        network: {
          effectiveType: conn.effectiveType ?? "unknown",
          downlink: conn.downlink ?? 0,
          rtt: conn.rtt ?? 0,
        },
      });
    }

    // Online/offline events (real).
    const onOnline = () => patch({ online: true });
    const onOffline = () => patch({ online: false });
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Real battery (level, charging) with change listeners.
    const navBattery = (
      navigator as unknown as {
        getBattery?: () => Promise<{
          level: number;
          charging: boolean;
          chargingTime: number;
          dischargingTime: number;
          addEventListener: (t: string, fn: () => void) => void;
          removeEventListener: (t: string, fn: () => void) => void;
        }>;
      }
    ).getBattery;

    const cleanups: Array<() => void> = [
      () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      },
    ];

    if (navBattery) {
      navBattery()
        .then((b) => {
          if (cancelled) return;
          const apply = () =>
            patch({
              battery: {
                level: b.level,
                charging: b.charging,
                chargingTime: b.chargingTime,
                dischargingTime: b.dischargingTime,
              },
            });
          apply();
          const onLevel = () => apply();
          const onCharge = () => apply();
          b.addEventListener("levelchange", onLevel);
          b.addEventListener("chargingchange", onCharge);
          cleanups.push(() => {
            b.removeEventListener("levelchange", onLevel);
            b.removeEventListener("chargingchange", onCharge);
          });
        })
        .catch(() => patch({ battery: null }));
    }

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return info;
}
