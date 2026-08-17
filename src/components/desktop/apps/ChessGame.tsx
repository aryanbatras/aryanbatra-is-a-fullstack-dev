"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { readFiles } from "@/utils/finderStorage";
import styles from "@/styles/components/desktop/apps.module.css";

interface ChessGameProps {
  onExit: () => void;
  /** PGN file name to review (opened from Finder — loaded from storage). */
  pgnName?: string;
  /** PGN source text — falls back to a storage lookup by name. */
  pgnContent?: string;
  /** Full-window mode: standard macOS titlebar is the chrome. */
  fullWindow?: boolean;
}

type ChessMode = "ai" | "2p" | "watch";
type Side = "w" | "b";

/**
 * Real Stockfish 18 (WASM, single-threaded build) — the exact engine daedalOS
 * ships. The worker loader reads the .wasm path from the URL fragment, so the
 * worker URL is built at runtime and webpack leaves it alone.
 */
const STOCKFISH_JS = "/aryan/games/chess/stockfish-18-lite-single.js";
const STOCKFISH_WASM = "/aryan/games/chess/stockfish-18-lite-single.wasm";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const PIECE_GLYPH: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

/** daedalOS difficulty → engine think time. Skill 0 = instant, 20 = ~2s. */
const skillToMovetimeMs = (skill: number): number => 50 + skill * 100;

const sideName = (side: Side): string => (side === "w" ? "White" : "Black");

/** Clone a Chess instance preserving full move history (FEN drops it). */
const cloneGame = (g: Chess): Chess => {
  const fresh = new Chess();
  for (const san of g.history()) {
    try {
      fresh.move(san);
    } catch {
      // Skip malformed SAN
    }
  }
  return fresh;
};

