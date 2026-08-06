import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Flag, Loader2, RotateCcw, Settings2, LayoutDashboard } from "lucide-react";
import type { Color, GameOverReason, PromotionPiece } from "@chess/protocol";

import { ChessBoard } from "@/components/ChessBoard";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useComputerGame } from "@/hooks/useComputerGame";
import { ENGINE_LEVELS, resolveSide, type EngineLevel } from "@/services/engine";
import { saveGameResult } from "@/services/gameService";

type SideChoice = Color | "random";

interface Session {
  level: EngineLevel;
  color: Color;
}

const PROMOTION_PIECES: PromotionPiece[] = ["q", "r", "b", "n"];

const REASON_LABELS: Record<GameOverReason, string> = {
  checkmate: "by checkmate",
  stalemate: "by stalemate",
  threefold_repetition: "by repetition",
  insufficient_material: "insufficient material",
  draw: "drawn",
  resign: "by resignation",
  abandon: "opponent left",
};

export const PlayComputer = () => {
  const [session, setSession] = useState<Session | null>(null);

  return session ? (
    <ComputerGame
      key={`${session.level.elo}-${session.color}-${Date.now()}`}
      session={session}
      onChangeSettings={() => setSession(null)}
    />
  ) : (
    <Setup onStart={(level, side) => setSession({ level, color: resolveSide(side) })} />
  );
};

/* --------------------------------- Setup --------------------------------- */

