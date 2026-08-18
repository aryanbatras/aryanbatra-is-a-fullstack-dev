"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * PDF Viewer — renders PDFs using Mozilla's PDF.js loaded from CDN.
 */

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (src: string | Uint8Array) => Promise<{ numPages: number; getPage: (n: number) => Promise<any> }>;
    };
  }
}

interface PdfViewerProps {
  src?: string;
  title?: string;
}

export default function PdfViewerApp({ src, title }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Loading PDF.js…");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.5);
  const docRef = useRef<any>(null);

  useEffect(() => {
    if (window.pdfjsLib) {
      setStatus("Ready");
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.min.mjs";
    script.type = "module";
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs";
        setStatus("Ready");
      }
    };
    script.onerror = () => setStatus("Failed to load PDF.js");
    document.head.appendChild(script);
  }, []);

  const renderPage = useCallback(async (pageNum: number, scale: number) => {
    if (!docRef.current || !canvasRef.current) return;
    try {
      const page = await docRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      setStatus(`Page ${pageNum} of ${docRef.current.numPages}`);
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  }, []);

  const loadPDF = useCallback(async (data: string) => {
    if (!window.pdfjsLib) return;
    try {
      setStatus("Loading…");
      const doc = await window.pdfjsLib.getDocument(data);
      docRef.current = doc;
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      await renderPage(1, zoom);
    } catch (e) {
      setStatus(`Failed: ${(e as Error).message}`);
    }
  }, [zoom, renderPage]);

  useEffect(() => {
    if (src && window.pdfjsLib) loadPDF(src);
  }, [src, loadPDF]);

  useEffect(() => {
    if (docRef.current && currentPage > 0) renderPage(currentPage, zoom);
  }, [currentPage, zoom, renderPage]);

  return (
    <div className={styles.pdfViewer}>
      <div className={styles.pgliteToolbar}>
        <FileText size={12} />
        <span className={styles.pgliteStatus}>{title ? `${title} — ` : ""}{status}</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className={styles.playgroundBtn} style={{ opacity: currentPage <= 1 ? 0.4 : 1 }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: "#8888aa", minWidth: 60, textAlign: "center" }}>
            {totalPages > 0 ? `${currentPage} / ${totalPages}` : "—"}
          </span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className={styles.playgroundBtn} style={{ opacity: currentPage >= totalPages ? 0.4 : 1 }}>
            <ChevronRight size={14} />
          </button>
          <div style={{ width: 1, height: 16, background: "#2a2a4a", margin: "0 4px" }} />
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className={styles.playgroundBtn}><ZoomOut size={14} /></button>
          <span style={{ fontSize: 12, color: "#8888aa", minWidth: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className={styles.playgroundBtn}><ZoomIn size={14} /></button>
        </div>
      </div>
      <div className={styles.pdfCanvasArea}>
        <canvas ref={canvasRef} className={styles.pdfCanvas} />
      </div>
    </div>
  );
}
