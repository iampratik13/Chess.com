import { Chess } from "chess.js";
import { WebSocket } from "ws";
export declare class Game {
    player1: WebSocket;
    player2: WebSocket;
    board: Chess;
    private startTime;
    constructor(player1: WebSocket, player2: WebSocket);
    makeMove(socket: WebSocket, move: {
        from: string;
        to: string;
    }): void;
}
//# sourceMappingURL=Game.d.ts.map