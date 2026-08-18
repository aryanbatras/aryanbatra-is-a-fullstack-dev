"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Markdown Editor — live split-pane editor with instant preview.
 * Uses marked.js loaded from CDN for parsing.
 */

const SAMPLE_MD = `# Welcome to Markdown Editor

This is a **live preview** markdown editor. Type on the left, see the result on the right.

## Features

- **Bold**, *italic*, ~~strikethrough~~
- [Links](https://example.com)
- Images, tables, code blocks
- Lists (ordered & unordered)

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello from Aryan OS!");
  return 42;
}
\`\`\`

## Table

| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| Live Preview | ✅ |
| Export HTML | ✅ |
| Dark Theme | ✅ |

## Blockquote

> "The best way to predict the future is to invent it."
> — Alan Kay

---

### Task List

- [x] Build markdown editor
- [x] Add live preview
- [ ] Write documentation
- [ ] Ship it!

---

*Start typing to see the live preview update instantly.*`;

declare global {
  interface Window {
    marked?: {
      parse: (md: string) => string;
    };
  }
}

export default function MarkdownApp() {
  const [markdown, setMarkdown] = useState(SAMPLE_MD);
  const [html, setHtml] = useState("");
  const [status, setStatus] = useState("Loading marked.js…");
  const previewRef = useRef<HTMLDivElement>(null);

  // Load marked.js from CDN
  useEffect(() => {
    if (window.marked) {
      setStatus("Ready");
      setHtml(window.marked.parse(SAMPLE_MD));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/marked@15.0.4/marked.min.js";
    script.onload = () => {
      setStatus("Ready");
      if (window.marked) {
        setHtml(window.marked.parse(SAMPLE_MD));
      }
    };
    script.onerror = () => setStatus("Failed to load marked.js");
    document.head.appendChild(script);
  }, []);

  const handleChange = useCallback((value: string) => {
    setMarkdown(value);
    if (window.marked) {
      setHtml(window.marked.parse(value));
    }
  }, []);

  const handleExport = useCallback(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #3b82f6; margin: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f5f5f5; }
    img { max-width: 100%; }
    a { color: #3b82f6; }
  </style>
</head>
<body>
${html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [html]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(html).catch(() => {});
  }, [html]);

  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  const charCount = markdown.length;
  const lineCount = markdown.split("\n").length;

  return (
    <div className={styles.markdownEditor}>
      {/* Toolbar */}
      <div className={styles.pgliteToolbar}>
        <FileText size={12} />
        <span className={styles.pgliteStatus}>{status}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            onClick={handleCopy}
            className={styles.playgroundBtn}
            title="Copy HTML"
          >
            Copy HTML
          </button>
          <button
            onClick={handleExport}
            className={styles.playgroundBtn}
            title="Export as HTML file"
          >
            Export HTML
          </button>
        </div>
      </div>

      {/* Split pane */}
      <div className={styles.markdownSplit}>
        {/* Editor */}
        <div className={styles.markdownEditorPane}>
          <div className={styles.markdownPaneHeader}>Markdown</div>
          <textarea
            className={styles.markdownTextarea}
            value={markdown}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Divider */}
        <div className={styles.markdownDivider} />

        {/* Preview */}
        <div className={styles.markdownPreviewPane}>
          <div className={styles.markdownPaneHeader}>Preview</div>
          <div
            ref={previewRef}
            className={styles.markdownPreview}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className={styles.pgliteToolbar}>
        <span className={styles.pgliteStatus}>
          {lineCount} lines · {wordCount} words · {charCount} chars
        </span>
      </div>
    </div>
  );
}
