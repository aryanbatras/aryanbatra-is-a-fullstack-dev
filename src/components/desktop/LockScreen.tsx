import { useCallback, useEffect, useRef, useState } from "react";
import LiquidGlass from "@/components/desktop/LiquidGlass";
import WidgetStack from "@/components/desktop/WidgetStack";
import { sounds } from "@/utils/sounds";
import { SCRUB_VIDEO_A } from "@/constants/video";
import type { ClockStyle, WidgetStyle } from "@/constants/desktop";
import type { WallpaperTint } from "@/hooks/useWallpaperTint";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

interface LockScreenProps {
  wallpaperSrc: string;
  onUnlock: () => void;
  /** Lock-screen clock appearance (macOS Tahoe: Settings → Wallpaper → Clock). */
  clockStyle?: ClockStyle;
  /** Tahoe Icon & Widget Style — forwarded to the lock-screen widgets. */
  widgetStyle?: WidgetStyle;
  tint?: WallpaperTint | null;
  /** Power menu (top-right of the real lock screen). */
  onSleep?: () => void;
  onRestart?: () => void;
  onShutDown?: () => void;
  /** Display brightness 0-100 — clicking the screen after Sleep wakes it. */
  brightness?: number;
  onWake?: () => void;
}

const OWNER = {
  id: "aryan",
  name: "Aryan Batra",
  avatar: "/images/aryan.jpeg",
};

