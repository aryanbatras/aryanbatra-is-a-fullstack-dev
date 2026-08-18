"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Table, Database, Upload } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * SQL Studio — SQLite running entirely in the browser via WASM (sql.js).
 * Full ACID-compliant relational database with persistent storage.
 * CDN: sql.js@1.11.0 via jsDelivr
 */

type SqlJsDatabase = {
  run: (sql: string) => void;
  exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>;
  export: () => Uint8Array;
  close: () => void;
};

type SqlJsStatic = {
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase;
};

declare global {
  interface Window {
    initSqlJs?: (config?: Record<string, unknown>) => Promise<SqlJsStatic>;
  }
}

const DEMO_QUERIES = [
  { label: "Create Products", sql: `CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  price REAL,
  stock INTEGER DEFAULT 0
);` },
  { label: "Insert Products", sql: `INSERT INTO products (name, category, price, stock) VALUES
  ('MacBook Pro', 'Laptop', 2499.99, 15),
  ('iPhone 16', 'Phone', 1199.99, 42),
  ('AirPods Pro', 'Audio', 249.99, 100),
  ('iPad Air', 'Tablet', 799.99, 28),
  ('Apple Watch', 'Wearable', 499.99, 55),
  ('Studio Display', 'Monitor', 1599.99, 8);` },
  { label: "Query All", sql: "SELECT * FROM products ORDER BY price DESC;" },
  { label: "Category Stats", sql: `SELECT category,
  COUNT(*) as count,
  ROUND(AVG(price), 2) as avg_price,
  SUM(stock) as total_stock
FROM products
GROUP BY category
ORDER BY avg_price DESC;` },
  { label: "Expensive Items", sql: "SELECT name, price FROM products WHERE price > 1000 ORDER BY price;" },
];

export default function SQLStudioApp() {
  const [sql, setSql] = useState(DEMO_QUERIES[0].sql);
  const [results, setResults] = useState<Array<{ columns: string[]; values: unknown[][] }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Loading SQLite…");
  const [tables, setTables] = useState<string[]>([]);
  const dbRef = useRef<SqlJsDatabase | null>(null);
  const sqlJsRef = useRef<SqlJsStatic | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/sql.js@1.11.0/dist/sql-wasm.js";
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load sql.js"));
          document.head.appendChild(script);
        });
        if (!alive || !window.initSqlJs) return;

        sqlJsRef.current = await window.initSqlJs({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/sql.js@1.11.0/dist/${file}`,
        });
        if (!alive || !sqlJsRef.current) return;

        dbRef.current = new sqlJsRef.current.Database();
        setStatus("SQLite ready — type SQL or pick a demo query");
        refreshTables();
      } catch {
        if (alive) setStatus("Failed to load SQLite");
      }
    };
    void load();
    return () => { alive = false; };
  }, []);

  const refreshTables = () => {
    if (!dbRef.current) return;
    try {
      const res = dbRef.current.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
      setTables(res[0]?.values.map((r) => String(r[0])) ?? []);
    } catch {
      /* ignore */
    }
  };

  const runQuery = useCallback(async () => {
    if (!dbRef.current || !sql.trim()) return;
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const res = dbRef.current.exec(sql.trim());
      const elapsed = Math.round(performance.now() - start);
      setResults(res.length > 0 ? res : null);
      const totalRows = res.reduce((sum, r) => sum + r.values.length, 0);
      if (totalRows > 0 || sql.trim().toUpperCase().startsWith("SELECT")) {
        setStatus(`${totalRows} row${totalRows !== 1 ? "s" : ""} in ${elapsed}ms`);
      } else {
        setStatus(`OK (${elapsed}ms)`);
      }
      refreshTables();
    } catch (e) {
      setError((e as Error).message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [sql]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void runQuery();
    }
  };

  const downloadDb = () => {
    if (!dbRef.current) return;
    const data = dbRef.current.export();
    const blob = new Blob([data], { type: "application/x-sqlite3" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "database.sqlite";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSqlFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setSql(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.pglite}>
      {/* Sidebar */}
      <div className={styles.pgliteSidebar}>
        <div className={styles.pgliteSection}>
          <Database size={12} /> Demo Queries
        </div>
        {DEMO_QUERIES.map((q) => (
          <button
            key={q.label}
            type="button"
            className={styles.pgliteQueryBtn}
            onClick={() => { setSql(q.sql); setError(null); }}
          >
            {q.label}
          </button>
        ))}
        {tables.length > 0 && (
          <>
            <div className={styles.pgliteSection} style={{ marginTop: 12 }}>
              <Table size={12} /> Tables
            </div>
            {tables.map((t) => (
              <button
                key={t}
                type="button"
                className={styles.pgliteQueryBtn}
                onClick={() => setSql(`SELECT * FROM ${t};`)}
              >
                {t}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Main */}
      <div className={styles.pgliteMain}>
        <div className={styles.pgliteEditor}>
          <div className={styles.pgliteToolbar}>
            <button
              type="button"
              className={styles.pgliteRunBtn}
              onClick={() => void runQuery()}
              disabled={loading || !dbRef.current}
            >
              <Play size={12} /> {loading ? "Running…" : "Run (⌘↵)"}
            </button>
            <button type="button" className={styles.esbuildDownload} onClick={downloadDb}>
              <Download size={12} /> Export .sqlite
            </button>
            <span className={styles.pgliteStatus}>{status}</span>
          </div>
          <textarea
            className={styles.pgliteSql}
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="Type SQL here…"
          />
        </div>

        <div className={styles.pgliteResults}>
          {error && <div className={styles.pgliteError}>{error}</div>}
          {results && results.length > 0 ? (
            results.map((r, ri) => (
              <div key={ri} className={styles.pgliteTableWrap}>
                <table className={styles.pgliteTable}>
                  <thead>
                    <tr>
                      {r.columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.values.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell === null ? <span className={styles.pgliteNull}>NULL</span> : String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.pgliteRowCount}>{r.values.length} row{r.values.length !== 1 ? "s" : ""}</div>
              </div>
            ))
          ) : !error && !loading && (
            <div className={styles.pgliteEmpty}>Run a query to see results here</div>
          )}
        </div>
      </div>
    </div>
  );
}
