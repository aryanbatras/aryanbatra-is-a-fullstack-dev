import { README_TEXT, RESUME } from "@/constants/desktop";
import styles from "@/styles/components/desktop/MacDesktop.module.css";

export interface QuickLookFile {
  id: string;
  name: string;
  kind: string;
  icon: string;
  size: string;
  appId: string;
  src?: string;
}

interface QuickLookProps {
  file: QuickLookFile;
  onClose: () => void;
}

/** Finder Quick Look (press Space on a selected file): a big glass preview. */
export default function QuickLook({ file, onClose }: QuickLookProps) {
  const preview = () => {
    if (file.id === "showreel") {
      return (
        <img
          src="/aryan/poster_001.jpg"
          alt="showreel poster"
          className={styles.quickLookMedia}
        />
      );
    }
    if (file.id === "resume") {
      return (
        <div className={styles.quickLookDoc}>
          <h4>
            {RESUME.name} — {RESUME.title}
          </h4>
          <p>{RESUME.summary}</p>
          <p>
            <strong>Latest:</strong> {RESUME.experience[0].role} @{" "}
            {RESUME.experience[0].company} ({RESUME.experience[0].period})
          </p>
        </div>
      );
    }
    if (file.id === "readme") {
      return (
        <pre className={styles.quickLookText}>
          {README_TEXT.split("\n").slice(0, 16).join("\n")}
          {"\n…"}
        </pre>
      );
    }
    if (file.id === "about") {
      return (
        <div className={styles.quickLookDoc}>
          <h4>About Me</h4>
          <p>{RESUME.summary.split("\n\n")[0]}</p>
        </div>
      );
    }
    if (file.kind === "PDF Document") {
      return (
        <div className={styles.quickLookDoc}>
          <h4>{file.name}</h4>
          <p>PDF document · double-click to open it in the viewer.</p>
        </div>
      );
    }
    if (file.kind === "Folder") {
      return (
        <div className={styles.quickLookFolder}>
          <span className={styles.quickLookFolderIcon}>{file.icon}</span>
          <span>{file.name} — a folder of real files</span>
        </div>
      );
    }
    return (
      <div className={styles.quickLookFolder}>
        <span className={styles.quickLookFolderIcon}>{file.icon}</span>
        <span>{file.name}</span>
      </div>
    );
  };

  return (
    <div className={styles.spotlightBackdrop} onClick={onClose}>
      <div
        className={styles.quickLook}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Quick Look: ${file.name}`}
      >
        <div className={styles.quickLookTop}>
          <span className={styles.quickLookIcon}>{file.icon}</span>
          <div>
            <strong>{file.name}</strong>
            <span>
              {file.kind} · {file.size} — double-click to open
            </span>
          </div>
        </div>
        <div className={styles.quickLookBody}>{preview()}</div>
        <span className={styles.quickLookHint}>Press Esc to close</span>
      </div>
    </div>
  );
}
