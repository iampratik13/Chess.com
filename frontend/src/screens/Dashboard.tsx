import { useNavigate } from "react-router-dom";
import { LogOut, Play, Gamepad2, Users, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { type GameResult } from "@/services/gameService";
import { RoomModal } from "@/components/RoomModal";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsRing } from "@/components/StatsRing";

const RESULT_STYLES: Record<GameResult["result"], string> = {
  win: "bg-primary/10 text-primary",
  loss: "bg-destructive/10 text-destructive",
  draw: "bg-muted text-muted-foreground",
};

export const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { stats, games, loading } = useUserData(currentUser?.uid);
  const [roomModal, setRoomModal] = useState<"create" | "join" | null>(null);

  const name = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Player";

  const statCards = [
    { label: "Games", value: stats.gamesPlayed },
    { label: "Wins", value: stats.wins, accent: "text-primary" },
    { label: "Losses", value: stats.losses, accent: "text-destructive" },
    { label: "Draws", value: stats.draws },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Brand size="md" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{name}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              {name.charAt(0).toUpperCase()}
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout().then(() => navigate("/signin"))}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Hero band */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card">
          <div className="texture-glow pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative grid items-center gap-6 p-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-primary">Welcome back</p>
              <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{name}</h1>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Jump straight into a game, or set up a private room for a friend.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => navigate("/game")}>
                  <Play className="h-4 w-4" /> Play online
                </Button>
                <Button size="lg" variant="outline" onClick={() => setRoomModal("create")}>
                  <Gamepad2 className="h-4 w-4" /> Create room
                </Button>
                <Button size="lg" variant="ghost" onClick={() => setRoomModal("join")}>
                  <Users className="h-4 w-4" /> Join
                </Button>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <StatsRing wins={stats.wins} losses={stats.losses} draws={stats.draws} loading={loading} />
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-14" />
              ) : (
                <p className={`mt-1 font-display text-3xl font-semibold ${card.accent ?? ""}`}>
                  {card.value}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Recent games */}
        <div className="mt-10 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent games</h2>
        </div>
        <div className="mt-4 rounded-xl border border-border bg-card">
          {loading ? (
            <ul className="divide-y divide-border">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-4">
                  <Skeleton className="h-6 w-12" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </li>
              ))}
            </ul>
          ) : games.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <img src="/pieces/wp.svg" alt="" className="h-10 w-10 opacity-70" />
              <p className="text-sm text-muted-foreground">
                No games yet — play your first to see it here.
              </p>
              <Button size="sm" onClick={() => navigate("/game")}>
                Play now <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {games.map((game, i) => (
                <li key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold uppercase ${RESULT_STYLES[game.result]}`}
                    >
                      {game.result}
                    </span>
                    <div>
                      <p className="text-sm font-medium">vs {game.opponentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(game.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · as {game.playerColor === "w" ? "White" : "Black"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {game.duration != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.floor(game.duration / 60)}:{(game.duration % 60).toString().padStart(2, "0")}
                      </span>
                    )}
                    <span>{game.moves.length} moves</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <RoomModal
        isOpen={roomModal !== null}
        mode={roomModal ?? "create"}
        onClose={() => setRoomModal(null)}
        onCreateRoom={() => navigate("/game?createRoom=true")}
        onJoinRoom={(code) => navigate(`/game?joinRoom=${code}`)}
      />
    </div>
  );
};
