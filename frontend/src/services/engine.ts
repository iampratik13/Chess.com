/**
 * Thin wrapper around Stockfish (nmrugg/stockfish.js "lite single-threaded"
 * build) running in a Web Worker. The engine binary lives in
 * `public/engine/` — it is a static asset, so it is fetched on demand and
 * never bundled. To refresh it, copy the files from the `stockfish` npm
 * package's `bin/` directory.
 */

import type { Color } from "@chess/protocol";

export interface EngineLevel {
  elo: number;
  label: string;
  /** Weak levels are capped via Stockfish's Skill Level (0–20). */
  skill?: number;
  /** Stronger levels use Stockfish's calibrated UCI_Elo (min ~1320). */
  useElo?: boolean;
  /**
   * Raw search budget per move, in milliseconds. Strength is already capped by
   * `skill`/`elo`, so extra search time is largely wasted — this stays modest.
   * The *perceived* response time is handled separately by {@link moveDelayMs}.
   */
  movetime: number;
}

export const ENGINE_LEVELS: EngineLevel[] = [
  { elo: 400, label: "Beginner", skill: 0, movetime: 60 },
  { elo: 800, label: "Casual", skill: 3, movetime: 100 },
  { elo: 1200, label: "Intermediate", skill: 6, movetime: 150 },
  { elo: 1600, label: "Advanced", useElo: true, movetime: 250 },
  { elo: 2000, label: "Strong", useElo: true, movetime: 350 },
  { elo: 2400, label: "Expert", useElo: true, movetime: 500 },
  { elo: 2800, label: "Master", useElo: true, movetime: 700 },
];

/**
 * Human-like response time for a single move, in milliseconds.
 *
 * A real opponent (and chess.com's bots) never snaps a reply instantly, nor
 * stalls for seconds every move — regardless of how fast the engine actually
 * finds the move. We pace every level into a similar window that drifts up only
 * slightly with strength, plus random jitter so it never feels robotic. The
 * caller subtracts the engine's real search time from this so the two combine
 * into one natural pause.
 */
export function moveDelayMs(level: EngineLevel): number {
  const idx = Math.max(0, ENGINE_LEVELS.findIndex((l) => l.elo === level.elo));
  const base = 550 + idx * 130; // ~550ms (Beginner) → ~1330ms (Master)
  const jitter = Math.random() * 800 - 250; // −250ms … +550ms
  return Math.round(Math.max(350, base + jitter));
}

const ENGINE_URL = "/engine/stockfish-18-lite-single.js";

export class StockfishEngine {
  private readonly worker: Worker;
  private readonly ready: Promise<void>;
  private pendingBestMove: ((uci: string) => void) | null = null;

  constructor() {
    this.worker = new Worker(ENGINE_URL);
    this.worker.addEventListener("message", this.handleMessage);
    this.ready = new Promise<void>((resolve) => {
      const onReady = (event: MessageEvent) => {
        if (String(event.data) === "uciok") {
          this.worker.removeEventListener("message", onReady);
          resolve();
        }
      };
      this.worker.addEventListener("message", onReady);
      this.post("uci");
    });
  }

  private handleMessage = (event: MessageEvent) => {
    const line = typeof event.data === "string" ? event.data : "";
    if (line.startsWith("bestmove") && this.pendingBestMove) {
      const uci = line.split(" ")[1] ?? "";
      const resolve = this.pendingBestMove;
      this.pendingBestMove = null;
      resolve(uci);
    }
  };

  private post(command: string) {
    this.worker.postMessage(command);
  }

  async setLevel(level: EngineLevel): Promise<void> {
    await this.ready;
    if (level.useElo) {
      this.post("setoption name UCI_LimitStrength value true");
      this.post(`setoption name UCI_Elo value ${level.elo}`);
    } else {
      this.post("setoption name UCI_LimitStrength value false");
      this.post(`setoption name Skill Level value ${level.skill ?? 20}`);
    }
    this.post("ucinewgame");
  }

  /** Resolve the engine's chosen move (UCI, e.g. "e2e4" / "e7e8q") for a FEN. */
  async bestMove(fen: string, level: EngineLevel): Promise<string> {
    await this.ready;
    return new Promise<string>((resolve) => {
      this.pendingBestMove = resolve;
      this.post(`position fen ${fen}`);
      this.post(`go movetime ${level.movetime}`);
    });
  }

  stop() {
    this.post("stop");
  }

  dispose() {
    this.pendingBestMove = null;
    this.worker.terminate();
  }
}

/** Resolve a "random" side choice into a concrete color. */
export const resolveSide = (choice: Color | "random"): Color =>
  choice === "random" ? (Math.random() < 0.5 ? "w" : "b") : choice;
