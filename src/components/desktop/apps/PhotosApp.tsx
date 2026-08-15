import { useState } from "react";
import { PHOTOS } from "@/constants/video";
import styles from "@/styles/components/desktop/apps.module.css";

export default function PhotosApp() {
  const [selected, setSelected] = useState<string | null>(null);

  if (selected) {
    return (
      <div className={styles.photosViewer}>
        <div className={styles.photosTopbar}>
          <button type="button" className={styles.backBtn} onClick={() => setSelected(null)}>
            ← Gallery
          </button>
          <span>Showreel frame</span>
        </div>
        <div className={styles.photosStage}>
          <img src={selected} alt="Showreel frame" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.photos}>
      <div className={styles.photosHeader}>
        <strong>Showreel Frames</strong>
        <span>{PHOTOS.length} photos</span>
      </div>
      <div className={styles.photoGrid}>
        {PHOTOS.map((src, i) => (
          <button key={src} type="button" className={styles.photoTile} onClick={() => setSelected(src)}>
            <img src={src} alt={`Showreel frame ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
