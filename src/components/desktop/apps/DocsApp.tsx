"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * DocsApp — Google Docs-like rich text editor.
 * Auto-saves to localStorage, multiple documents, page layout,
 * word count, find & replace, print, export.
 */

interface Doc {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

const STORAGE_KEY = "docsapp-documents";

function loadDocs(): Doc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDocs(docs: Doc[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(docs)); } catch {}
}

function createDoc(title?: string): Doc {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: title || "Untitled Document",
    content: "",
    updatedAt: Date.now(),
  };
}

export default function DocsApp() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [docs, setDocs] = useState<Doc[]>(() => {
    const existing = loadDocs();
    return existing.length ? existing : [createDoc()];
  });
  const [activeId, setActiveId] = useState<string>(() => docs[0].id);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [saved, setSaved] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const activeDoc = docs.find((d) => d.id === activeId) || docs[0];

  // Load Quill
  useEffect(() => {
    const load = async () => {
      if ((window as any).Quill) return;
      // CSS
      if (!document.querySelector('link[href*="quill"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css";
        document.head.appendChild(link);
      }
      // JS
      await new Promise<void>((resolve, reject) => {
        if ((window as any).Quill) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js";
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
      });
    };
    load();
  }, []);

  // Initialize Quill when editor mounts
  useEffect(() => {
    if (!(window as any).Quill || !editorRef.current) return;
    const Quill = (window as any).Quill;

    const q = new Quill(editorRef.current, {
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

    // Load content
    if (activeDoc.content) {
      q.root.innerHTML = activeDoc.content;
    }

    // Listen for changes
    q.on("text-change", () => {
      const html = q.root.innerHTML;
      const text = q.getText();
      setCharCount(text.length);
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      setSaved(false);

      // Auto-save after 1s of inactivity
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        setDocs((prev) =>
          prev.map((d) =>
            d.id === activeId
              ? { ...d, content: html, updatedAt: Date.now() }
              : d,
          ),
        );
        setSaved(true);
      }, 1000);
    });

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Save on doc switch
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    saveDocs(docs);
  }, [docs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowFind((s) => !s);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        setDocs((prev) =>
          prev.map((d) =>
            d.id === activeId
              ? { ...d, content: editorRef.current?.innerHTML || d.content, updatedAt: Date.now() }
              : d,
          ),
        );
        setSaved(true);
      }
      if (e.key === "Escape") {
        setShowFind(false);
        setContextMenu(null);
        setShowExport(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeId]);

  const switchDoc = (id: string) => {
    // Save current
    if (editorRef.current) {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === activeId
            ? { ...d, content: editorRef.current!.innerHTML, updatedAt: Date.now() }
            : d,
        ),
      );
    }
    setActiveId(id);
  };

  const newDoc = () => {
    const doc = createDoc();
    setDocs((prev) => [doc, ...prev]);
    switchDoc(doc.id);
  };

  const deleteDoc = (id: string) => {
    if (docs.length <= 1) return;
    setDocs((prev) => {
      const next = prev.filter((d) => d.id !== id);
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const updateTitle = (title: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === activeId ? { ...d, title, updatedAt: Date.now() } : d)),
    );
  };

  const findReplace = (replace: boolean) => {
    if (!editorRef.current || !findQuery) return;
    const q = (window as any).Quill?.find?.(editorRef.current);
    if (!q) return;
    const text = q.getText();
    const idx = text.indexOf(findQuery);
    if (idx >= 0) {
      q.setSelection(idx, findQuery.length);
      if (replace && replaceQuery) {
        q.deleteText(idx, findQuery.length);
        q.insertText(idx, replaceQuery);
      }
    }
  };

  const handleExport = (format: string) => {
    const html = editorRef.current?.innerHTML || "";
    const title = activeDoc.title;
    let blob: Blob;
    let ext: string;

    switch (format) {
      case "html":
        blob = new Blob([
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.7;color:#333}
h1{font-size:28px;margin-bottom:16px}h2{font-size:22px;margin:16px 0 8px}h3{font-size:18px;margin:12px 0 6px}
pre{background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto}blockquote{border-left:4px solid #4285f4;margin:12px 0;padding-left:16px;color:#555}
img{max-width:100%}a{color:#1a73e8}</style></head><body><h1>${title}</h1>${html}</body></html>`,
        ], { type: "text/html" });
        ext = "html";
        break;
      case "txt":
        blob = new Blob([editorRef.current?.innerText || ""], { type: "text/plain" });
        ext = "txt";
        break;
      case "md":
        // Basic HTML to Markdown conversion
        let md = html
          .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
          .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
          .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
          .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
          .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
          .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
          .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
          .replace(/<u[^>]*>(.*?)<\/u>/gi, "_${1}_")
          .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
          .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
          .replace(/<[^>]+>/g, "")
          .trim();
        blob = new Blob([`# ${title}\n\n${md}`], { type: "text/markdown" });
        ext = "md";
        break;
      default: return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const handlePrint = () => {
    const html = editorRef.current?.innerHTML || "";
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${activeDoc.title}</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;line-height:1.7;color:#333}
h1{font-size:28px}h2{font-size:22px}h3{font-size:18px}
pre{background:#f5f5f5;padding:12px;border-radius:4px}blockquote{border-left:4px solid #4285f4;padding-left:16px;color:#555}
@media print{body{margin:0}}</style></head><body><h1>${activeDoc.title}</h1>${html}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={{ display: "flex", height: "100%", background: "#f8f9fa", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Sidebar — document list */}
      {showSidebar && (
        <div style={{
          width: 220, background: "#fff", borderRight: "1px solid #e0e0e0",
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}>
          <div style={{
            padding: "12px", borderBottom: "1px solid #e0e0e0",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>📝</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>Docs</span>
            <div style={{ flex: 1 }} />
            <button
              onClick={newDoc}
              style={{
                width: 28, height: 28, borderRadius: "50%", border: "none",
                background: "#1a73e8", color: "#fff", fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title="New document"
            >+</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {docs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => switchDoc(doc.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY });
                }}
                style={{
                  padding: "10px 12px", cursor: "pointer",
                  background: doc.id === activeId ? "#e8f0fe" : "transparent",
                  borderLeft: doc.id === activeId ? "3px solid #1a73e8" : "3px solid transparent",
                  transition: "all 0.1s",
                }}
              >
                <div style={{
                  fontSize: 13, fontWeight: doc.id === activeId ? 600 : 400,
                  color: doc.id === activeId ? "#1a73e8" : "#333",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{doc.title}</div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main editor area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "6px 16px",
          borderBottom: "1px solid #e0e0e0", background: "#fff", flexShrink: 0,
        }}>
          <button
            onClick={() => setShowSidebar((s) => !s)}
            style={{
              width: 32, height: 32, borderRadius: 6, border: "none",
              background: "transparent", fontSize: 16, cursor: "pointer", color: "#666",
            }}
            title="Toggle sidebar"
          >☰</button>

          <input
            ref={titleInputRef}
            value={activeDoc.title}
            onChange={(e) => updateTitle(e.target.value)}
            style={{
              border: "none", background: "transparent", fontSize: 18, fontWeight: 600,
              color: "#333", outline: "none", flex: 1, padding: "4px 0",
            }}
            placeholder="Untitled Document"
          />

          <span style={{
            fontSize: 11, color: saved ? "#34a853" : "#fbbc04", padding: "2px 8px",
            borderRadius: 4, background: saved ? "#e6f4ea" : "#fef7e0",
          }}>
            {saved ? "✓ Saved" : "Saving..."}
          </span>

          <button onClick={() => setShowFind((s) => !s)} style={topBtnStyle} title="Find & Replace (Ctrl+F)">🔍</button>
          <button onClick={handlePrint} style={topBtnStyle} title="Print">🖨️</button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowExport((s) => !s)} style={topBtnStyle}>📥</button>
            {showExport && (
              <div style={{
                position: "absolute", top: 36, right: 0, background: "#fff",
                border: "1px solid #e0e0e0", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                padding: 4, zIndex: 100, minWidth: 140,
              }}>
                {["html", "txt", "md"].map((f) => (
                  <button key={f} onClick={() => handleExport(f)} style={exportBtnStyle}>
                    Export as .{f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Find & Replace bar */}
        {showFind && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "6px 16px",
            borderBottom: "1px solid #e0e0e0", background: "#fff", flexShrink: 0,
          }}>
            <span style={{ fontSize: 12, color: "#666" }}>Find:</span>
            <input
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && findReplace(false)}
              style={findInputStyle}
              autoFocus
              placeholder="Search..."
            />
            <span style={{ fontSize: 12, color: "#666" }}>Replace:</span>
            <input
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && findReplace(true)}
              style={findInputStyle}
              placeholder="Replace with..."
            />
            <button onClick={() => findReplace(false)} style={findBtnStyle}>Find</button>
            <button onClick={() => findReplace(true)} style={findBtnStyle}>Replace</button>
            <button onClick={() => setShowFind(false)} style={{ ...findBtnStyle, background: "transparent", color: "#666" }}>✕</button>
          </div>
        )}

        {/* Page layout — centered white page on gray background */}
        <div style={{
          flex: 1, overflow: "auto", background: "#e8eaed",
          display: "flex", justifyContent: "center", padding: "24px 16px",
        }}>
          <div style={{
            width: "100%", maxWidth: 816, background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
            borderRadius: 2, padding: "72px 72px 96px", minHeight: 1056,
          }}>
            <div ref={editorRef} style={{ minHeight: 800 }} />
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "4px 16px", borderTop: "1px solid #e0e0e0", background: "#fff",
          fontSize: 11, color: "#666", flexShrink: 0,
        }}>
          <span>{charCount.toLocaleString()} characters · {wordCount.toLocaleString()} words</span>
          <span>{activeDoc.title}</span>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setContextMenu(null)} />
          <div style={{
            position: "fixed", left: contextMenu.x, top: contextMenu.y,
            background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)", padding: 4, zIndex: 201, minWidth: 140,
          }}>
            <button onClick={() => { titleInputRef.current?.focus(); setContextMenu(null); }} style={ctxBtnStyle}>Rename</button>
            <button
              onClick={() => {
                const doc = createDoc("Copy of " + activeDoc.title);
                doc.content = activeDoc.content;
                setDocs((prev) => [doc, ...prev]);
                setActiveId(doc.id);
                setContextMenu(null);
              }}
              style={ctxBtnStyle}
            >Duplicate</button>
            {docs.length > 1 && (
              <button
                onClick={() => { deleteDoc(activeId); setContextMenu(null); }}
                style={{ ...ctxBtnStyle, color: "#ea4335" }}
              >Delete</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const topBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 6, border: "none",
  background: "transparent", fontSize: 14, cursor: "pointer", color: "#666",
};

const findInputStyle: React.CSSProperties = {
  padding: "5px 10px", border: "1px solid #dadce0", borderRadius: 4,
  fontSize: 12, outline: "none", width: 150,
};

const findBtnStyle: React.CSSProperties = {
  padding: "5px 12px", border: "1px solid #dadce0", borderRadius: 4,
  background: "#fff", fontSize: 12, cursor: "pointer",
};

const exportBtnStyle: React.CSSProperties = {
  display: "block", width: "100%", padding: "8px 12px", border: "none",
  background: "transparent", fontSize: 12, textAlign: "left", cursor: "pointer",
  borderRadius: 4,
};

const ctxBtnStyle: React.CSSProperties = {
  display: "block", width: "100%", padding: "8px 12px", border: "none",
  background: "transparent", fontSize: 13, textAlign: "left", cursor: "pointer",
  borderRadius: 4,
};
