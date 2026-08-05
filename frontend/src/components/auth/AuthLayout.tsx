import type { ReactNode } from "react";
import { Chess } from "chess.js";
import { Brand } from "@/components/Brand";
import { ChessBoard } from "@/components/ChessBoard";

const previewBoard = (() => {
  const chess = new Chess();
  ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"].forEach((m) => chess.move(m));
  return chess.board();
})();

/**
 * Two-column auth shell: a warm marketing panel with a live board preview on
 * the left (hidden on small screens) and the form card on the right. Shared by
 * the sign-in and sign-up screens so they can't drift apart.
 */
export const AuthLayout = ({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) => (
  <div className="min-h-screen grid lg:grid-cols-2">
    {/* Marketing panel */}
    <div className="relative hidden lg:flex flex-col justify-between bg-secondary p-12">
      <Brand size="md" />
      <div className="max-w-sm">
        <figure className="mb-8 w-64">
          <div className="rounded-lg border border-border bg-card p-2 shadow-sm">
            <ChessBoard board={previewBoard} playerColor="w" lastMove={{ from: "f8", to: "b4" }} />
          </div>
          <figcaption className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
            Nimzo-Indian Defence
          </figcaption>
        </figure>
        <h2 className="font-display text-3xl font-semibold leading-tight">
          A calmer place to play chess.
        </h2>
        <p className="mt-3 text-muted-foreground">
          Real-time games, private rooms, and a board that feels good to move on.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Built for players, not billboards.</p>
    </div>

    {/* Form panel */}
    <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="lg:hidden mb-8">
          <Brand size="sm" />
        </div>
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
      </div>
    </div>
  </div>
);

export const GoogleButton = ({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
  >
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
    {label}
  </button>
);