/** Analog clock face with live hour/minute/second hands. */
function AnalogClock({ now }: { now: Date }) {
  const h = ((now.getHours() % 12) + now.getMinutes() / 60) * 30;
  const m = (now.getMinutes() + now.getSeconds() / 60) * 6;
  const s = now.getSeconds() * 6;
  return (
    <svg
      className={styles.lockAnalog}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Analog clock showing ${now.toLocaleTimeString()}`}
    >
      <circle cx="50" cy="50" r="47" fill="rgba(255,255,255,0.08)" />
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2"
      />
      {/* hour markers */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x1 = 50 + Math.sin(a) * 40;
        const y1 = 50 - Math.cos(a) * 40;
        const x2 = 50 + Math.sin(a) * 44;
        const y2 = 50 - Math.cos(a) * 44;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.8)"
            strokeWidth={i % 3 === 0 ? 2.4 : 1.2}
          />
        );
      })}
      <g transform={`rotate(${h} 50 50)`}>
        <line x1="50" y1="50" x2="50" y2="30" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      </g>
      <g transform={`rotate(${m} 50 50)`}>
        <line x1="50" y1="50" x2="50" y2="20" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <g transform={`rotate(${s} 50 50)`}>
        <line x1="50" y1="54" x2="50" y2="16" stroke="#ff5f57" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <circle cx="50" cy="50" r="2.6" fill="#fff" />
    </svg>
  );
}

/**
 * macOS-style lock screen: a big thin clock + date at the top of the screen,
 * the user avatar (with a liquid-glass ring), name and password field centred
 * lower down — exactly how macOS lays it out. The top bar holds the
 * user-switching chevron (left) and the power menu (right). Clicking the
 * clock or anywhere on the wallpaper reveals the lock-screen widgets.
 */
export default function LockScreen({
  wallpaperSrc,
  onUnlock,
  clockStyle = "default",
  widgetStyle = "default",
  tint = null,
  onSleep,
  onRestart,
  onShutDown,
  brightness = 100,
  onWake,
}: LockScreenProps) {
  const [now, setNow] = useState(new Date());
  const [showWidgets, setShowWidgets] = useState(false);
  const [powerOpen, setPowerOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [swipeY, setSwipeY] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartY = useRef<number | null>(null);

  // Swipe-up gesture for mobile unlock
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const dy = touchStartY.current - e.touches[0].clientY;
    if (dy > 0) setSwipeY(Math.min(dy, 200));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swipeY > 100) {
      loginAsGuest();
    }
    setSwipeY(0);
    touchStartY.current = null;
  }, [swipeY]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // One-click Log In — enters the desktop directly (no password required).
  const loginAsGuest = () => {
    sounds.unlock();
    onUnlock();
  };

  // Watch the showreel at 1.5x speed, then return to lock screen.
  const openWatchVideo = () => {
    setShowVideo(true);
  };

  const closeWatchVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setShowVideo(false);
  };

  const time = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Swipe-up offset for the user area
  const swipeOffset = Math.max(0, swipeY * 0.5);
  const swipeOpacity = Math.max(0, 1 - swipeY / 150);

  return (
    <div
      className={styles.lockScreen}
      style={{
        backgroundImage: `url(${wallpaperSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        // First click after Sleep wakes the display (like a real Mac).
        if (brightness === 0) {
          onWake?.();
          return;
        }
        setShowWidgets((v) => !v);
      }}
    >
      {/* Gentle scrim so the clock and user block stay legible on bright
          wallpaper — macOS never frosts the lock-screen wallpaper itself. */}
      <div className={styles.lockScrim} aria-hidden />

      {/* Top bar — Watch Original Video on the left, power menu on the right. */}
      <div className={styles.lockTopBar}>
        {/* Top-left: Watch Original Video button. */}
        <div className={styles.lockWatchVideoWrap} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.lockTopBtn}
            onClick={openWatchVideo}
            aria-label="Watch Original Video"
          >
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="5,3 13,8 5,13" fill="currentColor" stroke="none" />
            </svg>
            <span style={{ marginLeft: 5, fontSize: 11, fontWeight: 500 }}>Watch Video</span>
          </button>
        </div>
        {/* Top-right: power menu (Sleep / Restart / Shut Down). */}
        <div className={styles.lockPowerWrap} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.lockTopBtn}
            onClick={() => setPowerOpen((v) => !v)}
            aria-label="Power options"
          >
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M8 1.8v5.4" />
              <path d="M12.4 3.6a6 6 0 1 1-8.8 0" />
            </svg>
          </button>
          {powerOpen && (
            <div className={styles.lockPowerMenu}>
              <button
                type="button"
                className={styles.lockPowerItem}
                onClick={() => {
                  setPowerOpen(false);
                  onSleep?.();
                }}
              >
                Sleep
              </button>
              <button
                type="button"
                className={styles.lockPowerItem}
                onClick={() => {
                  setPowerOpen(false);
                  onRestart?.();
                }}
              >
                Restart…
              </button>
              <button
                type="button"
                className={styles.lockPowerItem}
                onClick={() => {
                  setPowerOpen(false);
                  onShutDown?.();
                }}
              >
                Shut Down…
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Big thin clock + date near the top of the screen. */}
      <div className={styles.lockClockArea} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`${styles.lockClockBtn} ${
            showWidgets ? styles.lockClockBtnActive : ""
          }`}
          onClick={() => setShowWidgets((v) => !v)}
          aria-label="Toggle lock screen widgets"
        >
          {clockStyle === "analog" ? (
            <AnalogClock now={now} />
          ) : clockStyle === "world" ? (
            <div className={styles.lockWorld}>
              <span className={styles.lockWorldTime}>{time}</span>
              <span className={styles.lockWorldCity}>New Delhi</span>
            </div>
          ) : (
            <div
              className={`${styles.lockClock} ${
                clockStyle === "numeric" ? styles.lockClockNumeric : ""
              }`}
            >
              <span className={styles.lockClockTime}>{time}</span>
              {clockStyle !== "numeric" && (
                <span className={styles.lockClockSec}>{seconds}</span>
              )}
            </div>
          )}
          <span className={styles.lockDate}>{dateLabel}</span>
        </button>
      </div>

      {/* User block — avatar ring, name, one-click login. macOS lock screen
          shows the owner here; no password required for this portfolio. */}
      <div
        className={styles.lockUserArea}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.lockAvatar} aria-hidden>
          {/* Liquid glass ring behind the avatar — refractive squircle rim
              refracting the wallpaper (Chrome), blurred fallback elsewhere. */}
          <LiquidGlass
            id="lg-lock-avatar"
            radius={46}
            bezel={15}
            surface="squircle"
            thickness={4.5}
            maxShift={9}
            highlight={0.8}
            className={styles.lockAvatarShape}
          />
          <img
            src={OWNER.avatar}
            alt=""
            className={styles.lockAvatarImg}
            draggable={false}
          />
        </div>
        <span className={styles.lockName}>{OWNER.name}</span>

        {/* Log In — one click and you're in. No password field. */}
        <button
          type="button"
          className={styles.lockLoginBtn}
          onClick={loginAsGuest}
        >
          Log In
        </button>

        {/* Mobile: swipe up indicator */}
        <div className={styles.lockSwipeHint}>
          <div className={styles.lockSwipeLine} />
          <span className={styles.lockSwipeText}>Swipe up to unlock</span>
        </div>
      </div>

      {showWidgets && (
        <div className={styles.lockWidgets} onClick={(e) => e.stopPropagation()}>
          <WidgetStack widgetStyle={widgetStyle} tint={tint} />
        </div>
      )}

      {/* Full-screen showreel video overlay — plays at 3× then returns. */}
      {showVideo && (
        <div
          className={styles.videoOverlay}
          onClick={closeWatchVideo}
        >
          <video
            ref={videoRef}
            src={SCRUB_VIDEO_A}
            poster="/aryan/poster_a.webp"
            className={styles.videoOverlayPlayer}
            autoPlay
            playsInline
            onLoadedData={() => {
              if (videoRef.current) videoRef.current.playbackRate = 3;
            }}
            onEnded={closeWatchVideo}
          />
          <button
            type="button"
            className={styles.videoOverlayClose}
            onClick={closeWatchVideo}
            aria-label="Close video"
          >
            <svg viewBox="0 0 16 16" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
