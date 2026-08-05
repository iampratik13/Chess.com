/**
 * The single source of truth for the realtime contract between the chess
 * client and server. Both apps import these constants and types so the wire
 * format can never silently drift apart.
 */

/** Piece / player color, matching chess.js conventions. */
export type Color = "w" | "b";

/** Pieces a pawn may promote to. */
export type PromotionPiece = "q" | "r" | "b" | "n";

/** A move as it travels over the wire (long algebraic). */
export interface WireMove {
  from: string;
  to: string;
  promotion?: PromotionPiece;
}

/** Why a game ended. `null` winner means the game was drawn. */
export type GameOverReason =
  | "checkmate"
  | "stalemate"
  | "threefold_repetition"
  | "insufficient_material"
  | "draw"
  | "resign"
  | "abandon";

export interface GameResult {
  reason: GameOverReason;
  /** Winning color, or `null` for a draw. */
  winner: Color | null;
}

/* ------------------------------------------------------------------ *
 * Message type tags
 * ------------------------------------------------------------------ */

// Client -> Server
export const IDENTIFY = "IDENTIFY";
export const FIND_MATCH = "FIND_MATCH";
export const CANCEL_SEARCH = "CANCEL_SEARCH";
export const CREATE_ROOM = "CREATE_ROOM";
export const JOIN_ROOM = "JOIN_ROOM";
export const MOVE = "MOVE";
export const RESIGN = "RESIGN";

// Server -> Client
export const GAME_STARTED = "GAME_STARTED";
export const GAME_OVER = "GAME_OVER";
export const ROOM_CREATED = "ROOM_CREATED";
export const ROOM_ERROR = "ROOM_ERROR";
export const OPPONENT_DISCONNECTED = "OPPONENT_DISCONNECTED";
export const OPPONENT_RECONNECTED = "OPPONENT_RECONNECTED";
export const OPPONENT_LEFT = "OPPONENT_LEFT";

export type RoomErrorCode = "NOT_FOUND" | "FULL";

/* ------------------------------------------------------------------ *
 * Discriminated unions
 * ------------------------------------------------------------------ */

export type ClientMessage =
  | { type: typeof IDENTIFY; payload: { name: string } }
  | { type: typeof FIND_MATCH }
  | { type: typeof CANCEL_SEARCH }
  | { type: typeof CREATE_ROOM }
  | { type: typeof JOIN_ROOM; payload: { roomCode: string } }
  | { type: typeof MOVE; payload: WireMove }
  | { type: typeof RESIGN };

export type ServerMessage =
  | { type: typeof GAME_STARTED; payload: { color: Color; opponentName: string } }
  | { type: typeof MOVE; payload: WireMove }
  | { type: typeof GAME_OVER; payload: GameResult }
  | { type: typeof ROOM_CREATED; payload: { roomCode: string } }
  | { type: typeof ROOM_ERROR; payload: { code: RoomErrorCode; message: string } }
  | { type: typeof OPPONENT_DISCONNECTED; payload: { graceMs: number } }
  | { type: typeof OPPONENT_RECONNECTED }
  | { type: typeof OPPONENT_LEFT; payload: GameResult };

/** Narrow a raw string into a typed `ServerMessage`, or `null` if malformed. */
export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    return JSON.parse(raw) as ServerMessage;
  } catch {
    return null;
  }
}

/** Narrow a raw string into a typed `ClientMessage`, or `null` if malformed. */
export function parseClientMessage(raw: string): ClientMessage | null {
  try {
    return JSON.parse(raw) as ClientMessage;
  } catch {
    return null;
  }
}
