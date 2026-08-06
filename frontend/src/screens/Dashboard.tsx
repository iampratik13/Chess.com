import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Play,
  Gamepad2,
  Users,
  Clock,
  ArrowRight,
  Cpu,
  Swords,
  Trophy,
  X,
  Minus,
  type LucideIcon,
} from "lucide-react";
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

interface ActionTileProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick: () => void;
  primary?: boolean;
}

const ActionTile = ({ icon: Icon, title, desc, onClick, primary }: ActionTileProps) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col items-start gap-3 overflow-hidden rounded-xl border p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
      primary
        ? "border-primary/40 bg-primary text-primary-foreground shadow-sm"
        : "border-border bg-card hover:border-primary/40"
    }`}
  >
    <span
      className={`flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
        primary ? "bg-primary-foreground/15" : "bg-secondary text-foreground group-hover:bg-primary/10 group-hover:text-primary"
      }`}
    >
      <Icon className="h-6 w-6" />
    </span>
    <span>
      <span className="block font-display text-lg font-semibold">{title}</span>
      <span className={`mt-0.5 block text-sm ${primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {desc}
      </span>
    </span>
  </button>
);

export const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { stats, games, loading } = useUserData(currentUser?.uid);
  const [roomModal, setRoomModal] = useState<"create" | "join" | null>(null);

  const name = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Player";

  const statCards: { label: string; value: number; icon: LucideIcon; accent?: string; iconTint: string }[] = [
    { label: "Games", value: stats.gamesPlayed, icon: Swords, iconTint: "bg-secondary text-foreground" },
    { label: "Wins", value: stats.wins, icon: Trophy, accent: "text-primary", iconTint: "bg-primary/10 text-primary" },
    {
      label: "Losses",
      value: stats.losses,
      icon: X,
      accent: "text-destructive",
      iconTint: "bg-destructive/10 text-destructive",
    },
    { label: "Draws", value: stats.draws, icon: Minus, iconTint: "bg-muted text-muted-foreground" },
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
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl"
            aria-hidden
          />
          <div className="relative grid items-center gap-8 p-8 md:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                Welcome back
              </span>
              <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{name}</h1>
              <p className="mt-2 max-w-sm text-muted-foreground">
                {stats.gamesPlayed > 0
                  ? `You've played ${stats.gamesPlayed} game${stats.gamesPlayed === 1 ? "" : "s"} so far — ready for the next one?`
                  : "Jump straight into a game, or set up a private room for a friend."}
              </p>
              {stats.gamesPlayed > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-sm">
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold tabular-nums">{stats.wins}</span>
                    <span className="text-muted-foreground">wins</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-3 py-1.5 text-sm">
                    <Swords className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold tabular-nums">{stats.gamesPlayed}</span>
                    <span className="text-muted-foreground">played</span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-center md:justify-end">
              <StatsRing wins={stats.wins} losses={stats.losses} draws={stats.draws} loading={loading} />
            </div>
          </div>
        </section>

        {/* Quick play */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActionTile
            primary
            icon={Play}
            title="Play online"
            desc="Match a live opponent"
            onClick={() => navigate("/game")}
          />
          <ActionTile
            icon={Cpu}
            title="Play computer"
            desc="Train against Stockfish"
            onClick={() => navigate("/play/computer")}
          />
          <ActionTile
            icon={Gamepad2}
            title="Create room"
            desc="Invite a friend to play"
            onClick={() => setRoomModal("create")}
          />
          <ActionTile
            icon={Users}
            title="Join room"
            desc="Enter a room code"
            onClick={() => setRoomModal("join")}
          />
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconTint}`}>
                  <card.icon className="h-5 w-5" />
                </span>
              </div>
              {loading ? (
                <Skeleton className="mt-3 h-9 w-16" />
              ) : (
                <p className={`mt-2 font-display text-4xl font-semibold tabular-nums ${card.accent ?? ""}`}>
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
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <img src="/pieces/wp.svg" alt="" className="h-14 w-14 opacity-70" />
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
