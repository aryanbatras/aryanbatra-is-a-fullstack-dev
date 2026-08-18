"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cpu, Play, Pause } from "lucide-react";
import styles from "@/styles/components/desktop/apps.module.css";

/**
 * Crypto Miner — simulated Bitcoin mining in the browser.
 * Uses Web Workers with SHA-256 to demonstrate proof-of-work.
 * Real cryptographic hashing, simulated block rewards.
 */

interface MinerStats {
  hashrate: number;
  totalHashes: number;
  blocksFound: number;
  uptime: number;
  sharesAccepted: number;
  temperature: number;
  power: number;
}

const INITIAL_STATS: MinerStats = {
  hashrate: 0,
  totalHashes: 0,
  blocksFound: 0,
  uptime: 0,
  sharesAccepted: 0,
  temperature: 42,
  power: 65,
};

// SHA-256 mining worker as a Blob URL
const WORKER_CODE = `
  let running = false;
  let hashCount = 0;

  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function mine(difficulty) {
    const target = '0'.repeat(difficulty);
    let nonce = 0;
    const blockData = 'aryan-os-block-' + Date.now();
    
    while (running) {
      const hash = await sha256(blockData + nonce);
      hashCount++;
      
      if (hash.startsWith(target)) {
        self.postMessage({ type: 'found', hash, nonce, blockData });
      }
      
      if (hashCount % 100 === 0) {
        self.postMessage({ type: 'progress', hashCount });
      }
      
      nonce++;
      
      // Yield to event loop every 1000 hashes
      if (nonce % 1000 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }

  self.onmessage = (e) => {
    if (e.data.type === 'start') {
      running = true;
      hashCount = 0;
      mine(e.data.difficulty || 4);
    } else if (e.data.type === 'stop') {
      running = false;
      self.postMessage({ type: 'stopped', hashCount });
    }
  };
`;

