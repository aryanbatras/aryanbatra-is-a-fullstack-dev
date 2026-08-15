import { useEffect, useRef, useState } from "react";
import ShapeBlur from "@/components/desktop/ShapeBlur";
import WidgetStack from "@/components/desktop/WidgetStack";
import { sounds } from "@/utils/sounds";
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
}

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

/** macOS-style lock screen: clock (four Tahoe appearances), date, password. */
export default function LockScreen({
  wallpaperSrc,
  onUnlock,
  clockStyle = "default",
  widgetStyle = "default",
  tint = null,
}: LockScreenProps) {
  const [now, setNow] = useState(new Date());
  const [pw, setPw] = useState("");
  const [shake, setShake] = useState(false);
  const [showWidgets, setShowWidgets] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const submit = () => {
    if (pw.trim().toLowerCase() === "aryan") {
      sounds.unlock();
      onUnlock();
    } else {
      sounds.error();
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
      setPw("");
    }
  };

  // The machine is a portfolio prop — nobody should be locked out of it.
  // Guests can skip the password (the lock still exists for the owner).
  const guest = () => {
    sounds.unlock();
    onUnlock();
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

  return (
    <div
      className={styles.lockScreen}
      style={{
        backgroundImage: `url(${wallpaperSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className={`${styles.lockContent} ${shake ? styles.lockShake : ""}`}
      >
        {/* Click the clock to reveal/hide lock-screen widgets (as on real macOS). */}
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

        {/* Liquid-glass ShapeBlur behind the avatar — a morphing glass
            squircle that follows the mouse, straight from React Bits. */}
        <div className={styles.lockAvatarWrap}>
          <div className={styles.lockAvatarShape} aria-hidden>
            <ShapeBlur
              variation={0}
              shapeSize={0.85}
              roundness={0.9}
              borderSize={0.045}
              circleSize={0.5}
              circleEdge={0.35}
            />
          </div>
          <img
            src="/images/aryan.jpeg"
            alt="Aryan Batra"
            className={styles.lockAvatarImg}
          />
        </div>
        <span className={styles.lockName}>Aryan Batra</span>
        <span className={styles.lockMachine}>Aryan&apos;s MacBook Pro</span>

        <div className={styles.lockPwWrap}>
          {/* Subtle ShapeBlur morph behind the password field. */}
          <div className={styles.lockPwShape} aria-hidden>
            <ShapeBlur
              variation={0}
              shapeSize={1.7}
              roundness={0.5}
              borderSize={0.05}
              circleSize={0.6}
              circleEdge={0.5}
            />
          </div>
          <input
            ref={inputRef}
            className={styles.lockInput}
            type={showPw ? "text" : "password"}
            value={pw}
            placeholder="Enter Password"
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            autoComplete="off"
            spellCheck={false}
            aria-label="Password"
          />
          <button
            type="button"
            className={styles.lockPwToggle}
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? (
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4S1.5 8 1.5 8Z" />
                <path d="M6.5 8a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M1.5 8s2.4-4 6.5-4 6.5 4 6.5 4-2.4 4-6.5 4S1.5 8 1.5 8Z" />
                <path d="M10.5 2.7A6.9 6.9 0 0 0 8 2.3C3.9 2.3 1.5 6.3 1.5 6.3" />
                <path d="M14.5 8s-.3.6-.9 1.3" />
                <path d="M3.4 12.3 1 15" />
                <path d="M10.7 6.2A2.5 2.5 0 0 0 7.6 9.4" />
              </svg>
            )}
          </button>
        </div>
        <span className={styles.lockHint}>password: aryan</span>
        <button type="button" className={styles.lockGuest} onClick={guest}>
          Enter as guest →
        </button>
      </div>

      {showWidgets && (
        <div className={styles.lockWidgets}>
          <WidgetStack widgetStyle={widgetStyle} tint={tint} />
        </div>
      )}
    </div>
  );
}
