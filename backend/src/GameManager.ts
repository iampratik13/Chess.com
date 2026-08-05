import type { WebSocket } from "ws";
import { Game } from "./Game.js";
import {
  IDENTIFY,
  FIND_MATCH,
  CANCEL_SEARCH,
  CREATE_ROOM,
  JOIN_ROOM,
  MOVE,
  RESIGN,
  ROOM_CREATED,
  ROOM_ERROR,
  parseClientMessage,
  type ServerMessage,
} from "@chess/protocol";

interface Room {
  code: string;
  host: WebSocket;
}

const send = (socket: WebSocket, message: ServerMessage): void => {
  socket.send(JSON.stringify(message));
};

/**
 * Owns all connected sockets and routes their messages: matchmaking, private
 * rooms, and in-game moves. Games remove themselves via the `onEnd` callback,
 * so this manager never accumulates finished games.
 */
export class GameManager {
  private readonly games = new Set<Game>();
  private readonly rooms = new Map<string, Room>();
  private readonly names = new Map<WebSocket, string>();
  private waiting: WebSocket | null = null;

  addUser(socket: WebSocket): void {
    socket.on("message", (raw) => this.handleMessage(socket, raw.toString()));
  }

  removeUser(socket: WebSocket): void {
    this.names.delete(socket);
    if (this.waiting === socket) this.waiting = null;

    for (const [code, room] of this.rooms) {
      if (room.host === socket) this.rooms.delete(code);
    }

    this.gameOf(socket)?.handleDisconnect(socket);
  }

  private handleMessage(socket: WebSocket, raw: string): void {
    const message = parseClientMessage(raw);
    if (!message) return;

    switch (message.type) {
      case IDENTIFY:
        this.names.set(socket, message.payload.name.trim() || "Anonymous");
        break;
      case FIND_MATCH:
        this.findMatch(socket);
        break;
      case CANCEL_SEARCH:
        if (this.waiting === socket) this.waiting = null;
        break;
      case CREATE_ROOM:
        this.createRoom(socket);
        break;
      case JOIN_ROOM:
        this.joinRoom(socket, message.payload.roomCode);
        break;
      case MOVE:
        this.gameOf(socket)?.makeMove(socket, message.payload);
        break;
      case RESIGN:
        this.gameOf(socket)?.resign(socket);
        break;
    }
  }

  private findMatch(socket: WebSocket): void {
    if (this.waiting && this.waiting !== socket) {
      const opponent = this.waiting;
      this.waiting = null;
      this.startGame(opponent, socket);
    } else {
      this.waiting = socket;
    }
  }

  private createRoom(socket: WebSocket): void {
    const code = this.generateRoomCode();
    this.rooms.set(code, { code, host: socket });
    send(socket, { type: ROOM_CREATED, payload: { roomCode: code } });
  }

  private joinRoom(socket: WebSocket, roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) {
      send(socket, { type: ROOM_ERROR, payload: { code: "NOT_FOUND", message: "Room not found." } });
      return;
    }
    if (room.host === socket) {
      send(socket, { type: ROOM_ERROR, payload: { code: "FULL", message: "You can't join your own room." } });
      return;
    }
    this.rooms.delete(roomCode);
    this.startGame(room.host, socket);
  }

  private startGame(white: WebSocket, black: WebSocket): void {
    const game = new Game(
      white,
      black,
      this.nameOf(white),
      this.nameOf(black),
      (finished) => this.games.delete(finished),
    );
    this.games.add(game);
  }

  private gameOf(socket: WebSocket): Game | undefined {
    for (const game of this.games) {
      if (game.has(socket)) return game;
    }
    return undefined;
  }

  private nameOf(socket: WebSocket): string {
    return this.names.get(socket) ?? "Anonymous";
  }

  private generateRoomCode(): string {
    let code: string;
    do {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (this.rooms.has(code));
    return code;
  }
}
