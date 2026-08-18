"use client";

import { useState, useRef, useCallback } from "react";

/**
 * SlidesApp — A presentation editor (Google Slides replacement).
 * Create, edit, and present slides with rich formatting.
 */

interface Slide {
  id: string;
  title: string;
  content: string;
  bgColor: string;
  layout: "title" | "content" | "two-column" | "blank";
}

const SLIDE_COLORS = [
  "#ffffff", "#f8f9fa", "#e8f0fe", "#fce8e6",
  "#e6f4ea", "#fef7e0", "#f3e8fd", "#1a1a2e",
  "#0d1117", "#16213e",
];

const TEMPLATES: Slide[] = [
  { id: "t1", title: "Presentation Title", content: "Your subtitle goes here", bgColor: "#ffffff", layout: "title" },
  { id: "t2", title: "Slide Title", content: "• Add your bullet points here\n• Point two\n• Point three", bgColor: "#ffffff", layout: "content" },
  { id: "t3", title: "Section Header", content: "Left column content", bgColor: "#ffffff", layout: "two-column" },
  { id: "t4", title: "", content: "", bgColor: "#ffffff", layout: "blank" },
];

let nextId = 1;

export default function SlidesApp() {
  const [slides, setSlides] = useState<Slide[]>([
    { id: String(nextId++), title: "My Presentation", content: "Click to edit subtitle", bgColor: "#ffffff", layout: "title" },
    { id: String(nextId++), title: "Overview", content: "• First point\n• Second point\n• Third point", bgColor: "#ffffff", layout: "content" },
  ]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [presentIndex, setPresentIndex] = useState(0);

  const current = slides[activeSlide];

  const updateSlide = (field: keyof Slide, value: string) => {
    setSlides((prev) => {
      const next = [...prev];
      next[activeSlide] = { ...next[activeSlide], [field]: value };
      return next;
    });
  };

  const addSlide = (template?: Slide) => {
    const newSlide: Slide = template
      ? { ...template, id: String(nextId++) }
      : { id: String(nextId++), title: "New Slide", content: "", bgColor: "#ffffff", layout: "content" };
    setSlides((prev) => {
      const next = [...prev];
      next.splice(activeSlide + 1, 0, newSlide);
      return next;
    });
    setActiveSlide((i) => i + 1);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== activeSlide));
    setActiveSlide((i) => Math.max(0, i - 1));
  };

  const duplicateSlide = () => {
    const copy = { ...current, id: String(nextId++) };
    setSlides((prev) => {
      const next = [...prev];
      next.splice(activeSlide + 1, 0, copy);
      return next;
    });
    setActiveSlide((i) => i + 1);
  };

  const moveSlide = (dir: -1 | 1) => {
    const newIdx = activeSlide + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      [next[activeSlide], next[newIdx]] = [next[newIdx], next[activeSlide]];
      return next;
    });
    setActiveSlide(newIdx);
  };

  const exportHTML = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Presentation</title>
