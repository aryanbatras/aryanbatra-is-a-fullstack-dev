"use client";

import { useEffect, useRef, useState } from "react";

/**
 * DocsApp — A rich text document editor (Google Docs replacement).
 * Uses Quill.js loaded from CDN for WYSIWYG editing.
 */
export default function DocsApp() {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("Untitled Document");

  useEffect(() => {
    if (quillRef.current) return;

    const loadQuill = async () => {
      // Load Quill CSS
      if (!document.querySelector('link[href*="quill"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css";
        document.head.appendChild(link);
      }

      // Load Quill JS
      if (!(window as any).Quill) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js";
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      if (editorRef.current && (window as any).Quill) {
        const Quill = (window as any).Quill;
        quillRef.current = new Quill(editorRef.current, {
          theme: "snow",
          placeholder: "Start writing...",
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, 4, 5, 6, false] }],
              [{ font: [] }],
              [{ size: ["small", false, "large", "huge"] }],
              ["bold", "italic", "underline", "strike"],
              [{ color: [] }, { background: [] }],
              [{ script: "sub" }, { script: "super" }],
              ["blockquote", "code-block"],
              [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
              [{ indent: "-1" }, { indent: "+1" }],
              [{ align: [] }],
              ["link", "image", "video"],
              ["clean"],
            ],
          },
        });
        setReady(true);
      }
    };

    loadQuill();
  }, []);

  const handleDownload = () => {
    if (!quillRef.current) return;
    const html = quillRef.current.root.innerHTML;
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;color:#333}h1,h2,h3{color:#1a1a1a}pre{background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto}blockquote{border-left:4px solid #ddd;margin:0;padding-left:16px;color:#666}</style></head><body><h1>${title}</h1>${html}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
        borderBottom: "1px solid #e0e0e0", background: "#f8f9fa", flexShrink: 0,
      }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            border: "none", background: "transparent", fontSize: 16, fontWeight: 600,
            color: "#333", outline: "none", flex: 1, padding: "4px 0",
          }}
          placeholder="Document title..."
        />
        <button
          onClick={handleDownload}
          style={{
            padding: "6px 16px", border: "none", borderRadius: 6,
            background: "#1a73e8", color: "#fff", fontSize: 13, fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Download HTML
        </button>
        <button
          onClick={() => {
            if (!quillRef.current) return;
            const text = quillRef.current.getText();
            const blob = new Blob([text], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${title.replace(/\s+/g, "_")}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{
            padding: "6px 16px", border: "1px solid #dadce0", borderRadius: 6,
            background: "#fff", color: "#333", fontSize: 13, fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Download TXT
        </button>
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, overflow: "auto", padding: "0" }}>
        {!ready && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "100%", color: "#888", fontSize: 14,
          }}>
            Loading editor...
          </div>
        )}
        <div
          ref={editorRef}
          style={{
            minHeight: 400,
            display: ready ? "block" : "none",
          }}
        />
      </div>

      {/* Status bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", padding: "4px 16px",
        borderTop: "1px solid #e0e0e0", background: "#f8f9fa", fontSize: 12, color: "#666",
        flexShrink: 0,
      }}>
        <span>{title}</span>
        <span>
          {ready && quillRef.current
            ? `${quillRef.current.getLength().toLocaleString()} characters`
            : "Loading..."}
        </span>
      </div>
    </div>
  );
}