export default function ChessGame({ onExit, pgnName, pgnContent, fullWindow }: ChessGameProps) {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<string | null>(null);
  const [legal, setLegal] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState("Loading Stockfish…");
  const [thinking, setThinking] = useState(false);
  const [captured, setCaptured] = useState({ w: [] as string[], b: [] as string[] });
  const [mode, setMode] = useState<ChessMode>("ai");
  const [playerSide, setPlayerSide] = useState<Side>("w");
  const [skill, setSkill] = useState(10);
  const [engineReady, setEngineReady] = useState(false);
  // PGN review (daedalOS): a .pgn opened from Finder loads here and steps
  // through the game move-by-move with ⏮ ◀ ▶ ⏭ instead of engine play.
  const [pgnMoves, setPgnMoves] = useState<string[]>([]);
  const [pgnIndex, setPgnIndex] = useState(-1);

  const gameRef = useRef(game);
  gameRef.current = game;
  const reviewRef = useRef(false);
  reviewRef.current = pgnMoves.length > 0;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const sideRef = useRef(playerSide);
  sideRef.current = playerSide;
  const skillRef = useRef(skill);
  skillRef.current = skill;
  const thinkingRef = useRef(false);

  const workerRef = useRef<Worker | null>(null);
  const watchTimer = useRef<number | null>(null);

  const refresh = (g: Chess) => {
    setHistory(g.history());
    const w: string[] = [];
    const b: string[] = [];
    const hist = g.history();
    const seen = new Set<string>();
    for (let i = 0; i < hist.length; i++) {
      const cap = hist[i].match(/x([QRBNP])/);
      if (!cap) continue;
      const key = `${i % 2}|${cap[1]}`;
      // Moves alternate white/black; a capture on an even index takes black.
      if (seen.has(key)) continue;
      seen.add(key);
      (i % 2 === 0 ? b : w).push(cap[1].toLowerCase());
    }
    setCaptured({ w, b });
    if (g.isCheckmate()) setStatus(`${sideName(g.turn() === "w" ? "b" : "w")} wins by checkmate.`);
    else if (g.isStalemate()) setStatus("Stalemate — draw.");
    else if (g.isInsufficientMaterial()) setStatus("Draw — insufficient material.");
    else if (g.isThreefoldRepetition()) setStatus("Draw — threefold repetition.");
    else if (g.isDraw()) setStatus("Draw.");
    else if (g.isCheck()) setStatus(`${sideName(g.turn())} is in check.`);
    else setStatus(`${sideName(g.turn())} to move.`);
    setSelected(null);
    setLegal([]);
  };

  const isEngineTurn = (): boolean => {
    const g = gameRef.current;
    if (g.isGameOver()) return false;
    if (modeRef.current === "watch") return true;
    if (modeRef.current === "2p") return false;
    return g.turn() !== sideRef.current;
  };

  const requestEngineMove = () => {
    const g = gameRef.current;
    const worker = workerRef.current;
    if (!g || !worker || !engineReady || g.isGameOver() || thinkingRef.current || reviewRef.current) return;
    if (!isEngineTurn()) return;

    thinkingRef.current = true;
    setThinking(true);
    worker.postMessage(`setoption name Skill Level value ${skillRef.current}`);
    worker.postMessage(`position fen ${g.fen()}`);
    worker.postMessage(`go movetime ${skillToMovetimeMs(skillRef.current)}`);
  };

  const applyEngineMove = (uci: string) => {
    const g = gameRef.current;
    thinkingRef.current = false;
    setThinking(false);
    if (uci === "(none)" || g.isGameOver()) return;
    try {
      g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : "q" });
    } catch {
      return;
    }
    const fresh = cloneGame(g);
    setGame(fresh);
    refresh(fresh);
  };

  // Stockfish worker lifecycle.
  useEffect(() => {
    const worker = new Worker(`${STOCKFISH_JS}#${STOCKFISH_WASM}`);
    workerRef.current = worker;

    const onMessage = (event: MessageEvent<string>) => {
      const line = typeof event.data === "string" ? event.data : "";
      if (line.startsWith("readyok")) {
        setEngineReady(true);
        // Start the engine on Black's first move if we chose Black.
        requestEngineMove();
      } else if (line.startsWith("bestmove ")) {
        const [, move] = line.split(" ");
        applyEngineMove(move);
        // Watch mode: chain the next side automatically.
        if (modeRef.current === "watch" && !gameRef.current.isGameOver()) {
          watchTimer.current = window.setTimeout(() => requestEngineMove(), 250);
        }
      }
    };
    worker.addEventListener("message", onMessage);
    worker.postMessage("uci");
    worker.postMessage("isready");

    return () => {
      if (watchTimer.current) window.clearTimeout(watchTimer.current);
      worker.postMessage("stop");
      worker.terminate();
      workerRef.current = null;
      thinkingRef.current = false;
      setEngineReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the position changes to the engine's turn, ask for a move.
  useEffect(() => {
    if (game.isGameOver() || thinkingRef.current || reviewRef.current) return;
    if (!isEngineTurn()) return;
    requestEngineMove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, mode, playerSide, engineReady]);

  // A .pgn opened from Finder loads the game and enters review mode — the
  // engine and piece moves are locked while the move navigator drives the
  // board (same behavior as daedalOS's Chess).
  useEffect(() => {
    if (!pgnName && !pgnContent) return;
    const raw = pgnContent ?? readFiles().find((f) => f.name === pgnName)?.content ?? "";
    if (!raw) {
      setStatus("Could not load PGN.");
      return;
    }
    try {
      // chess.js parses one game per header block; strip the BOM and keep the
      // first game of a multi-game archive (the guard daedalOS uses).
      const cleaned = raw.codePointAt(0) === 0xfeff ? raw.slice(1) : raw;
      const [first] = cleaned.split(/\n\s*\n(?=\[)/);
      const g = new Chess();
      g.loadPgn(first ?? cleaned);
      const moves = g.history();
      setPgnMoves(moves);
      setPgnIndex(moves.length - 1);
      setGame(g);
      refresh(g);
    } catch {
      setPgnMoves([]);
      setPgnIndex(-1);
      setStatus("Could not load PGN — not a valid chess game.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const humanTurn = (): Side | null => {
    if (mode === "2p") return game.turn();
    if (mode === "ai" && game.turn() === playerSide) return playerSide;
    return null;
  };

  const onSquare = (sq: Square | string) => {
    const turn = humanTurn();
    if (!turn || thinking || game.isGameOver() || reviewRef.current) return;
    if (selected) {
      if (sq === selected) {
        setSelected(null);
        setLegal([]);
        return;
      }
      if (legal.includes(sq)) {
        tryMove(selected, sq);
        return;
      }
    }
    const piece = game.get(sq as Square);
    if (piece && piece.color === turn) {
      setSelected(sq);
      const moves = game.moves({ square: sq as Square, verbose: true }) as { to: string }[];
      setLegal(moves.map((m) => m.to));
    } else {
      setSelected(null);
      setLegal([]);
    }
  };

  const tryMove = (from: string, to: string) => {
    const g = gameRef.current;
    try {
      const mv = g.move({ from, to, promotion: "q" });
      if (mv) {
        const fresh = cloneGame(g);
        setGame(fresh);
        refresh(fresh);
        return true;
      }
    } catch {
      /* illegal move */
    }
    return false;
  };

  /** Jump to a ply in the loaded PGN — reset the board and replay the moves. */
  const jumpTo = (target: number) => {
    if (watchTimer.current) window.clearTimeout(watchTimer.current);
    thinkingRef.current = false;
    setThinking(false);
    const clamped = Math.max(-1, Math.min(target, pgnMoves.length - 1));
    const g = new Chess();
    for (let i = 0; i <= clamped; i += 1) {
      try {
        g.move(pgnMoves[i]);
      } catch {
        // Skip malformed SAN
      }
    }
    setGame(g);
    setPgnIndex(clamped);
    refresh(g);
  };

  const newGame = () => {
    if (watchTimer.current) window.clearTimeout(watchTimer.current);
    thinkingRef.current = false;
    setThinking(false);
    setPgnMoves([]);
    setPgnIndex(-1);
    const fresh = new Chess();
    setGame(fresh);
    setHistory([]);
    setCaptured({ w: [], b: [] });
    setSelected(null);
    setLegal([]);
    setStatus(
      mode === "ai"
        ? `${sideName(playerSide)} to move — you play ${sideName(playerSide)}.`
        : mode === "2p"
          ? "White to move."
          : "Watch: engine vs engine.",
    );
  };

  const changeMode = (m: ChessMode) => {
    if (m === mode) return;
    if (watchTimer.current) window.clearTimeout(watchTimer.current);
    thinkingRef.current = false;
    setMode(m);
    setThinking(false);
    // Leaving review hands the board back to the new mode, played from the
    // loaded position (or a fresh one via New).
    setPgnMoves([]);
    setPgnIndex(-1);
  };

  const changeSide = (s: Side) => {
    if (s === playerSide) return;
    setPlayerSide(s);
    if (mode === "ai") {
      if (watchTimer.current) window.clearTimeout(watchTimer.current);
      thinkingRef.current = false;
      setThinking(false);
    }
  };

  const undo = () => {
    if (thinking) return;
    if (watchTimer.current) window.clearTimeout(watchTimer.current);
    thinkingRef.current = false;
    const g = new Chess();
    const hist = gameRef.current.history();
    // vs AI: undo a full round (player + engine). Others: one ply.
    const count = Math.min(hist.length, mode === "ai" ? 2 : 1);
    for (const san of hist.slice(0, hist.length - count)) {
      try {
        g.move(san);
      } catch {
        // Skip malformed SAN
      }
    }
    setGame(g);
    refresh(g);
  };

  // Board orientation: play as Black flips the board (like daedalOS).
  const flipped = mode === "ai" && playerSide === "b";
  const displayRanks = flipped ? [...RANKS].reverse() : RANKS;
  const displayFiles = flipped ? [...FILES].reverse() : FILES;

  const squares = useMemo(() => {
    const cells: { sq: string; piece: string | null; dark: boolean }[] = [];
    for (const r of displayRanks) {
      for (const f of displayFiles) {
        const sq = `${f}${r}` as Square;
        const piece = game.get(sq);
        cells.push({
          sq,
          piece: piece ? PIECE_GLYPH[`${piece.color}${piece.type.toUpperCase()}`] ?? null : null,
          dark: (displayFiles.indexOf(f) + (8 - r)) % 2 === 1,
        });
      }
    }
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, flipped]);

  const lastMove = useMemo(() => {
    const h = game.history({ verbose: true }) as { from: string; to: string }[];
    return h.length ? h[h.length - 1] : null;
  }, [game]);

  return (
    <div className={`${styles.gameShell} ${fullWindow ? styles.gameFullWindow : ""}`} data-game="chess" style={{ "--accent": "#5b8cff" } as React.CSSProperties}>
      {!fullWindow && (
        <div className={styles.gameBar}>
          <button type="button" className={styles.gameBack} onClick={onExit} aria-label="Back to arcade">
            <span aria-hidden>←</span>
          </button>
          <span className={styles.gameTitle}>Chess</span>
          <span className={styles.gameScore}>{status}</span>
        </div>
      )}

      <div className={styles.chessToolbar}>
        <div className={styles.chessModeSwitcher}>
          {(["ai", "2p", "watch"] as ChessMode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`${styles.chessModeBtn} ${mode === m ? styles.chessModeBtnActive : ""}`}
              onClick={() => changeMode(m)}
            >
              {m === "ai" ? "vs AI" : m === "2p" ? "2 Players" : "Watch"}
            </button>
          ))}
        </div>
        {mode === "ai" && (
          <div className={styles.chessModeSwitcher}>
            {(["w", "b"] as Side[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.chessModeBtn} ${playerSide === s ? styles.chessModeBtnActive : ""}`}
                onClick={() => changeSide(s)}
              >
                {s === "w" ? "Play White" : "Play Black"}
              </button>
            ))}
          </div>
        )}
        {mode !== "2p" && (
          <label className={styles.chessSkillLabel}>
            Skill
            <select
              className={styles.chessSkillSelect}
              value={skill}
              onChange={(e) => setSkill(Number(e.target.value))}
            >
              {Array.from({ length: 21 }, (_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="button" className={styles.gameBtn} onClick={undo} disabled={!history.length || thinking || reviewRef.current}>
          Undo
        </button>
        <button type="button" className={styles.gameBtn} onClick={newGame}>
          New
        </button>
      </div>

      <div className={styles.chessCaptured}>
        <span className={styles.chessCapturedSide}>
          <span className={styles.chessCapLabel}>{flipped ? "White" : "Black"}</span>
          <span className={styles.chessCapPieces}>
            {captured.b.map((p, i) => (
              <span key={i} className={styles.chessCapPiece}>
                {PIECE_GLYPH[`w${p.toUpperCase()}`]}
              </span>
            ))}
          </span>
        </span>
      </div>

      <div className={styles.chessBoard}>
        {squares.map(({ sq, piece, dark }) => {
          const isSel = selected === sq;
          const isLegal = legal.includes(sq);
          const isLast = lastMove?.from === sq || lastMove?.to === sq;
          return (
            <button
              key={sq}
              type="button"
              className={`${styles.chessSquare} ${dark ? styles.chessDark : ""} ${
                isSel ? styles.chessSelected : ""
              } ${isLegal ? styles.chessLegal : ""} ${isLast ? styles.chessLast : ""}`}
              onClick={() => onSquare(sq)}
              aria-label={sq}
            >
              {piece && <span className={styles.chessPiece}>{piece}</span>}
              {isLegal && !piece && <span className={styles.chessDot} />}
              {isLegal && piece && <span className={styles.chessRing} />}
            </button>
          );
        })}
        <div className={styles.chessFiles}>
          {displayFiles.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
        <div className={styles.chessRanks}>
          {displayRanks.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </div>
      </div>

      {pgnMoves.length > 0 && (
        <div className={styles.chessPgnNav}>
          <button
            type="button"
            className={styles.chessPgnBtn}
            disabled={pgnIndex === -1}
            onClick={() => jumpTo(-1)}
            aria-label="First move"
          >
            ⏮
          </button>
          <button
            type="button"
            className={styles.chessPgnBtn}
            disabled={pgnIndex === -1}
            onClick={() => jumpTo(pgnIndex - 1)}
            aria-label="Previous move"
          >
            ◀
          </button>
          <span className={styles.chessPgnCounter}>
            {pgnIndex + 1} / {pgnMoves.length}
          </span>
          <button
            type="button"
            className={styles.chessPgnBtn}
            disabled={pgnIndex === pgnMoves.length - 1}
            onClick={() => jumpTo(pgnIndex + 1)}
            aria-label="Next move"
          >
            ▶
          </button>
          <button
            type="button"
            className={styles.chessPgnBtn}
            disabled={pgnIndex === pgnMoves.length - 1}
            onClick={() => jumpTo(pgnMoves.length - 1)}
            aria-label="Last move"
          >
            ⏭
          </button>
        </div>
      )}

      <div className={styles.chessCaptured}>
        <span className={styles.chessCapturedSide}>
          <span className={styles.chessCapLabel}>{flipped ? "Black (you)" : "White (you)"}</span>
          <span className={styles.chessCapPieces}>
            {captured.w.map((p, i) => (
              <span key={i} className={styles.chessCapPiece}>
                {PIECE_GLYPH[`b${p.toUpperCase()}`]}
              </span>
            ))}
          </span>
        </span>
      </div>

      <div className={styles.chessHistory}>
        {history.length === 0 ? (
          <span className={styles.chessHistoryEmpty}>
            {engineReady
              ? mode === "ai"
                ? `You play ${sideName(playerSide)} — click a ${sideName(playerSide).toLowerCase()} piece to start.`
                : "No moves yet — click a white piece to start."
              : "Stockfish is loading…"}
          </span>
        ) : (
          Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => (
            <span key={i} className={styles.chessHistoryRow}>
              <span className={styles.chessHistoryNum}>{i + 1}.</span>
              <span>{history[i * 2] ?? ""}</span>
              <span>{history[i * 2 + 1] ?? ""}</span>
            </span>
          ))
        )}
      </div>

      <p className={styles.gameHint}>
        {pgnMoves.length > 0
          ? `Reviewing ${pgnName ?? "a saved game"} — use the navigator to step through it.`
          : thinking
            ? "Stockfish thinking…"
            : mode === "ai"
              ? `Real Stockfish engine (skill ${skill}/20) — you play ${sideName(playerSide)}.`
              : mode === "2p"
                ? "Both sides play on this board — take turns."
                : "Sit back — Stockfish plays itself."}
      </p>
    </div>
  );
}
