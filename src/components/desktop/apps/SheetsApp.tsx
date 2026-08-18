"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * SheetsApp — A spreadsheet editor (Google Sheets replacement).
 * Canvas-based grid with cell editing, formulas, and export.
 */

const COLS = 26;
const ROWS = 100;
const CELL_W = 100;
const CELL_H = 28;
const HEADER_H = 28;
const HEADER_W = 50;

function colLabel(i: number): string {
  let s = "";
  let n = i;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

export default function SheetsApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cells, setCells] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string>("A1");
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [scrollX, setScrollX] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const getCellPos = useCallback((ref: string) => {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return { col: 0, row: 0 };
    let col = 0;
    for (const ch of match[1]) {
      col = col * 26 + ch.charCodeAt(0) - 64;
    }
    return { col: col - 1, row: parseInt(match[2]) - 1 };
  }, []);

  const evalFormula = useCallback((formula: string, currentCells: Record<string, string>): string => {
    if (!formula.startsWith("=")) return formula;
    try {
      let expr = formula.slice(1);
      // Replace cell references with values
      expr = expr.replace(/([A-Z]+\d+)/g, (match) => {
        const val = currentCells[match] || "0";
        return isNaN(Number(val)) ? `"${val}"` : val;
      });
      // Simple SUM support
      expr = expr.replace(/SUM\(([^)]+)\)/gi, (_, range) => {
        const parts = range.split(":");
        if (parts.length === 2) {
          const start = getCellPos(parts[0].trim());
          const end = getCellPos(parts[1].trim());
          let sum = 0;
          for (let r = start.row; r <= end.row; r++) {
            for (let c = start.col; c <= end.col; c++) {
              const key = `${colLabel(c)}${r + 1}`;
              const v = Number(currentCells[key] || 0);
              if (!isNaN(v)) sum += v;
            }
          }
          return String(sum);
        }
        return "0";
      });
      // Basic math
      const result = Function(`"use strict"; return (${expr})`)();
      return String(result);
    } catch {
      return "#ERROR";
    }
  }, [getCellPos]);

  // Draw the grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "13px system-ui, -apple-system, sans-serif";

    // Draw column headers
    ctx.fillStyle = "#f1f3f4";
    ctx.strokeStyle = "#e0e0e0";
    for (let c = 0; c < COLS; c++) {
      const x = HEADER_W + c * CELL_W - scrollX;
      if (x + CELL_W < HEADER_W || x > canvas.width) continue;
      ctx.fillRect(x, 0, CELL_W, HEADER_H);
      ctx.strokeRect(x, 0, CELL_W, HEADER_H);
      ctx.fillStyle = "#5f6368";
      ctx.textAlign = "center";
      ctx.fillText(colLabel(c), x + CELL_W / 2, 18);
      ctx.fillStyle = "#f1f3f4";
    }

    // Draw row headers
    for (let r = 0; r < ROWS; r++) {
      const y = HEADER_H + r * CELL_H - scrollY;
      if (y + CELL_H < HEADER_H || y > canvas.height) continue;
      ctx.fillRect(0, y, HEADER_W, CELL_H);
      ctx.strokeRect(0, y, HEADER_W, CELL_H);
      ctx.fillStyle = "#5f6368";
      ctx.textAlign = "center";
      ctx.fillText(String(r + 1), HEADER_W / 2, y + 18);
      ctx.fillStyle = "#f1f3f4";
    }

    // Draw cells
    ctx.textAlign = "left";
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = HEADER_W + c * CELL_W - scrollX;
        const y = HEADER_H + r * CELL_H - scrollY;
        if (x + CELL_W < HEADER_W || x > canvas.width) continue;
        if (y + CELL_H < HEADER_H || y > canvas.height) continue;

        const key = `${colLabel(c)}${r + 1}`;
        ctx.strokeStyle = "#e8eaed";
        ctx.strokeRect(x, y, CELL_W, CELL_H);

        const raw = cells[key] || "";
        const display = raw.startsWith("=") ? evalFormula(raw, cells) : raw;
        if (display) {
          ctx.fillStyle = "#202124";
          ctx.textAlign = "left";
          ctx.fillText(display, x + 4, y + 18, CELL_W - 8);
        }
      }
    }

    // Highlight selected cell
    const { col, row } = getCellPos(selected);
    const sx = HEADER_W + col * CELL_W - scrollX;
    const sy = HEADER_H + row * CELL_H - scrollY;
    ctx.strokeStyle = "#1a73e8";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, CELL_W, CELL_H);
    ctx.lineWidth = 1;
  }, [cells, selected, scrollX, scrollY, evalFormula, getCellPos]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollX - HEADER_W;
    const y = e.clientY - rect.top + scrollY - HEADER_H;
    const col = Math.floor(x / CELL_W);
    const row = Math.floor(y / CELL_H);
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      const ref = `${colLabel(col)}${row + 1}`;
      setSelected(ref);
      setEditing(false);
      setEditValue(cells[ref] || "");
    }
  };

  const handleDoubleClick = () => {
    setEditing(true);
    setEditValue(cells[selected] || "");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    setCells((prev) => ({ ...prev, [selected]: editValue }));
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editing) {
      if (e.key === "Enter") { commitEdit(); moveSel(0, 1); }
      if (e.key === "Tab") { e.preventDefault(); commitEdit(); moveSel(1, 0); }
      if (e.key === "Escape") setEditing(false);
      return;
    }
    if (e.key === "Enter" || e.key === "F2") { handleDoubleClick(); return; }
    const { col, row } = getCellPos(selected);
    if (e.key === "ArrowUp" && row > 0) { setSelected(`${colLabel(col)}${row}`); e.preventDefault(); }
    if (e.key === "ArrowDown" && row < ROWS - 1) { setSelected(`${colLabel(col)}${row + 2}`); e.preventDefault(); }
    if (e.key === "ArrowLeft" && col > 0) { setSelected(`${colLabel(col - 1)}${row + 1}`); e.preventDefault(); }
    if (e.key === "ArrowRight" && col < COLS - 1) { setSelected(`${colLabel(col + 1)}${row + 1}`); e.preventDefault(); }
    // Type to start editing
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      setEditing(true);
      setEditValue(e.key);
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      setCells((prev) => { const n = { ...prev }; delete n[selected]; return n; });
    }
  };

  const moveSel = (dc: number, dr: number) => {
    const { col, row } = getCellPos(selected);
    const nc = Math.max(0, Math.min(COLS - 1, col + dc));
    const nr = Math.max(0, Math.min(ROWS - 1, row + dr));
    setSelected(`${colLabel(nc)}${nr + 1}`);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollX(e.currentTarget.scrollLeft);
    setScrollY(e.currentTarget.scrollTop);
  };

  const { col: selCol, row: selRow } = getCellPos(selected);
  const inputX = HEADER_W + selCol * CELL_W - scrollX;
  const inputY = HEADER_H + selRow * CELL_H - scrollY;

  const downloadCSV = () => {
    let csv = "";
    let maxR = 0, maxC = 0;
    for (const key of Object.keys(cells)) {
      const { col, row } = getCellPos(key);
      if (row > maxR) maxR = row;
      if (col > maxC) maxC = col;
    }
    for (let r = 0; r <= maxR; r++) {
      const row: string[] = [];
      for (let c = 0; c <= maxC; c++) {
        const key = `${colLabel(c)}${r + 1}`;
        row.push(cells[key] || "");
      }
      csv += row.join(",") + "\n";
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spreadsheet.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
        borderBottom: "1px solid #e0e0e0", background: "#f8f9fa", flexShrink: 0,
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#333" }}>Sheets</span>
        <span style={{ fontSize: 12, color: "#888", borderLeft: "1px solid #ddd", paddingLeft: 8, marginLeft: 4 }}>
          {selected}
        </span>
        <input
          ref={inputRef}
          value={editing ? editValue : (cells[selected] || "")}
          onChange={(e) => setEditValue(e.target.value)}
          onFocus={() => setEditing(true)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          readOnly={!editing}
          style={{
            flex: 1, border: "1px solid #dadce0", borderRadius: 4, padding: "4px 8px",
            fontSize: 13, outline: "none", background: "#fff",
          }}
          placeholder="Enter value or =formula..."
        />
        <button onClick={downloadCSV} style={{
          padding: "5px 14px", border: "1px solid #dadce0", borderRadius: 6,
          background: "#fff", fontSize: 12, cursor: "pointer", color: "#333",
        }}>Export CSV</button>
      </div>

      {/* Grid */}
      <div
        style={{ flex: 1, overflow: "auto", position: "relative" }}
        onScroll={handleScroll}
      >
        <div style={{ width: HEADER_W + COLS * CELL_W, height: HEADER_H + ROWS * CELL_H, position: "relative" }}>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            style={{ position: "sticky", top: 0, left: 0, width: "100%", height: "100%", outline: "none" }}
          />
          {editing && (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={commitEdit}
              autoFocus
              style={{
                position: "absolute",
                left: inputX,
                top: inputY,
                width: CELL_W,
                height: CELL_H,
                border: "2px solid #1a73e8",
                borderRadius: 0,
                padding: "0 3px",
                fontSize: 13,
                outline: "none",
                background: "#fff",
                zIndex: 10,
                boxSizing: "border-box",
              }}
            />
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{
        display: "flex", justifyContent: "space-between", padding: "3px 12px",
        borderTop: "1px solid #e0e0e0", background: "#f8f9fa", fontSize: 11, color: "#888",
        flexShrink: 0,
      }}>
        <span>{Object.keys(cells).length} cells with data</span>
        <span>{selected}</span>
      </div>
    </div>
  );
}
