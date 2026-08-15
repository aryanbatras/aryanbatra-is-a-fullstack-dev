"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/components/desktop/apps.module.css";

interface MinesweeperGameProps {
  onExit: () => void;
}

const ROWS = 9;
const COLS = 9;
const MINES = 10;

type Cell = { mine: boolean; adj: number; open: boolean; flag: boolean };

const emptyBoard = (): Cell[][] =>
  Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, adj: 0, open: false, flag: false })),
  );

/** Place mines away from the first-clicked square, then compute adjacency. */
const placeMines = (cells: Cell[][], safeR: number, safeC: number): Cell[][] => {
  const next = cells.map((row) => row.map((c) => ({ ...c })));
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (next[r][c].mine || (r === safeR && c === safeC)) continue;
    next[r][c].mine = true;
    placed++;
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let adj = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && next[nr][nc].mine) adj++;
        }
      }
      next[r][c].adj = adj;
    }
  }
  return next;
};

/** Minesweeper — classic 9x9 with 10 mines, chording, flags and a timer. */
export default function MinesweeperGame({ onExit }: MinesweeperGameProps) {
  const [board, setBoard] = useState<Cell[][]>(emptyBoard);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [flags, setFlags] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const firstClickRef = useRef(true);
  const timerRef = useRef<number | null>(null);

  const reveal = (cells: Cell[][], r: number, c: number): Cell[][] => {
    const next = cells.map((row) => row.map((x) => ({ ...x })));
    const flood = (rr: number, cc: number) => {
      if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) return;
      const cell = next[rr][cc];
      if (cell.open || cell.flag || cell.mine) return;
      cell.open = true;
      if (cell.adj === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            flood(rr + dr, cc + dc);
          }
        }
      }
    };
    if (!next[r][c].mine) flood(r, c);
    return next;
  };

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const checkWin = (cells: Cell[][]) => {
    const allSafeOpen = cells.every((row) => row.every((c) => c.mine || c.open));
    if (allSafeOpen) {
      setStatus("won");
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  };

  const onReveal = (r: number, c: number) => {
    if (status !== "playing") return;
    if (board[r][c].flag || board[r][c].open) return;
    if (firstClickRef.current) {
      firstClickRef.current = false;
      startTimer();
      const seeded = reveal(placeMines(board, r, c), r, c);
      if (seeded[r][c].mine) {
        // shouldn't happen — safe square guaranteed by placeMines
        seeded[r][c].mine = false;
      }
      setBoard(seeded);
      checkWin(seeded);
      return;
    }
    const next = reveal(board, r, c);
    if (next[r][c].mine) {
      next[r][c].open = true;
      setBoard(next);
      setStatus("lost");
      if (timerRef.current) window.clearInterval(timerRef.current);
      return;
    }
    setBoard(next);
    checkWin(next);
  };

  const onFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (status !== "playing" || board[r][c].open) return;
    const next = board.map((row) => row.map((x) => ({ ...x })));
    next[r][c].flag = !next[r][c].flag;
    setFlags((f) => f + (next[r][c].flag ? 1 : -1));
    setBoard(next);
  };

  const newGame = () => {
    setBoard(emptyBoard());
    setStatus("playing");
    setFlags(0);
    setSeconds(0);
    firstClickRef.current = true;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, []);

  const remaining = useMemo(() => MINES - flags, [flags]);
  const digit = (n: number) => Math.max(0, Math.min(99, n)).toString().padStart(3, "0");

  return (
    <div className={styles.gameShell} data-game="minesweeper" style={{ "--accent": "#30d158" } as React.CSSProperties}>
      <div className={styles.gameBar}>
        <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to arcade">
          <span aria-hidden>←</span>
        </button>
        <span className={styles.gameTitle}>Minesweeper</span>
        <button type="button" className={styles.gameBtn} onClick={newGame}>
          New
        </button>
      </div>

      <div className={styles.mineHud}>
        <span className={styles.mineDigit}>{digit(remaining)}</span>
        <button
          type="button"
          className={styles.mineFace}
          onClick={newGame}
          aria-label="Restart"
        >
          {status === "won" ? "😎" : status === "lost" ? "😵" : "🙂"}
        </button>
        <span className={styles.mineDigit}>{digit(seconds)}</span>
      </div>

      <div
        className={styles.mineBoard}
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const show = cell.open;
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                className={`${styles.mineCell} ${show ? styles.mineCellOpen : ""} ${
                  cell.mine && show ? styles.mineCellBoom : ""
                }`}
                onClick={() => onReveal(r, c)}
                onContextMenu={(e) => onFlag(e, r, c)}
                aria-label={`Row ${r + 1} column ${c + 1}`}
              >
                {!show && cell.flag ? "🚩" : ""}
                {show && cell.mine ? "💣" : ""}
                {show && !cell.mine && cell.adj > 0 ? (
                  <span className={styles[`mineNum${cell.adj}`] ?? ""}>{cell.adj}</span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>

      {(status === "won" || status === "lost") && (
        <div className={styles.gameOverlay}>
          <strong>{status === "won" ? `All mines cleared in ${seconds}s!` : "Boom — hit a mine."}</strong>
          <button type="button" className={styles.gameBtn} onClick={newGame}>
            Play again
          </button>
        </div>
      )}

      <p className={styles.gameHint}>Left-click to reveal · right-click to flag · numbers count neighbours</p>
    </div>
  );
}