const Setup = ({ onStart }: { onStart: (level: EngineLevel, side: SideChoice) => void }) => {
  const navigate = useNavigate();
  const [side, setSide] = useState<SideChoice>("w");
  const [level, setLevel] = useState<EngineLevel>(ENGINE_LEVELS[2]);

  const sides: { value: SideChoice; label: string; piece: string }[] = [
    { value: "w", label: "White", piece: "/pieces/wk.svg" },
    { value: "random", label: "Random", piece: "/pieces/wn.svg" },
    { value: "b", label: "Black", piece: "/pieces/bk.svg" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Brand size="sm" to="/dashboard" />
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Play the computer</h1>
        <p className="mt-1 text-muted-foreground">Pick your side and an opponent strength.</p>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Your side</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {sides.map((s) => (
              <button
                key={s.value}
                onClick={() => setSide(s.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors ${
                  side === s.value ? "border-primary bg-accent" : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <img src={s.piece} alt="" className="h-10 w-10" />
                <span className="text-sm font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Difficulty</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ENGINE_LEVELS.map((l) => (
              <button
                key={l.elo}
                onClick={() => setLevel(l)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  level.elo === l.elo ? "border-primary bg-accent" : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <div className="font-display text-lg font-semibold">{l.elo}</div>
                <div className="text-xs text-muted-foreground">{l.label}</div>
              </button>
            ))}
          </div>
        </section>

        <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={() => onStart(level, side)}>
          Start game
        </Button>
      </main>
    </div>
  );
};

/* ------------------------------ Computer game ----------------------------- */

const ComputerGame = ({ session, onChangeSettings }: { session: Session; onChangeSettings: () => void }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const game = useComputerGame(session.level, session.color);
  const opponentLabel = `Stockfish · ${session.level.elo}`;
  const myName = currentUser?.displayName || currentUser?.email || "You";

  // Persist the result once (surfaces in dashboard history).
  useEffect(() => {
    if (!game.result || !currentUser) return;
    const win = game.result.winner;
    const outcome = win == null ? "draw" : win === session.color ? "win" : "loss";
    saveGameResult({
      userId: currentUser.uid,
      userEmail: currentUser.email ?? "",
      userName: myName,
      playerColor: session.color,
      result: outcome,
      opponentName: opponentLabel,
      moves: game.moveHistory,
      finalPosition: game.fen,
      timestamp: new Date(),
      duration: Math.floor((Date.now() - game.startedAt) / 1000),
    }).catch((err) => console.error("Failed to save game result:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.result]);

  const outcome = game.result
    ? game.result.winner == null
      ? "draw"
      : game.result.winner === session.color
        ? "win"
        : "loss"
    : null;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background lg:h-[100dvh] lg:overflow-hidden">
      <header className="flex-shrink-0 border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-6">
          <Brand size="sm" to="/dashboard" />
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={onChangeSettings}>
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Change</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-3 sm:px-6 sm:py-4 lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        <div className="flex flex-col items-center justify-center gap-2 lg:min-h-0">
          <div className="w-full max-w-[min(92vw,68vh,40rem)]">
            <PlayerBar name={opponentLabel} initial="S" active={game.thinking} thinking={game.thinking} />
            <div className="my-2">
              <ChessBoard
                board={game.board}
                onSquareClick={game.select}
                selectedSquare={game.selected}
                validMoves={game.legalTargets}
                playerColor={session.color}
                lastMove={game.lastMove}
                checkSquare={game.checkSquare}
              />
            </div>
            <PlayerBar name={myName} initial={myName.charAt(0).toUpperCase()} active={game.isPlayerTurn} you />
          </div>
        </div>

        <aside className="flex min-h-0 flex-col rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-display text-base font-semibold">Moves</h2>
            {game.inCheck && (
              <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                Check
              </span>
            )}
          </div>
          <div className="max-h-[38vh] flex-1 overflow-y-auto px-2 py-2 lg:max-h-none">
            {game.moveHistory.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {session.color === "b" ? "Stockfish is thinking…" : "Your move."}
              </p>
            ) : (
              <ol className="text-sm">
                {Array.from({ length: Math.ceil(game.moveHistory.length / 2) }).map((_, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[2rem_1fr_1fr] items-center gap-1 rounded-md px-2 py-1 odd:bg-secondary/40"
                  >
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <span className="font-medium">{game.moveHistory[i * 2]}</span>
                    <span className="text-foreground/80">{game.moveHistory[i * 2 + 1] ?? ""}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              {game.thinking ? "Stockfish is thinking…" : `${game.turn === "w" ? "White" : "Black"} to move`}
            </span>
            {!game.result && (
              <Button variant="outline" size="sm" onClick={game.resign}>
                <Flag className="h-3.5 w-3.5" /> Resign
              </Button>
            )}
          </div>
        </aside>
      </div>

      {game.result && outcome && (
        <Overlay>
          <div className="w-[20rem] rounded-xl border border-border bg-popover p-6 text-center shadow-xl">
            <h2
              className={`font-display text-3xl font-semibold ${
                outcome === "win" ? "text-primary" : outcome === "loss" ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {outcome === "win" ? "You won" : outcome === "loss" ? "You lost" : "Draw"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{REASON_LABELS[game.result.reason]}</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={game.newGame}>
                <RotateCcw className="h-4 w-4" /> Rematch
              </Button>
              <Button variant="outline" onClick={onChangeSettings}>
                Change settings
              </Button>
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Back to dashboard
              </Button>
            </div>
          </div>
        </Overlay>
      )}

      {game.pendingPromotion && (
        <Overlay>
          <div className="mx-4 rounded-xl border border-border bg-popover p-4 shadow-xl sm:p-5">
            <h3 className="mb-4 text-center font-display text-lg font-semibold">Promote to</h3>
            <div className="flex gap-2">
              {PROMOTION_PIECES.map((piece) => (
                <button
                  key={piece}
                  onClick={() => game.confirmPromotion(piece)}
                  aria-label={piece}
                  className="group flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-secondary transition-colors hover:border-primary hover:bg-accent sm:h-20 sm:w-20"
                >
                  <img
                    src={`/pieces/${session.color}${piece}.svg`}
                    alt=""
                    className="h-9 w-9 transition-transform group-hover:scale-110 sm:h-11 sm:w-11"
                  />
                </button>
              ))}
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
};

const Overlay = ({ children }: { children: ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm">
    {children}
  </div>
);

const PlayerBar = ({
  name,
  initial,
  active,
  you,
  thinking,
}: {
  name: string;
  initial: string;
  active?: boolean;
  you?: boolean;
  thinking?: boolean;
}) => (
  <div
    className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
      active ? "border-primary/50 bg-accent" : "border-border bg-card"
    }`}
  >
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold ${
        you ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      }`}
    >
      {initial}
    </div>
    <p className="truncate text-sm font-medium">{name}</p>
    {thinking && <Loader2 className="ml-auto h-4 w-4 animate-spin text-primary" />}
  </div>
);
