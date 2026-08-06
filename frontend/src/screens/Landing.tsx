import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Chess } from "chess.js";
import { Users, KeyRound, LineChart, Cpu, } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Brand } from "@/components/Brand";
import { ChessBoard } from "@/components/ChessBoard";
import { Button } from "@/components/ui/button";

const heroBoard = (() => {
  const chess = new Chess();
  ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"].forEach((m) => chess.move(m));
  return chess.board();
})();

const FEATURES = [
  {
    icon: Users,
    title: "Play in real time",
    body: "Get matched instantly and play smooth, low-latency games against real opponents.",
  },
  {
    icon: KeyRound,
    title: "Private rooms",
    body: "Spin up a room, share a six-character code, and play a friend in seconds.",
  },
  {
    icon: Cpu,
    title: "Train vs Stockfish",
    body: "Practice against a world-class engine across ten strength levels, from 400 to 2800.",
  },
  {
    icon: LineChart,
    title: "Track your progress",
    body: "Every game is saved with your full record, so you can watch yourself improve.",
  },
];

const STEPS = [
  { n: "01", title: "Create an account", body: "Sign up with email or Google in under a minute." },
  { n: "02", title: "Find a game", body: "Match with a random opponent or open a private room." },
  { n: "03", title: "Play & improve", body: "Every result is saved to your dashboard automatically." },
];

export const Landing = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) navigate("/dashboard");
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Brand size="md" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/signin")}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => navigate("/signup")}>
              Get started
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="texture-dots pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="texture-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
          <div>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.03] sm:text-6xl lg:text-7xl">
              Chess that feels
              <br />
              handcrafted.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground sm:text-xl">
              A fast, elegant board for real-time games against friends, strangers, or a
              world-class engine.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate("/signup")}>
                Play now 
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/signin")}>
                I have an account
              </Button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-lg">
            <ChessBoard board={heroBoard} lastMove={{ from: "b8", to: "a6" }} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-7 transition-shadow hover:shadow-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Up and running in three steps
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="border-t-2 border-primary/20 pt-5">
                <span className="font-display text-4xl font-semibold text-primary/50">{step.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl font-semibold sm:text-5xl">
            Ready for your first move?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
            Create a free account and start playing in under a minute.
          </p>
          <Button size="lg" className="mt-8" onClick={() => navigate("/signup")}>
            Create free account
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <Brand />
          <p>© {new Date().getFullYear()} Gambit</p>
        </div>
      </footer>
    </div>
  );
};
