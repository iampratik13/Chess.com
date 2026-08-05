import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Copy, Check, Flag, LayoutDashboard, LogOut } from "lucide-react";
import type { GameOverReason, PromotionPiece } from "@chess/protocol";

import { ChessBoard } from "@/components/ChessBoard";
import { Brand } from "@/components/Brand";
import { useSocket } from "@/hooks/useSocket";
import { useChessGame } from "@/hooks/useChessGame";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { saveGameResult } from "@/services/gameService";

const PROMOTION_PIECES: { piece: PromotionPiece; label: string }[] = [
  { piece: "q", label: "Queen" },
  { piece: "r", label: "Rook" },
  { piece: "b", label: "Bishop" },
  { piece: "n", label: "Knight" },
];

const REASON_LABELS: Record<GameOverReason, string> = {
  checkmate: "by checkmate",
  stalemate: "by stalemate",
  threefold_repetition: "by repetition",
  insufficient_material: "insufficient material",
  draw: "drawn",
  resign: "by resignation",
  abandon: "opponent left",
};

export const Game = () => {
  const socket = useSocket();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const game = useChessGame(socket);

  const myName = currentUser?.displayName || currentUser?.email || "Me";
  const myInitial = myName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!socket || !currentUser) return;
    game.identify(myName);
    const create = searchParams.get("createRoom");
    const join = searchParams.get("joinRoom");
    if (create === "true") game.createRoom();
    else if (join) game.joinRoom(join);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, currentUser]);

  // Persist the result once, with fresh game state.
  useEffect(() => {
    if (!game.result || !currentUser || !game.color) return;
    const outcome =
      game.result.winner == null ? "draw" : game.result.winner === game.color ? "win" : "loss";
    saveGameResult({
      userId: currentUser.uid,
      userEmail: currentUser.email ?? "",
      userName: myName,
      playerColor: game.color,
      result: outcome,
      opponentName: game.opponentName,
      moves: game.moveHistory,
      finalPosition: game.fen,
      timestamp: new Date(),
      duration: Math.floor((Date.now() - game.startedAt) / 1000),
    }).catch((err) => console.error("Failed to save game result:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.result]);

  if (!socket) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <div className="animate-pulse">Connecting…</div>
      </div>
    );
  }

  const playing = game.status === "playing";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background lg:h-[100dvh] lg:overflow-hidden">
      <header className="flex-shrink-0 border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-6">
          <Brand size="sm" to="/dashboard" />
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout().then(() => navigate("/signin"))}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-3 sm:px-6 sm:py-4 lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        {/* Board column */}
        <div className="flex flex-col items-center justify-center gap-2 lg:min-h-0">
          <div className="w-full max-w-[min(92vw,68vh,40rem)]">
            <PlayerBar
              name={game.opponentName}
              initial={game.opponentName.charAt(0).toUpperCase()}
              active={playing && !game.isMyTurn}
            />
            <div className="my-2">
              <ChessBoard
                board={game.board}
                onSquareClick={game.select}
                selectedSquare={game.selected}
                validMoves={game.legalTargets}
                playerColor={game.color}
                lastMove={game.lastMove}
                checkSquare={game.checkSquare}
              />
            </div>
            <PlayerBar name={myName} initial={myInitial} active={playing && game.isMyTurn} you />
          </div>
        </div>

        {/* Side panel */}
        <aside className="min-h-0 flex flex-col rounded-xl border border-border bg-card">
          {playing || game.status === "over" ? (
            <MovePanel
              moves={game.moveHistory}
              turn={game.turn}
              inCheck={game.inCheck}
              canResign={playing}
              onResign={game.resign}
            />
          ) : game.status === "searching" || game.status === "waiting_room" ? (
            <WaitingPanel
              roomCode={game.roomCode}
              onCancel={() => {
                game.cancelSearch();
                navigate("/dashboard");
              }}
            />
          ) : (
            <StartPanel onPlay={game.findMatch} error={game.error} />
          )}
        </aside>
      </div>

      {game.status === "over" && game.result && (
        <GameOverDialog
          reason={game.result.reason}
          outcome={
            game.result.winner == null ? "draw" : game.result.winner === game.color ? "win" : "loss"
          }
          onDashboard={() => navigate("/dashboard")}
        />
      )}

      {game.pendingPromotion && (
        <Overlay>
          <div className="mx-4 rounded-xl border border-border bg-popover p-4 shadow-xl sm:p-5">
            <h3 className="mb-4 text-center font-display text-lg font-semibold">Promote to</h3>
            <div className="flex gap-2">
              {PROMOTION_PIECES.map(({ piece, label }) => (
                <button
                  key={piece}
                  onClick={() => game.confirmPromotion(piece)}
                  aria-label={label}
                  className="group flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-border bg-secondary transition-colors hover:border-primary hover:bg-accent sm:h-20 sm:w-20"
                >
                  <img
                    src={`/pieces/${game.color}${piece}.svg`}
                    alt=""
                    className="h-9 w-9 transition-transform group-hover:scale-110 sm:h-11 sm:w-11"
                  />
                  <span className="mt-1 text-xs text-muted-foreground">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {game.opponentDisconnected && (
        <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-2 text-sm shadow-lg">
          <span className="font-medium text-foreground">Opponent disconnected</span>
          <span className="ml-2 text-muted-foreground">waiting to reconnect…</span>
        </div>
      )}
    </div>
  );
};

/* --------------------------- Presentational bits --------------------------- */

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
}: {
  name: string;
  initial: string;
  active?: boolean;
  you?: boolean;
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
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{name}</p>
      {active && <p className="text-xs text-primary">to move</p>}
    </div>
    {active && <span className="ml-auto h-2 w-2 rounded-full bg-primary animate-pulse" />}
  </div>
);

const MovePanel = ({
  moves,
  turn,
  inCheck,
  canResign,
  onResign,
}: {
  moves: string[];
  turn: "w" | "b";
  inCheck: boolean;
  canResign: boolean;
  onResign: () => void;
}) => (
  <>
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <h2 className="font-display text-base font-semibold">Moves</h2>
      {inCheck && (
        <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          Check
        </span>
      )}
    </div>
    <div className="max-h-[38vh] flex-1 overflow-y-auto px-2 py-2 lg:max-h-none">
      {moves.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No moves yet.</p>
      ) : (
        <ol className="text-sm">
          {Array.from({ length: Math.ceil(moves.length / 2) }).map((_, i) => (
            <li
              key={i}
              className="grid grid-cols-[2rem_1fr_1fr] items-center gap-1 rounded-md px-2 py-1 odd:bg-secondary/40"
            >
              <span className="text-muted-foreground">{i + 1}.</span>
              <span className="font-medium">{moves[i * 2]}</span>
              <span className="text-foreground/80">{moves[i * 2 + 1] ?? ""}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
    <div className="border-t border-border px-4 py-3 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{turn === "w" ? "White" : "Black"} to move</span>
      {canResign && (
        <Button variant="outline" size="sm" onClick={onResign}>
          <Flag className="h-3.5 w-3.5" /> Resign
        </Button>
      )}
    </div>
  </>
);

const WaitingPanel = ({ roomCode, onCancel }: { roomCode: string | null; onCancel: () => void }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
      <h2 className="font-display text-xl font-semibold">
        {roomCode ? "Room ready" : "Finding an opponent"}
      </h2>
      {roomCode ? (
        <>
          <button
            onClick={copy}
            className="group flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 transition-colors hover:border-primary"
          >
            <span className="font-mono text-2xl font-bold tracking-[0.3em]">{roomCode}</span>
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            )}
          </button>
          <p className="text-sm text-muted-foreground">Share this code with a friend.</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Hang tight — this usually takes a moment.</p>
      )}
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
};

const StartPanel = ({ onPlay, error }: { onPlay: () => void; error: string | null }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
    <img src="/pieces/wn.svg" alt="" className="h-14 w-14 opacity-80" />
    <h2 className="font-display text-2xl font-semibold">Ready to play?</h2>
    <p className="max-w-[16rem] text-sm text-muted-foreground">
      Get matched with a random opponent and start a game.
    </p>
    {error && <p className="text-sm text-destructive">{error}</p>}
    <Button size="lg" onClick={onPlay} className="mt-1 w-full">
      Find a match
    </Button>
  </div>
);

const GameOverDialog = ({
  reason,
  outcome,
  onDashboard,
}: {
  reason: GameOverReason;
  outcome: "win" | "loss" | "draw";
  onDashboard: () => void;
}) => {
  const title = outcome === "win" ? "You won" : outcome === "loss" ? "You lost" : "Draw";
  const accent =
    outcome === "win" ? "text-primary" : outcome === "loss" ? "text-destructive" : "text-muted-foreground";
  return (
    <Overlay>
      <div className="w-[20rem] rounded-xl border border-border bg-popover p-6 text-center shadow-xl">
        <h2 className={`font-display text-3xl font-semibold ${accent}`}>{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{REASON_LABELS[reason]}</p>
        <Button onClick={onDashboard} className="mt-5 w-full">
          Back to dashboard
        </Button>
      </div>
    </Overlay>
  );
};
