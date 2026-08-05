import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import {
  IDENTIFY,
  FIND_MATCH,
  CANCEL_SEARCH,
  CREATE_ROOM,
  JOIN_ROOM,
  MOVE,
  RESIGN,
  GAME_STARTED,
  GAME_OVER,
  ROOM_CREATED,
  ROOM_ERROR,
  OPPONENT_DISCONNECTED,
  OPPONENT_RECONNECTED,
  OPPONENT_LEFT,
  parseServerMessage,
  type ClientMessage,
  type Color,
  type GameResult,
  type PromotionPiece,
  type WireMove,
} from "@chess/protocol";

export type GameStatus = "idle" | "searching" | "waiting_room" | "playing" | "over";

export interface PendingPromotion {
  from: Square;
  to: Square;
}

/** Apply a move to a Chess instance, swallowing the throw chess.js does on illegal input. */
function tryMove(chess: Chess, move: WireMove) {
  try {
    return chess.move(move);
  } catch {
    return null;
  }
}

/**
 * Encapsulates a single online game: the authoritative `Chess` position, the
 * socket message lifecycle, selection/promotion UI state, and the actions a
 * player can take. The board is a single mutable `Chess` instance held in a
 * ref, so the socket listener (which is attached once per socket) always reads
 * the current position instead of a stale closure.
 */
export function useChessGame(socket: WebSocket | null) {
  const chessRef = useRef(new Chess());
  const startedAtRef = useRef(0);

  // `fen` is the render trigger; the board/turn/history are derived from the ref.
  const [fen, setFen] = useState(chessRef.current.fen());
  const [status, setStatus] = useState<GameStatus>("idle");
  const [color, setColor] = useState<Color | null>(null);
  const [opponentName, setOpponentName] = useState("Opponent");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const chess = chessRef.current;

  const send = useCallback(
    (message: ClientMessage) => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    },
    [socket],
  );

  /* ---- Derived view state (cheap, recomputed from the single instance) ---- */
  const turn = chess.turn();
  const inCheck = chess.isCheck();
  const isMyTurn = status === "playing" && !result && color === turn;

  // Position-derived values. `fen` is the change signal for the mutable
  // `chessRef` instance — eslint can't see that the ref's internals mutated,
  // so its exhaustive-deps hint is a false positive here.
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

  /* ---------------------------- Local moves ---------------------------- */
  const applyMove = useCallback(
    (from: Square, to: Square, promotion: PromotionPiece = "q") => {
      const move = tryMove(chessRef.current, { from, to, promotion });
      if (!move) return;
      setFen(chessRef.current.fen());
      setSelected(null);
      send({ type: MOVE, payload: { from, to, promotion } });
    },
    [send],
  );

  const select = useCallback(
    (square: Square) => {
      const c = chessRef.current;
      if (status !== "playing" || result || !color || color !== c.turn()) return;

      if (selected) {
        const target = c.moves({ square: selected, verbose: true }).find((m) => m.to === square);
        if (target) {
          const mover = c.get(selected);
          const promoting = mover?.type === "p" && (square.endsWith("8") || square.endsWith("1"));
          if (promoting) {
            setPendingPromotion({ from: selected, to: square });
          } else {
            applyMove(selected, square, "q");
          }
          return;
        }
      }

      const piece = c.get(square);
      setSelected(piece && piece.color === color ? square : null);
    },
    [status, result, color, selected, applyMove],
  );

  const confirmPromotion = useCallback(
    (promotion: PromotionPiece) => {
      if (!pendingPromotion) return;
      applyMove(pendingPromotion.from, pendingPromotion.to, promotion);
      setPendingPromotion(null);
    },
    [pendingPromotion, applyMove],
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelected(null);
  }, []);

  /* ------------------------------ Actions ------------------------------ */
  const identify = useCallback((name: string) => send({ type: IDENTIFY, payload: { name } }), [send]);
  const findMatch = useCallback(() => {
    setError(null);
    setStatus("searching");
    send({ type: FIND_MATCH });
  }, [send]);
  const cancelSearch = useCallback(() => {
    setStatus("idle");
    send({ type: CANCEL_SEARCH });
  }, [send]);
  const createRoom = useCallback(() => {
    setError(null);
    send({ type: CREATE_ROOM });
  }, [send]);
  const joinRoom = useCallback(
    (code: string) => {
      setError(null);
      setStatus("searching");
      send({ type: JOIN_ROOM, payload: { roomCode: code } });
    },
    [send],
  );
  const resign = useCallback(() => send({ type: RESIGN }), [send]);

  /* --------------------- Socket lifecycle (attach once) --------------------- */
  useEffect(() => {
    if (!socket) return;

    const onMessage = (event: MessageEvent) => {
      const message = parseServerMessage(event.data);
      if (!message) return;

      switch (message.type) {
        case GAME_STARTED: {
          chessRef.current = new Chess();
          startedAtRef.current = Date.now();
          setFen(chessRef.current.fen());
          setColor(message.payload.color);
          setOpponentName(message.payload.opponentName);
          setSelected(null);
          setPendingPromotion(null);
          setResult(null);
          setOpponentDisconnected(false);
          setRoomCode(null);
          setError(null);
          setStatus("playing");
          break;
        }
        case MOVE: {
          if (tryMove(chessRef.current, message.payload)) {
            setFen(chessRef.current.fen());
          }
          break;
        }
        case GAME_OVER:
        case OPPONENT_LEFT:
          setResult(message.payload);
          setOpponentDisconnected(false);
          setStatus("over");
          break;
        case ROOM_CREATED:
          setRoomCode(message.payload.roomCode);
          setStatus("waiting_room");
          break;
        case ROOM_ERROR:
          setError(message.payload.message);
          setStatus("idle");
          break;
        case OPPONENT_DISCONNECTED:
          setOpponentDisconnected(true);
          break;
        case OPPONENT_RECONNECTED:
          setOpponentDisconnected(false);
          break;
      }
    };

    socket.addEventListener("message", onMessage);
    return () => socket.removeEventListener("message", onMessage);
  }, [socket]);

  return {
    // position
    board,
    fen,
    turn,
    inCheck,
    moveHistory,
    lastMove,
    checkSquare,
    // meta
    status,
    color,
    opponentName,
    roomCode,
    error,
    result,
    opponentDisconnected,
    startedAt: startedAtRef.current,
    // interaction
    selected,
    legalTargets,
    isMyTurn,
    pendingPromotion,
    select,
    confirmPromotion,
    cancelPromotion,
    // actions
    identify,
    findMatch,
    cancelSearch,
    createRoom,
    joinRoom,
    resign,
  };
}
