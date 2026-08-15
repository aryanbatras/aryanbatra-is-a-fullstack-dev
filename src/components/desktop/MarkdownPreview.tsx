"use client";

import { useMemo } from "react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * A tiny markdown renderer — the daedalOS "Marked" equivalent, client-side.
 * Shared by TextEdit's Preview mode and the Markdown viewer app.
 */
export default function MarkdownPreview({ text }: { text: string }) {
  const blocks = useMemo(() => splitBlocks(text), [text]);
  return (
    <div className={styles.md}>
      {blocks.map((b, i) => (
        <MarkdownBlock key={i} block={b} />
      ))}
    </div>
  );
}

function splitBlocks(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<span key={`${keyBase}-${k++}`}>{text.slice(last, m.index)}</span>);
    const tok = m[0];
    if (tok.startsWith("`")) {
      out.push(
        <code key={`${keyBase}-${k++}`} className={styles.mdCode}>
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("**")) {
      out.push(<strong key={`${keyBase}-${k++}`}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("*")) {
      out.push(<em key={`${keyBase}-${k++}`}>{tok.slice(1, -1)}</em>);
    } else {
      const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      if (link) {
        out.push(
          <a key={`${keyBase}-${k++}`} href={link[2]} target="_blank" rel="noreferrer" className={styles.mdLink}>
            {link[1]}
          </a>,
        );
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(<span key={`${keyBase}-${k++}`}>{text.slice(last)}</span>);
  return out;
}

function MarkdownBlock({ block }: { block: string }) {
  if (/^```/.test(block)) {
    const code = block.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
    return (
      <pre className={styles.mdPre}>
        <code>{code}</code>
      </pre>
    );
  }
  if (/^#{1,6}\s/.test(block)) {
    const level = block.match(/^(#+)/)![1].length;
    const text = block.replace(/^#+\s/, "");
    const Tag = (`h${Math.min(level, 4)}`) as "h1";
    return <Tag className={styles.mdHeading}>{inline(text, "h")}</Tag>;
  }
  if (/^>\s/.test(block)) {
    const text = block.replace(/^>\s?/, "");
    return <blockquote className={styles.mdQuote}>{inline(text, "q")}</blockquote>;
  }
  const listLines = block.split("\n").filter((l) => /^\s*[-*+]\s/.test(l));
  if (listLines.length === block.split("\n").length && listLines.length > 0) {
    return (
      <ul className={styles.mdList}>
        {listLines.map((l, i) => (
          <li key={i}>{inline(l.replace(/^\s*[-*+]\s/, ""), `li-${i}`)}</li>
        ))}
      </ul>
    );
  }
  const numLines = block.split("\n").filter((l) => /^\s*\d+\.\s/.test(l));
  if (numLines.length === block.split("\n").length && numLines.length > 0) {
    return (
      <ol className={styles.mdList}>
        {numLines.map((l, i) => (
          <li key={i}>{inline(l.replace(/^\s*\d+\.\s/, ""), `ol-${i}`)}</li>
        ))}
      </ol>
    );
  }
  const paras = block.split("\n").filter(Boolean);
  if (paras.length > 1) {
    return (
      <>
        {paras.map((p, i) => (
          <p key={i} className={styles.mdP}>
            {inline(p, `p-${i}`)}
          </p>
        ))}
      </>
    );
  }
  return <p className={styles.mdP}>{inline(block, "p")}</p>;
}
