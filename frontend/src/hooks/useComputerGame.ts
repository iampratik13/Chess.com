import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import type { Color, GameResult, PromotionPiece } from "@chess/protocol";
import { StockfishEngine, moveDelayMs, type EngineLevel } from "@/services/engine";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function outcome(chess: Chess): GameResult {
  if (chess.isCheckmate()) return { reason: "checkmate", winner: chess.turn() === "w" ? "b" : "w" };
  if (chess.isStalemate()) return { reason: "stalemate", winner: null };
  if (chess.isThreefoldRepetition()) return { reason: "threefold_repetition", winner: null };
  if (chess.isInsufficientMaterial()) return { reason: "insufficient_material", winner: null };
  return { reason: "draw", winner: null };
}

function tryMove(chess: Chess, move: { from: Square; to: Square; promotion?: PromotionPiece }) {
  try {
    return chess.move(move);
  } catch {
    return null;
  }
}

/**
 * Drives a local game against Stockfish. Same single-`Chess`-instance-in-a-ref
 * pattern as `useChessGame`; the engine is asked for a move after every player
 * move (and once at the start when the player is Black). A generation counter
 * invalidates any in-flight engine reply after a reset or resignation.
 */
export function useComputerGame(level: EngineLevel, playerColor: Color) {
  const chessRef = useRef(new Chess());
  const engineRef = useRef<StockfishEngine | null>(null);
  const generation = useRef(0);
  const startedAtRef = useRef(Date.now());

  const [fen, setFen] = useState(chessRef.current.fen());
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState<GameResult | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  const chess = chessRef.current;
  const turn = chess.turn();
  const inCheck = chess.isCheck();
  const isPlayerTurn = !result && !thinking && turn === playerColor;

  const { board, moveHistory, lastMove, checkSquare } = useMemo(() => {
    const c = chessRef.current;
    const last = c.history({ verbose: true }).at(-1);
    let checkSq: Square | null = null;
    if (c.isCheck()) {
      const side = c.turn();
      for (const row of c.board()) {
        for (const cell of row) {
          if (cell && cell.type === "k" && cell.color === side) checkSq = cell.square;
        }
      }
    }
    return {
      board: c.board(),
      moveHistory: c.history(),
      lastMove: last ? { from: last.from as Square, to: last.to as Square } : null,
      checkSquare: checkSq,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  const legalTargets = useMemo<Square[]>(() => {
    if (!selected) return [];
    return chessRef.current.moves({ square: selected, verbose: true }).map((m) => m.to as Square);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, selected]);

  const finishIfOver = useCallback((): boolean => {
    if (chessRef.current.isGameOver()) {
      setResult(outcome(chessRef.current));
      return true;
    }
    return false;
  }, []);

  const requestEngineMove = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const gen = generation.current;
    setThinking(true);

    const startedAt = Date.now();
    let uci: string;
    try {
      uci = await engine.bestMove(chessRef.current.fen(), level);
    } catch {
      setThinking(false);
      return;
    }

    if (gen !== generation.current) return; // reset or resigned while thinking

    // Pace the reply to a human-like response time so weak levels don't snap
    // instantly and strong ones don't stall — the engine's real search time
    // counts toward the target delay.
    const remaining = moveDelayMs(level) - (Date.now() - startedAt);
    if (remaining > 0) await sleep(remaining);
    if (gen !== generation.current) return; // reset or resigned while pacing

    setThinking(false);
    if (!uci || uci === "(none)") return;

    const applied = tryMove(chessRef.current, {
      from: uci.slice(0, 2) as Square,
      to: uci.slice(2, 4) as Square,
      promotion: (uci.slice(4, 5) || undefined) as PromotionPiece | undefined,
    });
    if (applied) {
      setFen(chessRef.current.fen());
      finishIfOver();
    }
  }, [level, finishIfOver]);

  const applyPlayerMove = useCallback(
    (from: Square, to: Square, promotion: PromotionPiece = "q") => {
      if (!tryMove(chessRef.current, { from, to, promotion })) return;
      setFen(chessRef.current.fen());
      setSelected(null);
      if (!finishIfOver()) requestEngineMove();
    },
    [finishIfOver, requestEngineMove],
  );

  const select = useCallback(
    (square: Square) => {
      if (!isPlayerTurn) return;
      const c = chessRef.current;
      if (selected) {
        const target = c.moves({ square: selected, verbose: true }).find((m) => m.to === square);
        if (target) {
          const mover = c.get(selected);
          const promoting = mover?.type === "p" && (square.endsWith("8") || square.endsWith("1"));
          if (promoting) setPendingPromotion({ from: selected, to: square });
          else applyPlayerMove(selected, square);
          return;
        }
      }
      const piece = c.get(square);
      setSelected(piece && piece.color === playerColor ? square : null);
    },
    [isPlayerTurn, selected, playerColor, applyPlayerMove],
  );

  const confirmPromotion = useCallback(
    (piece: PromotionPiece) => {
      if (!pendingPromotion) return;
      applyPlayerMove(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
    },
    [pendingPromotion, applyPlayerMove],
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelected(null);
  }, []);

  const resign = useCallback(() => {
    if (result) return;
    generation.current += 1;
    engineRef.current?.stop();
    setThinking(false);
    setResult({ reason: "resign", winner: playerColor === "w" ? "b" : "w" });
  }, [result, playerColor]);

  const newGame = useCallback(() => {
    generation.current += 1;
    engineRef.current?.stop();
    chessRef.current = new Chess();
    startedAtRef.current = Date.now();
    setFen(chessRef.current.fen());
    setSelected(null);
    setPendingPromotion(null);
    setResult(null);
    setThinking(false);
    if (playerColor === "b") requestEngineMove();
  }, [playerColor, requestEngineMove]);

  // Create the engine once; make the opening move if the player is Black.
  useEffect(() => {
    const engine = new StockfishEngine();
    engineRef.current = engine;
    engine.setLevel(level).then(() => {
      if (playerColor === "b" && chessRef.current.history().length === 0) requestEngineMove();
    });
    return () => {
      generation.current += 1;
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-apply strength if the level changes without recreating the worker.
  useEffect(() => {
    engineRef.current?.setLevel(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.elo]);

  return {
    board,
    fen,
    turn,
    inCheck,
    moveHistory,
    lastMove,
    checkSquare,
    selected,
    legalTargets,
    isPlayerTurn,
    thinking,
    result,
    pendingPromotion,
    playerColor,
    startedAt: startedAtRef.current,
    select,
    confirmPromotion,
    cancelPromotion,
    resign,
    newGame,
  };
}
