"use client";

import useSystemInfo, { formatBytes } from "@/hooks/useSystemInfo";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface AboutThisMacProps {
  onMoreInfo: () => void;
  onClose: () => void;
}

/**
 * Authentic "About This Mac" sheet — but every spec is REAL. It reads the
 * visitor's actual hardware and environment through browser APIs: CPU cores,
 * RAM, the GPU adapter name from WebGL, real origin storage usage/quota,
 * the real battery, and the real network. If a value can't be read, it says
 * so honestly instead of inventing a spec.
 */
export default function AboutThisMac({ onMoreInfo, onClose }: AboutThisMacProps) {
  const sys = useSystemInfo();

  const chip = sys.gpu
    ? sys.gpu.includes("Apple")
      ? sys.gpu
      : `Integrated Graphics — ${sys.gpu}`
    : null;

  const memory = sys.memoryGB != null ? `${sys.memoryGB} GB` : "Not reported by browser";
  const cores =
    sys.cpuCores != null
      ? `${sys.cpuCores} ${sys.cpuCores === 1 ? "core" : "cores"}`
      : "Not reported by browser";

  const storageUsed = sys.storage ? formatBytes(sys.storage.usage) : null;
  const storageTotal = sys.storage ? formatBytes(sys.storage.quota) : null;
  const storagePct = sys.storage && sys.storage.quota > 0
    ? Math.min(100, (sys.storage.usage / sys.storage.quota) * 100)
    : 0;

  const battery = sys.battery
    ? `${Math.round(sys.battery.level * 100)}% ${
        sys.battery.charging ? "· Charging" : ""
      }`
    : "No battery detected";

  const network = sys.network
    ? `${sys.online ? "Connected" : "Offline"} · ${
        sys.network.effectiveType || "unknown"
      }${sys.network.downlink ? ` · ${sys.network.downlink} Mbps` : ""}`
    : sys.online
      ? "Connected"
      : "Offline";

  const osLabel = `Aryan OS — running on ${sys.platform}${
    sys.platformVersion ? ` ${sys.platformVersion}` : ""
  }`;

  return (
    <div className={styles.aboutBackdrop} onClick={onClose}>
      <div
        className={styles.aboutSheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="About This Mac"
      >
        <div className={styles.aboutIcon}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        </div>

        <h3 className={styles.aboutTitle}>Aryan OS</h3>
        <p className={styles.aboutVersion}>{osLabel}</p>

        <div className={styles.aboutSpecs}>
          <div className={styles.aboutSpec}>
            <span>Processor</span>
            <span>{cores}</span>
          </div>
          <div className={styles.aboutSpec}>
            <span>Memory</span>
            <span>{memory}</span>
          </div>
          <div className={styles.aboutSpec}>
            <span>Graphics</span>
            <span>{chip ?? "Not reported by browser"}</span>
          </div>
          <div className={styles.aboutSpec}>
            <span>Battery</span>
            <span>{battery}</span>
          </div>
          <div className={styles.aboutSpec}>
            <span>Network</span>
            <span>{network}</span>
          </div>
        </div>

        {sys.storage && (
          <div className={styles.aboutStorage}>
            <div className={styles.aboutStorageRow}>
              <span>This site&apos;s storage</span>
              <span>
                {storageUsed} used of {storageTotal}
              </span>
            </div>
            <div className={styles.aboutStorageBar}>
              <span className={styles.aboutStorageUsed} style={{ width: `${storagePct}%` }} />
            </div>
          </div>
        )}

        <button
          type="button"
          className={styles.aboutMoreBtn}
          onClick={() => {
            onMoreInfo();
            onClose();
          }}
        >
          More Info…
        </button>

        <button type="button" className={styles.aboutClose} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
    </div>
  );
}