export default function CryptoMinerApp() {
  const [stats, setStats] = useState< MinerStats>({ ...INITIAL_STATS });
  const [mining, setMining] = useState(false);
  const [difficulty, setDifficulty] = useState(4);
  const [logs, setLogs] = useState<string[]>([]);
  const [blockReward, setBlockReward] = useState(3.125);
  const [balance, setBalance] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const startTimeRef = useRef<number>(0);
  const hashCountRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), `[${time}] ${msg}`]);
  }, []);

  const startMining = useCallback(() => {
    if (mining) return;

    const workerBlob = new Blob([WORKER_CODE], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(workerBlob));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === "progress") {
        hashCountRef.current = e.data.hashCount;
      } else if (e.data.type === "found") {
        setStats((s) => ({ ...s, blocksFound: s.blocksFound + 1, sharesAccepted: s.sharesAccepted + 1 }));
        setBalance((b) => b + blockReward);
        addLog(`Block found! Hash: ${e.data.hash.slice(0, 20)}… Nonce: ${e.data.nonce}`);
        addLog(`Reward: +${blockReward} BTC`);
      } else if (e.data.type === "stopped") {
        addLog(`Miner stopped. Total hashes: ${hashCountRef.current.toLocaleString()}`);
      }
    };

    worker.postMessage({ type: "start", difficulty });
    startTimeRef.current = Date.now();
    hashCountRef.current = 0;
    setMining(true);
    addLog(`Mining started (difficulty: ${difficulty}, target: ${"0".repeat(difficulty)}…)`);
    addLog(`Algorithm: SHA-256 Proof-of-Work`);

    // Update stats every second
    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const hashrate = elapsed > 0 ? hashCountRef.current / elapsed : 0;
      const temp = 42 + Math.random() * 15 + (hashrate / 10000) * 5;
      const power = 65 + hashrate / 500;

      setStats({
        hashrate,
        totalHashes: hashCountRef.current,
        blocksFound: 0, // Updated by worker
        uptime: elapsed,
        sharesAccepted: 0, // Updated by worker
        temperature: Math.min(85, temp),
        power: Math.min(300, power),
      });
    }, 1000);
  }, [mining, difficulty, blockReward, addLog]);

  const stopMining = useCallback(() => {
    if (!mining) return;
    workerRef.current?.postMessage({ type: "stop" });
    workerRef.current?.terminate();
    workerRef.current = null;
    setMining(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [mining]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatHashrate = (h: number) => {
    if (h > 1e6) return `${(h / 1e6).toFixed(2)} MH/s`;
    if (h > 1e3) return `${(h / 1e3).toFixed(2)} KH/s`;
    return `${h.toFixed(0)} H/s`;
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.minerApp}>
      {/* Toolbar */}
      <div className={styles.pgliteToolbar}>
        <Cpu size={12} />
        <span className={styles.pgliteStatus}>
          {mining ? `Mining @ ${formatHashrate(stats.hashrate)}` : "Miner idle"}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button
            onClick={mining ? stopMining : startMining}
            className={styles.playgroundBtn}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            {mining ? <><Pause size={12} /> Stop</> : <><Play size={12} /> Start</>}
          </button>
        </div>
      </div>

      <div className={styles.minerContent}>
        {/* Stats panel */}
        <div className={styles.minerStats}>
          <div className={styles.minerStatCard}>
            <div className={styles.minerStatLabel}>Hashrate</div>
            <div className={styles.minerStatValue}>{formatHashrate(stats.hashrate)}</div>
          </div>
          <div className={styles.minerStatCard}>
            <div className={styles.minerStatLabel}>Total Hashes</div>
            <div className={styles.minerStatValue}>{stats.totalHashes.toLocaleString()}</div>
          </div>
          <div className={styles.minerStatCard}>
            <div className={styles.minerStatLabel}>Blocks Found</div>
            <div className={styles.minerStatValue} style={{ color: "#10b981" }}>{stats.blocksFound}</div>
          </div>
          <div className={styles.minerStatCard}>
            <div className={styles.minerStatLabel}>Balance</div>
            <div className={styles.minerStatValue} style={{ color: "#f59e0b" }}>{balance.toFixed(8)} BTC</div>
          </div>
          <div className={styles.minerStatCard}>
            <div className={styles.minerStatLabel}>Uptime</div>
            <div className={styles.minerStatValue}>{formatTime(stats.uptime)}</div>
          </div>
          <div className={styles.minerStatCard}>
            <div className={styles.minerStatLabel}>Temp</div>
            <div className={styles.minerStatValue} style={{ color: stats.temperature > 75 ? "#ef4444" : "#10b981" }}>
              {stats.temperature.toFixed(0)}°C
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.minerControls}>
          <label style={{ fontSize: 12, color: "#8888aa", display: "flex", alignItems: "center", gap: 8 }}>
            Difficulty:
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className={styles.minerSelect}
              disabled={mining}
            >
              <option value={1}>1 (fast)</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4 (default)</option>
              <option value={5}>5</option>
              <option value={6}>6 (slow)</option>
            </select>
          </label>
          <label style={{ fontSize: 12, color: "#8888aa", display: "flex", alignItems: "center", gap: 8 }}>
            Reward:
            <select
              value={blockReward}
              onChange={(e) => setBlockReward(Number(e.target.value))}
              className={styles.minerSelect}
            >
              <option value={0.125}>0.125 BTC</option>
              <option value={0.5}>0.5 BTC</option>
              <option value={1}>1 BTC</option>
              <option value={3.125}>3.125 BTC (real)</option>
              <option value={6.25}>6.25 BTC</option>
              <option value={50}>50 BTC (2009)</option>
            </select>
          </label>
        </div>

        {/* Log */}
        <div className={styles.minerLog}>
          {logs.length === 0 && (
            <div style={{ color: "#666", fontSize: 12, padding: 8 }}>
              Miner log — click Start to begin mining
            </div>
          )}
          {logs.map((log, i) => (
            <div key={i} className={styles.minerLogLine}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
