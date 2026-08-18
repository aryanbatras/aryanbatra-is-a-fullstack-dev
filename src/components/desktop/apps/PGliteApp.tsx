"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Table, Database } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * PGlite — a full Postgres instance compiled to WASM.
 * Boots in milliseconds, runs real SQL queries client-side.
 * CDN: @electric-sql/pglite@0.5.4 via jsDelivr
 */

type PGLiteInstance = {
  exec: (sql: string) => Promise<Array<{ columns: string[]; rows: unknown[][] }>>;
  close: () => Promise<void>;
};

declare global {
  interface Window {
    PGlite?: {
      create: (options?: { dataDir?: string }) => Promise<PGLiteInstance>;
    };
  }
}

const DEMO_QUERIES = [
  { label: "Create Users", sql: `CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'engineer',
  created_at TIMESTAMP DEFAULT NOW()
);` },
  { label: "Insert Data", sql: `INSERT INTO users (name, email, role) VALUES
  ('Aryan Batra', 'aryan@100xsystems.dev', 'founder'),
  ('Ada Lovelace', 'ada@example.com', 'engineer'),
  ('Linus Torvalds', 'linus@example.com', 'maintainer'),
  ('Margaret Hamilton', 'margaret@example.com', 'architect')
ON CONFLICT (email) DO NOTHING;` },
  { label: "Query All", sql: "SELECT * FROM users ORDER BY id;" },
  { label: "Count by Role", sql: "SELECT role, COUNT(*) as count FROM users GROUP BY role;" },
  { label: "Join Example", sql: `CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id INT REFERENCES users(id)
);
INSERT INTO projects (name, owner_id) VALUES
  ('Aryan OS', 1), ('Linux Kernel', 3), ('Apollo Guidance', 4)
ON CONFLICT DO NOTHING;
SELECT u.name, p.project_name FROM users u
JOIN projects p ON u.id = p.owner_id;` },
];

export default function PGliteApp() {
  const [sql, setSql] = useState(DEMO_QUERIES[0].sql);
  const [results, setResults] = useState<{ columns: string[]; rows: unknown[][] }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Loading PGlite…");
  const [history, setHistory] = useState<{ sql: string; time: number; rows: number }[]>([]);
  const dbRef = useRef<PGLiteInstance | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // Load PGlite from CDN
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.4/dist/pglite.js";
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load PGlite"));
          document.head.appendChild(script);
        });
        if (!alive || !window.PGLite) return;

        dbRef.current = await window.PGLite.create({ dataDir: "idb://pglite-demo" });
        if (alive) setStatus("PostgreSQL ready — type SQL or pick a demo query");
      } catch {
        if (alive) setStatus("Failed to load PGlite");
      }
    };
    void load();
    return () => { alive = false; };
  }, []);

  const runQuery = useCallback(async () => {
    if (!dbRef.current || !sql.trim()) return;
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const res = await dbRef.current.exec(sql.trim());
      const elapsed = Math.round(performance.now() - start);
      setResults(res);
      const totalRows = res.reduce((sum, r) => sum + r.rows.length, 0);
      setHistory((h) => [{ sql: sql.trim().slice(0, 80), time: elapsed, rows: totalRows }, ...h].slice(0, 20));
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

  return (
    <div className={styles.pglite}>
      {/* Sidebar: demo queries + history */}
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
        {history.length > 0 && (
          <>
            <div className={styles.pgliteSection} style={{ marginTop: 12 }}>
              <Table size={12} /> Recent
            </div>
            {history.map((h, i) => (
              <button
                key={i}
                type="button"
                className={styles.pgliteHistoryBtn}
                onClick={() => setSql(h.sql)}
                title={h.sql}
              >
                {h.rows} rows · {h.time}ms
              </button>
            ))}
          </>
        )}
      </div>

      {/* Main area */}
      <div className={styles.pgliteMain}>
        {/* SQL Editor */}
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
            <span className={styles.pgliteStatus}>{status}</span>
          </div>
          <textarea
            ref={editorRef}
            className={styles.pgliteSql}
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="Type SQL here…"
          />
        </div>

        {/* Results */}
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
                    {r.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell === null ? <span className={styles.pgliteNull}>NULL</span> : String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.pgliteRowCount}>{r.rows.length} row{r.rows.length !== 1 ? "s" : ""}</div>
              </div>
            ))
          ) : !error && !loading && (
            <div className={styles.pgliteEmpty}>
              Run a query to see results here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
