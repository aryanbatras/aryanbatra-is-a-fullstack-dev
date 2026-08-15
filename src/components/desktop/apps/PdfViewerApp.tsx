import { useEffect, useState } from "react";
import styles from "@/styles/components/desktop/apps.module.css";

interface PdfViewerAppProps {
  /** Public path to the PDF (e.g. /aryan/documents/a2b-offer-letter.pdf). */
  src: string;
  /** Window title shown in the toolbar. */
  title: string;
}

/**
 * Renders a PDF document (embed) with an honest state when the file
 * hasn't been added to the repo yet — the user drops the real file in and
 * it opens here with no further changes.
 */
export default function PdfViewerApp({ src, title }: PdfViewerAppProps) {
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    setExists(null);
    fetch(src, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setExists(res.ok);
      })
      .catch(() => {
        if (!cancelled) setExists(false);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  const fileName = src.split("/").pop() ?? src;

  return (
    <div className={styles.pdfViewer}>
      {exists === null ? (
        <div className={styles.pdfState}>
          <span className={styles.pdfStateIcon}>📄</span>
          <p>Opening {fileName}…</p>
        </div>
      ) : exists ? (
        <>
          <div className={styles.pdfToolbar}>
            <span className={styles.pdfTitle}>{title}</span>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className={styles.pdfOpenLink}
            >
              Open in new tab ↗
            </a>
          </div>
          <embed src={src} type="application/pdf" className={styles.pdfEmbed} />
        </>
      ) : (
        <div className={styles.pdfState}>
          <span className={styles.pdfStateIcon}>📄</span>
          <p className={styles.pdfStateTitle}>{title}</p>
          <p>
            This document isn't on this machine yet. Drop the real file at
          </p>
          <code className={styles.pdfStatePath}>public/aryan/documents/{fileName}</code>
          <p className={styles.pdfStateHint}>
            and it will open right here — nothing else to change.
          </p>
        </div>
      )}
    </div>
  );
}
