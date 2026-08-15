import { useState } from "react";
import { ORIGINAL_VIDEOS } from "@/constants/video";
import styles from "@/styles/components/desktop/apps.module.css";

export default function VideosApp() {
  const [active, setActive] = useState<(typeof ORIGINAL_VIDEOS)[number] | null>(null);

  if (active) {
    return (
      <div className={styles.videosPlayer}>
        <div className={styles.photosTopbar}>
          <button type="button" className={styles.backBtn} onClick={() => setActive(null)}>
            ← Library
          </button>
          <span>{active.title}</span>
        </div>
        <video
          key={active.src}
          className={styles.videoPlayer}
          src={active.src}
          poster={active.poster}
          controls
          autoPlay
          playsInline
        />
      </div>
    );
  }

  return (
    <div className={styles.videos}>
      <div className={styles.videosHeader}>
        <strong>Library</strong>
        <span>{ORIGINAL_VIDEOS.length} films</span>
      </div>
      {ORIGINAL_VIDEOS.map((v) => (
        <button
          key={v.src}
          type="button"
          className={styles.videoCard}
          onClick={() => setActive(v)}
        >
          <img src={v.poster} alt={v.title} className={styles.videoThumb} />
          <span className={styles.videoMeta}>
            <strong>{v.title}</strong>
            <span>Full playback · with sound</span>
          </span>
          <span className={styles.playGlyph}>▶</span>
        </button>
      ))}
      <p className={styles.videosNote}>
        The same footage you scrubbed through above — here as a regular film.
      </p>
    </div>
  );
}
