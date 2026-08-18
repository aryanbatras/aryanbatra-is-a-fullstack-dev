"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Globe, Send } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Network Simulator — visualize network requests, DNS resolution,
 * HTTP headers, and WebSocket connections in real time.
 */

interface LogEntry {
  id: number;
  time: string;
  method: string;
  url: string;
  status: number;
  size: string;
  duration: string;
  type: string;
}

const SAMPLE_REQUESTS: Omit<LogEntry, "id">[] = [
  { time: "00:00.000", method: "GET", url: "/", status: 200, size: "2.4 KB", duration: "12ms", type: "document" },
  { time: "00:00.034", method: "GET", url: "/style.css", status: 200, size: "8.1 KB", duration: "8ms", type: "stylesheet" },
  { time: "00:00.045", method: "GET", url: "/app.js", status: 200, size: "45.2 KB", duration: "22ms", type: "script" },
  { time: "00:00.089", method: "GET", url: "/api/user", status: 200, size: "0.3 KB", duration: "45ms", type: "xhr" },
  { time: "00:00.120", method: "GET", url: "/favicon.ico", status: 304, size: "0 KB", duration: "2ms", type: "image" },
  { time: "00:00.150", method: "POST", url: "/api/analytics", status: 201, size: "0.1 KB", duration: "30ms", type: "xhr" },
  { time: "00:00.200", method: "GET", url: "/fonts/inter.woff2", status: 200, size: "22.5 KB", duration: "15ms", type: "font" },
  { time: "00:00.250", method: "GET", url: "/api/feed?page=1", status: 200, size: "12.8 KB", duration: "65ms", type: "xhr" },
  { time: "00:00.350", method: "PUT", url: "/api/settings", status: 200, size: "0.2 KB", duration: "80ms", type: "xhr" },
  { time: "00:00.450", method: "DELETE", url: "/api/items/42", status: 204, size: "0 KB", duration: "35ms", type: "xhr" },
  { time: "00:00.500", method: "GET", url: "/ws/connect", status: 101, size: "—", duration: "5ms", type: "websocket" },
  { time: "00:00.550", method: "GET", url: "/images/hero.webp", status: 200, size: "156 KB", duration: "40ms", type: "image" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "#10b981",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  DELETE: "#ef4444",
  PATCH: "#8b5cf6",
};

const STATUS_COLORS: Record<number, string> = {
  200: "#10b981",
  201: "#10b981",
  204: "#10b981",
  304: "#fbbf24",
  404: "#ef4444",
  500: "#ef4444",
  101: "#3b82f6",
};

export default function NetworkApp() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [wsMessage, setWsMessage] = useState("");
  const [wsMessages, setWsMessages] = useState<string[]>([]);
  const logIdRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((req: Omit<LogEntry, "id">) => {
    const id = ++logIdRef.current;
    setLogs((prev) => [...prev.slice(-99), { ...req, id }]);
  }, []);

  const simulateNetwork = useCallback(() => {
    const req = SAMPLE_REQUESTS[Math.floor(Math.random() * SAMPLE_REQUESTS.length)];
    addLog(req);
  }, [addLog]);

  const startSimulation = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);

    // Add initial batch
    SAMPLE_REQUESTS.forEach((req, i) => {
      setTimeout(() => addLog(req), i * 50);
    });

    // Continue with random requests
    intervalRef.current = setInterval(simulateNetwork, 800 + Math.random() * 1200);
  }, [isRunning, addLog, simulateNetwork]);

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setSelectedLog(null);
    logIdRef.current = 0;
  }, []);

  const sendWsMessage = useCallback(() => {
    if (!wsMessage.trim()) return;
    const msg = wsMessage.trim();
    setWsMessages((prev) => [
      ...prev.slice(-50),
      `[Sent] ${msg}`,
      `[Received] Echo: ${msg} (12ms)`,
    ]);
    setWsMessage("");
  }, [wsMessage]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const filteredLogs = filter === "all" ? logs : logs.filter((l) => l.type === filter);
  const totalSize = logs.reduce((acc, l) => {
    const num = parseFloat(l.size);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  return (
    <div className={styles.networkApp}>
      {/* Toolbar */}
      <div className={styles.pgliteToolbar}>
        <Globe size={12} />
        <span className={styles.pgliteStatus}>
          {logs.length} requests · {totalSize.toFixed(1)} KB total
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            onClick={isRunning ? stopSimulation : startSimulation}
            className={styles.playgroundBtn}
          >
            {isRunning ? "Stop" : "Start"}
          </button>
          <button onClick={clearLogs} className={styles.playgroundBtn}>
            Clear
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.networkFilterBar}>
        {["all", "document", "stylesheet", "script", "xhr", "image", "font", "websocket"].map((f) => (
          <button
            key={f}
            className={`${styles.networkFilterBtn} ${filter === f ? styles.networkFilterBtnActive : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className={styles.networkContent}>
        {/* Request log */}
        <div className={styles.networkLog}>
          <table className={styles.networkTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Method</th>
                <th>URL</th>
                <th>Status</th>
                <th>Size</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`${styles.networkRow} ${selectedLog?.id === log.id ? styles.networkRowSelected : ""}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <td style={{ color: "#666" }}>{log.id}</td>
                  <td style={{ color: METHOD_COLORS[log.method] ?? "#ccc", fontWeight: 600 }}>
                    {log.method}
                  </td>
                  <td>{log.url}</td>
                  <td style={{ color: STATUS_COLORS[log.status] ?? "#ccc" }}>{log.status}</td>
                  <td>{log.size}</td>
                  <td>{log.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className={styles.networkEmpty}>
              Click "Start" to begin network simulation
            </div>
          )}
        </div>

        {/* Detail / WebSocket panel */}
        <div className={styles.networkDetail}>
          {selectedLog ? (
            <div className={styles.networkDetailContent}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "#e0e0e0" }}>
                Request Details
              </h3>
              <div className={styles.networkDetailRow}>
                <span className={styles.networkDetailLabel}>Method</span>
                <span style={{ color: METHOD_COLORS[selectedLog.method] }}>
                  {selectedLog.method}
                </span>
              </div>
              <div className={styles.networkDetailRow}>
                <span className={styles.networkDetailLabel}>URL</span>
                <span>{selectedLog.url}</span>
              </div>
              <div className={styles.networkDetailRow}>
                <span className={styles.networkDetailLabel}>Status</span>
                <span style={{ color: STATUS_COLORS[selectedLog.status] }}>
                  {selectedLog.status}
                </span>
              </div>
              <div className={styles.networkDetailRow}>
                <span className={styles.networkDetailLabel}>Size</span>
                <span>{selectedLog.size}</span>
              </div>
              <div className={styles.networkDetailRow}>
                <span className={styles.networkDetailLabel}>Duration</span>
                <span>{selectedLog.duration}</span>
              </div>
              <div className={styles.networkDetailRow}>
                <span className={styles.networkDetailLabel}>Type</span>
                <span>{selectedLog.type}</span>
              </div>

              {/* Simulated Headers */}
              <h3 style={{ margin: "16px 0 8px", fontSize: 13, color: "#e0e0e0" }}>
                Response Headers
              </h3>
              <pre className={styles.networkHeaders}>
{`content-type: ${selectedLog.type === "xhr" ? "application/json" : selectedLog.type === "stylesheet" ? "text/css" : "text/html"}
cache-control: max-age=31536000, immutable
x-response-time: ${selectedLog.duration}
x-request-id: ${crypto.randomUUID().slice(0, 8)}
server: Aryan-OS/1.0`}
              </pre>
            </div>
          ) : (
            <div className={styles.networkDetailContent}>
              <h3 style={{ margin: "0 0 12px", fontSize: 13, color: "#e0e0e0" }}>
                WebSocket Console
              </h3>
              <div className={styles.networkWsMessages}>
                {wsMessages.length === 0 && (
                  <div style={{ color: "#666", fontSize: 12 }}>
                    Send a message to test the WebSocket echo server
                  </div>
                )}
                {wsMessages.map((m, i) => (
                  <div
                    key={i}
                    className={styles.networkWsLine}
                    style={{ color: m.startsWith("[Sent]") ? "#3b82f6" : "#10b981" }}
                  >
                    {m}
                  </div>
                ))}
              </div>
              <div className={styles.networkWsInput}>
                <input
                  value={wsMessage}
                  onChange={(e) => setWsMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendWsMessage()}
                  placeholder="Type a message…"
                  className={styles.networkWsField}
                />
                <button onClick={sendWsMessage} className={styles.playgroundBtn}>
                  <Send size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
