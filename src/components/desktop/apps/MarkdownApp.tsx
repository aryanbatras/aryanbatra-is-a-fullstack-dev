"use client";

import { FilePen, FileText } from "lucide-react";
import MarkdownPreview from "@/components/desktop/MarkdownPreview";
import Glyph from "@/components/desktop/Glyph";
import { readFiles } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

interface MarkdownAppProps {
  /** File name shown in the header (e.g. notes.md). */
  name?: string;
  /** Markdown source to render. */
  content?: string;
  /** Optional: open the same file in TextEdit. */
  onEdit?: () => void;
}

/**
 * Markdown viewer — the daedalOS "Marked" app: .md files from Finder render
 * as clean HTML instead of raw text. "Edit in TextEdit" jumps to the source.
 */
export default function MarkdownApp({ name, content, onEdit }: MarkdownAppProps) {
  // Finder hands over only the file name — load the source from storage.
  const body = content ?? readFiles().find((f) => f.name === name)?.content ?? "";
  return (
    <div className={styles.markdownApp}>
      <div className={styles.markdownBar}>
        <span className={styles.markdownIcon}>
          <Glyph id="book-open" size={15} />
        </span>
        <span className={styles.markdownName}>{name ?? "Untitled.md"}</span>
        {onEdit && (
          <button type="button" className={styles.texteditBtn} onClick={onEdit}>
            <FilePen size={13} /> Edit in TextEdit
          </button>
        )}
        <span className={styles.markdownFileType}>
          <FileText size={11} /> Markdown
        </span>
      </div>
      <div className={styles.markdownScroll}>
        <MarkdownPreview text={body} />
      </div>
    </div>
  );
}
