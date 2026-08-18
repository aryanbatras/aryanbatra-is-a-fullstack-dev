"use client";

import { memo, useState } from "react";
import {
  Wifi, Bluetooth, Sun, Volume2, Moon, Plane,
  RotateCcw, Flashlight, Camera, Lock, Timer,
} from "lucide-react";
import { hapticMedium, hapticLight } from "@/utils/touch";
import styles from "@/styles/components/mobile/MobileControlCenter.module.css";

interface MobileControlCenterProps {
  brightness: number;
  volume: number;
  dndOn: boolean;
  onBrightnessChange: (v: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleDnd: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}

/**
 * iOS-style Control Center with full toggle grid, sliders, and quick actions.
 * Opens from bottom on swipe-up or from settings gear.
 */
const MobileControlCenter = memo(function MobileControlCenter({
  brightness,
  volume,
  dndOn,
  onBrightnessChange,
  onVolumeChange,
  onToggleDnd,
  onOpenSettings,
  onClose,
}: MobileControlCenterProps) {
  const [wifiOn, setWifiOn] = useState(true);
  const [btOn, setBtOn] = useState(true);
  const [airplaneOn, setAirplaneOn] = useState(false);

  return (
    <div className={styles.ccBackdrop} onClick={onClose}>
      <div className={styles.ccPanel} onClick={(e) => e.stopPropagation()}>
        {/* Drag handle */}
        <div className={styles.ccHandle} />

        {/* Connectivity section — 2x2 grid like iOS */}
        <div className={styles.ccSection}>
          <div className={styles.ccGrid2x2}>
            <button
              type="button"
              className={`${styles.ccTile} ${wifiOn ? styles.ccTileActive : ""}`}
              onClick={() => { hapticLight(); setWifiOn(!wifiOn); }}
            >
              <span className={styles.ccTileIcon}><Wifi size={16} /></span>
              <span className={styles.ccTileLabel}>Wi-Fi</span>
              <span className={styles.ccTileSub}>{wifiOn ? "Home" : "Off"}</span>
            </button>
            <button
              type="button"
              className={`${styles.ccTile} ${btOn ? styles.ccTileActive : ""}`}
              onClick={() => { hapticLight(); setBtOn(!btOn); }}
            >
              <span className={styles.ccTileIcon}><Bluetooth size={16} /></span>
              <span className={styles.ccTileLabel}>Bluetooth</span>
              <span className={styles.ccTileSub}>{btOn ? "On" : "Off"}</span>
            </button>
            <button
              type="button"
              className={`${styles.ccTile} ${airplaneOn ? styles.ccTileActive : ""}`}
              onClick={() => { hapticLight(); setAirplaneOn(!airplaneOn); }}
            >
              <span className={styles.ccTileIcon}><Plane size={16} /></span>
              <span className={styles.ccTileLabel}>Airplane</span>
              <span className={styles.ccTileSub}>{airplaneOn ? "On" : "Off"}</span>
            </button>
            <button
              type="button"
              className={`${styles.ccTile} ${dndOn ? styles.ccTileActive : ""}`}
              onClick={() => { hapticLight(); onToggleDnd(); }}
            >
              <span className={styles.ccTileIcon}><Moon size={16} /></span>
              <span className={styles.ccTileLabel}>Focus</span>
              <span className={styles.ccTileSub}>{dndOn ? "On" : "Off"}</span>
            </button>
          </div>
        </div>

        {/* Brightness + Volume — tall vertical sliders like iOS */}
        <div className={styles.ccSection}>
          <div className={styles.ccSlidersRow}>
            <div className={styles.ccVerticalSlider}>
              <Sun size={14} />
              <div className={styles.ccVerticalTrack}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={brightness}
                  className={styles.ccVerticalInput}
                  onChange={(e) => onBrightnessChange(Number(e.target.value))}
                  aria-label="Brightness"
                />
                <div
                  className={styles.ccVerticalFill}
                  style={{ height: `${brightness}%` }}
                />
              </div>
            </div>
            <div className={styles.ccVerticalSlider}>
              <Volume2 size={14} />
              <div className={styles.ccVerticalTrack}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  className={styles.ccVerticalInput}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  aria-label="Volume"
                />
                <div
                  className={styles.ccVerticalFill}
                  style={{ height: `${volume}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick action toggles — 2x2 grid */}
        <div className={styles.ccSection}>
          <div className={styles.ccGrid2x2}>
            <button
              type="button"
              className={`${styles.ccQuickTile}`}
              onClick={() => { hapticLight(); }}
            >
              <Flashlight size={20} />
              <span>Flashlight</span>
            </button>
            <button
              type="button"
              className={`${styles.ccQuickTile}`}
              onClick={() => { hapticLight(); }}
            >
              <Timer size={20} />
              <span>Timer</span>
            </button>
            <button
              type="button"
              className={`${styles.ccQuickTile}`}
              onClick={() => { hapticLight(); }}
            >
              <Camera size={20} />
              <span>Calculator</span>
            </button>
            <button
              type="button"
              className={`${styles.ccQuickTile}`}
              onClick={() => { hapticLight(); }}
            >
              <Lock size={20} />
              <span>Lock</span>
            </button>
          </div>
        </div>

        {/* Settings + Restart */}
        <div className={styles.ccFooter}>
          <button
            type="button"
            className={styles.ccFooterBtn}
            onClick={() => { hapticMedium(); onOpenSettings(); onClose(); }}
          >
            ⚙️ Settings
          </button>
          <button
            type="button"
            className={styles.ccFooterBtn}
            onClick={() => { hapticMedium(); location.reload(); }}
          >
            <RotateCcw size={14} /> Restart
          </button>
        </div>
      </div>
    </div>
  );
});

export default MobileControlCenter;
