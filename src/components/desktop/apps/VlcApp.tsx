import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Maximize2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { ORIGINAL_VIDEOS } from "@/constants/video";
import { readFiles } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

interface VlcAppProps {
  /** Movie file opened from Finder — loaded from storage by name. */
  file?: string;
}

/**
 * VLC — a VLC-styled media player (the daedalOS VideoPlayer equivalent).
 * Plays the showreel library by default; opening a .mp4/.mov/.webm from
 * Finder boots straight into that file. Custom VLC-style controls: play /
 * pause, seek bar with buffered progress, volume, fullscreen, next/prev.
 */
export default function VlcApp({ file }: VlcAppProps) {
  const videos = ORIGINAL_VIDEOS.map((v, i) => ({ ...v, id: `film-${i}` }));
  // A Finder movie is resolved from the file system (data URL) and played as
  // its own single-track "playlist".
  const [tracks] = useState(() => {
    if (!file) return videos;
    const stored = readFiles().find((x) => x.name === file);
    if (stored?.content) return [{ src: stored.content, poster: "", title: file }];
    return [{ src: file, poster: "", title: file.split("/").pop() ?? "Movie" }];
  });
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const track = tracks[current];

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const next = () => {
    if (tracks.length > 1) {
      setCurrent((c) => (c + 1) % tracks.length);
      setTime(0);
    }
  };

  const prev = () => {
    if (tracks.length > 1) {
      setCurrent((c) => (c - 1 + tracks.length) % tracks.length);
      setTime(0);
    } else {
      const v = videoRef.current;
      if (v) v.currentTime = 0;
    }
  };

  const fmt = (s: number) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  // Auto-advance to the next track at the end of each film.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnded = () => {
      if (tracks.length > 1) setCurrent((c) => (c + 1) % tracks.length);
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, [tracks.length]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = volume;
    v.muted = muted;
  }, [volume, muted]);

  return (
    <div ref={wrapRef} className={styles.vlcWrap} data-vlc>
      <div className={styles.vlcStage}>
        <video
          key={track.src}
          ref={videoRef}
          className={styles.vlcVideo}
          src={track.src}
          poster={track.poster || undefined}
          playsInline
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />
        {!playing && (
          <button
            type="button"
            className={styles.vlcBigPlay}
            onClick={togglePlay}
            aria-label="Play"
          >
            <Play size={30} fill="currentColor" />
          </button>
        )}
      </div>

      <div className={styles.vlcBar}>
        <div className={styles.vlcTitle}>
          <strong>{track.title}</strong>
          <span>{current + 1} / {tracks.length}</span>
        </div>
        <div className={styles.vlcSeekRow}>
          <span className={styles.vlcTime}>{fmt(time)}</span>
          <input
            type="range"
            className={styles.vlcSeek}
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(time, duration || 0)}
            onChange={(e) => {
              const v = videoRef.current;
              if (v) v.currentTime = Number(e.target.value);
              setTime(Number(e.target.value));
            }}
            aria-label="Seek"
          />
          <span className={styles.vlcTime}>{fmt(duration)}</span>
        </div>
        <div className={styles.vlcControls}>
          <div className={styles.vlcControlsLeft}>
            <button type="button" className={styles.vlcBtn} onClick={prev} aria-label="Previous">
              <SkipBack size={16} />
            </button>
            <button type="button" className={styles.vlcBtn} onClick={togglePlay} aria-label="Play/Pause">
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button type="button" className={styles.vlcBtn} onClick={next} aria-label="Next">
              <SkipForward size={16} />
            </button>
          </div>
          <div className={styles.vlcControlsRight}>
            <button
              type="button"
              className={styles.vlcBtn}
              onClick={() => setMuted((m) => !m)}
              aria-label="Mute"
            >
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              className={styles.vlcVolume}
              min={0}
              max={1}
              step={0.02}
              value={volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setMuted(false);
              }}
              aria-label="Volume"
            />
            <button
              type="button"
              className={styles.vlcBtn}
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