<style>*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#000}
.slide{width:100vw;height:100vh;display:flex;flex-direction:column;justify-content:center;padding:60px 80px;display:none}
.slide.active{display:flex}
h1{font-size:48px;margin-bottom:20px;color:#1a1a2e}
h2{font-size:36px;margin-bottom:16px;color:#333}
p,.content{font-size:24px;line-height:1.6;color:#555;white-space:pre-wrap}
.title-slide{align-items:center;text-align:center}
.nav{position:fixed;bottom:20px;right:20px;display:flex;gap:8px;z-index:100}
.nav button{padding:8px 16px;border:none;border-radius:6px;background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:14px}
</style></head><body>`;
    slides.forEach((s, i) => {
      html += `<div class="slide${i === 0 ? " active" : ""}" style="background:${s.bgColor}">`;
      if (s.layout === "title") {
        html += `<div class="title-slide"><h1>${s.title}</h1><p>${s.content}</p></div>`;
      } else if (s.layout === "content") {
        html += `<h2>${s.title}</h2><div class="content">${s.content}</div>`;
      } else {
        html += `<h2>${s.title}</h2><p>${s.content}</p>`;
      }
      html += `</div>`;
    });
    html += `<div class="nav"><button onclick="prev()">← Prev</button><button onclick="next()">Next →</button></div>
<script>let i=0;const ss=document.querySelectorAll('.slide');
function show(n){ss.forEach((s,j)=>s.classList.toggle('active',j===n))}
function next(){i=Math.min(i+1,ss.length-1);show(i)}
function prev(){i=Math.max(i-1,0);show(i)}
document.onkeydown=e=>{if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev()};
</script></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "presentation.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Presentation mode
  if (presenting) {
    const s = slides[presentIndex];
    return (
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999, background: s.bgColor,
          display: "flex", flexDirection: "column", justifyContent: "center",
          alignItems: s.layout === "title" ? "center" : "flex-start",
          padding: "60px 80px", cursor: "pointer",
        }}
        onClick={() => {
          setPresentIndex((i) => (i + 1 < slides.length ? i + 1 : 0));
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setPresenting(false);
          if (e.key === "ArrowRight" || e.key === " ") setPresentIndex((i) => Math.min(i + 1, slides.length - 1));
          if (e.key === "ArrowLeft") setPresentIndex((i) => Math.max(i - 1, 0));
        }}
        tabIndex={0}
      >
        {s.title && (
          <h1 style={{
            fontSize: s.layout === "title" ? 56 : 40, fontWeight: 700,
            color: s.bgColor === "#1a1a2e" || s.bgColor === "#0d1117" || s.bgColor === "#16213e" ? "#fff" : "#1a1a2e",
            marginBottom: 24, textAlign: s.layout === "title" ? "center" : "left",
          }}>{s.title}</h1>
        )}
        <div style={{
          fontSize: s.layout === "title" ? 24 : 20, lineHeight: 1.7,
          color: s.bgColor === "#1a1a2e" || s.bgColor === "#0d1117" || s.bgColor === "#16213e" ? "#ccc" : "#555",
          whiteSpace: "pre-wrap", textAlign: s.layout === "title" ? "center" : "left",
          maxWidth: "80%",
        }}>{s.content}</div>
        <div style={{
          position: "absolute", bottom: 24, right: 32, fontSize: 14, color: "#999",
        }}>{presentIndex + 1} / {slides.length}</div>
        <div style={{
          position: "absolute", bottom: 24, left: 32,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); setPresenting(false); }}
            style={{ padding: "6px 16px", border: "1px solid #ccc", borderRadius: 6, background: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 13 }}
          >✕ Exit</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", background: "#f0f0f0" }}>
      {/* Slide sidebar */}
      <div style={{
        width: 180, background: "#2d2d2d", overflowY: "auto", padding: 8,
        display: "flex", flexDirection: "column", gap: 6, flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          <button onClick={() => addSlide()} style={sidebarBtnStyle}>+ Slide</button>
          <button onClick={exportHTML} style={sidebarBtnStyle}>Export</button>
        </div>
        {slides.map((s, i) => (
          <div
            key={s.id}
            onClick={() => setActiveSlide(i)}
            style={{
              background: s.bgColor, border: i === activeSlide ? "2px solid #4285f4" : "1px solid #555",
              borderRadius: 4, padding: 6, cursor: "pointer", minHeight: 60,
              display: "flex", flexDirection: "column", justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 7, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.title || "Blank"}
            </div>
            <div style={{ fontSize: 5, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.content.slice(0, 40)}
            </div>
          </div>
        ))}
      </div>

      {/* Main editor */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
          borderBottom: "1px solid #ddd", background: "#fff", flexShrink: 0,
        }}>
          <button onClick={() => setPresenting(true)} style={toolbarBtnStyle(true)}>▶ Present</button>
          <button onClick={() => addSlide()} style={toolbarBtnStyle(false)}>+ New Slide</button>
          <button onClick={duplicateSlide} style={toolbarBtnStyle(false)}>Duplicate</button>
          <button onClick={deleteSlide} style={toolbarBtnStyle(false)}>Delete</button>
          <div style={{ width: 1, height: 20, background: "#ddd" }} />
          <button onClick={() => moveSlide(-1)} style={toolbarBtnStyle(false)}>↑</button>
          <button onClick={() => moveSlide(1)} style={toolbarBtnStyle(false)}>↓</button>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: "#888" }}>{activeSlide + 1} / {slides.length}</span>
        </div>

        {/* Slide editor */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflow: "auto" }}>
          <div style={{
            width: 720, aspectRatio: "16/9", background: current.bgColor,
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)", borderRadius: 4,
            padding: "48px 56px", display: "flex", flexDirection: "column",
            justifyContent: current.layout === "title" ? "center" : "flex-start",
            alignItems: current.layout === "title" ? "center" : "stretch",
          }}>
            <input
              value={current.title}
              onChange={(e) => updateSlide("title", e.target.value)}
              style={{
                border: "none", background: "transparent", outline: "none",
                fontSize: current.layout === "title" ? 40 : 32,
                fontWeight: 700, textAlign: current.layout === "title" ? "center" : "left",
                color: "#1a1a2e", marginBottom: 16, width: "100%",
              }}
              placeholder="Slide title..."
            />
            <textarea
              value={current.content}
              onChange={(e) => updateSlide("content", e.target.value)}
              style={{
                border: "none", background: "transparent", outline: "none",
                fontSize: current.layout === "title" ? 20 : 18,
                lineHeight: 1.6, color: "#555", resize: "none", flex: 1,
                width: "100%", fontFamily: "system-ui, sans-serif",
                textAlign: current.layout === "title" ? "center" : "left",
              }}
              placeholder="Add content..."
            />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
          borderTop: "1px solid #ddd", background: "#fff", flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: "#666" }}>Background:</span>
          {SLIDE_COLORS.map((c) => (
            <div
              key={c}
              onClick={() => updateSlide("bgColor", c)}
              style={{
                width: 20, height: 20, borderRadius: 4, background: c,
                border: current.bgColor === c ? "2px solid #4285f4" : "1px solid #ccc",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const sidebarBtnStyle: React.CSSProperties = {
  padding: "4px 8px", border: "none", borderRadius: 4,
  background: "#4285f4", color: "#fff", fontSize: 11, cursor: "pointer",
  flex: 1,
};

function toolbarBtnStyle(primary: boolean): React.CSSProperties {
  return {
    padding: "4px 12px", border: "1px solid #dadce0", borderRadius: 4,
    background: primary ? "#4285f4" : "#fff", color: primary ? "#fff" : "#333",
    fontSize: 12, cursor: "pointer",
  };
}
