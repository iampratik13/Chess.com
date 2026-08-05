import { Chess } from "chess.js";
import type { WebSocket } from "ws";
import {
  GAME_STARTED,
  MOVE,
  GAME_OVER,
  OPPONENT_DISCONNECTED,
  OPPONENT_LEFT,
  type Color,
  type GameResult,
  type ServerMessage,
  type WireMove,
} from "@chess/protocol";

/** How long a disconnected player has to reconnect before they forfeit. */
const ABANDON_GRACE_MS = 15_000;

const send = (socket: WebSocket, message: ServerMessage): void => {
  socket.send(JSON.stringify(message));
};

/**
 * A single game between two sockets. White always moves first; the server is
 * the sole authority on legality and outcome. When the game ends (for any
 * reason) it calls `onEnd` so the manager can drop its reference — this is what
 * keeps finished games from leaking.
 */
export class Game {
  readonly white: WebSocket;
  readonly black: WebSocket;
  readonly startedAt = Date.now();

  private readonly whiteName: string;
  private readonly blackName: string;
  private readonly board = new Chess();
  private readonly onEnd: (game: Game) => void;

  private abandonTimer: ReturnType<typeof setTimeout> | null = null;
  private ended = false;

  constructor(
    white: WebSocket,
    black: WebSocket,
    whiteName: string,
    blackName: string,
    onEnd: (game: Game) => void,
  ) {
    this.white = white;
    this.black = black;
    this.whiteName = whiteName;
    this.blackName = blackName;
    this.onEnd = onEnd;

    send(white, { type: GAME_STARTED, payload: { color: "w", opponentName: blackName } });
    send(black, { type: GAME_STARTED, payload: { color: "b", opponentName: whiteName } });
  }

  has(socket: WebSocket): boolean {
    return socket === this.white || socket === this.black;
  }

  makeMove(socket: WebSocket, move: WireMove): void {
    if (this.ended) return;
    // Reject moves played out of turn before touching the engine.
    if (this.colorOf(socket) !== this.board.turn()) return;

    try {
      this.board.move(move);
    } catch {
      return; // Illegal move — ignore.
    }

    send(this.opponentOf(socket), { type: MOVE, payload: move });

    if (this.board.isGameOver()) {
      this.finish(this.outcome());
    }
  }

  resign(socket: WebSocket): void {
    if (this.ended) return;
    const winner: Color = this.colorOf(socket) === "w" ? "b" : "w";
    this.finish({ reason: "resign", winner });
  }

  /**
   * Called when a player's socket drops. The opponent is told, and after a
   * grace period the disconnected player forfeits. (True mid-game reconnection
   * needs a session token to re-attach a new socket — a future enhancement.)
   */
  handleDisconnect(socket: WebSocket): void {
    if (this.ended || this.abandonTimer) return;

    const opponent = this.opponentOf(socket);
    send(opponent, { type: OPPONENT_DISCONNECTED, payload: { graceMs: ABANDON_GRACE_MS } });

    this.abandonTimer = setTimeout(() => {
      this.abandonTimer = null;
      if (this.ended) return;
      const winner: Color = this.colorOf(socket) === "w" ? "b" : "w";
      send(opponent, { type: OPPONENT_LEFT, payload: { reason: "abandon", winner } });
      this.ended = true;
      this.onEnd(this);
    }, ABANDON_GRACE_MS);
  }

  private colorOf(socket: WebSocket): Color {
    return socket === this.white ? "w" : "b";
  }

  private opponentOf(socket: WebSocket): WebSocket {
    return socket === this.white ? this.black : this.white;
  }

  private outcome(): GameResult {
    const b = this.board;
    if (b.isCheckmate()) {
      // The side to move has been mated, so the other side won.
      return { reason: "checkmate", winner: b.turn() === "w" ? "b" : "w" };
    }
    if (b.isStalemate()) return { reason: "stalemate", winner: null };
    if (b.isThreefoldRepetition()) return { reason: "threefold_repetition", winner: null };
    if (b.isInsufficientMaterial()) return { reason: "insufficient_material", winner: null };
    return { reason: "draw", winner: null };
  }

  private finish(result: GameResult): void {
    if (this.ended) return;
    this.ended = true;
    if (this.abandonTimer) {
      clearTimeout(this.abandonTimer);
      this.abandonTimer = null;
    }
    const message: ServerMessage = { type: GAME_OVER, payload: result };
    send(this.white, message);
    send(this.black, message);
    this.onEnd(this);
  }
}
