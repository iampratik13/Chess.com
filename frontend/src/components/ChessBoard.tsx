import type { Color, PieceSymbol, Square } from "chess.js";

type Cell = { square: Square; type: PieceSymbol; color: Color } | null;

interface ChessBoardProps {
  board: Cell[][];
  onSquareClick?: (square: Square) => void;
  selectedSquare?: Square | null;
  validMoves?: Square[];
  playerColor?: "w" | "b" | null;
  lastMove?: { from: Square; to: Square } | null;
  checkSquare?: Square | null;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export const ChessBoard = ({
  board,
  onSquareClick,
  selectedSquare,
  validMoves = [],
  playerColor,
  lastMove,
  checkSquare,
}: ChessBoardProps) => {
  const flipped = playerColor === "b";

  // Present ranks 8→1 top-to-bottom for white; reverse for black.
  const rows = flipped ? [...board].reverse().map((row) => [...row].reverse()) : board;

  const squareName = (x: number, y: number): Square => {
    const file = flipped ? FILES[7 - x] : FILES[x];
    const rank = flipped ? y + 1 : 8 - y;
    return `${file}${rank}` as Square;
  };

  return (
    <div className="w-full aspect-square grid grid-cols-8 overflow-hidden rounded-md ring-1 ring-black/10 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.45)] select-none">
      {rows.map((row, y) =>
        row.map((piece, x) => {
          const square = squareName(x, y);
          const isDark = (x + y) % 2 === 1;
          const isSelected = selectedSquare === square;
          const isLastMove = lastMove?.from === square || lastMove?.to === square;
          const isCheck = checkSquare === square;
          const isTarget = validMoves.includes(square);

          const base = isDark ? "bg-board-dark" : "bg-board-light";
          const active = isSelected || isLastMove
            ? isDark
              ? "bg-board-dark-active"
              : "bg-board-light-active"
            : base;

          const showRank = x === 0;
          const showFile = y === 7;
          const labelOnDark = isDark;

          return (
            <button
              key={square}
              type="button"
              onClick={() => onSquareClick?.(square)}
              aria-label={square}
              className={`relative aspect-square ${active} transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring`}
            >
              {isCheck && (
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle, var(--board-check) 0%, color-mix(in oklab, var(--board-check), transparent 45%) 45%, transparent 72%)",
                  }}
                />
              )}

              {showRank && (
                <span
                  className={`absolute left-[3%] top-[2%] text-[min(1.6vw,0.7rem)] font-semibold ${
                    labelOnDark ? "text-board-light/80" : "text-board-dark/80"
                  }`}
                >
                  {flipped ? y + 1 : 8 - y}
                </span>
              )}
              {showFile && (
                <span
                  className={`absolute right-[4%] bottom-[2%] text-[min(1.6vw,0.7rem)] font-semibold ${
                    labelOnDark ? "text-board-light/80" : "text-board-dark/80"
                  }`}
                >
                  {flipped ? FILES[7 - x] : FILES[x]}
                </span>
              )}

              {isTarget && !piece && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-[30%] h-[30%] rounded-full bg-black/25" />
                </span>
              )}
              {isTarget && piece && (
                <span className="absolute inset-[6%] rounded-full ring-[6px] ring-black/25" />
              )}

              {piece && (
                <img
                  src={`/pieces/${piece.color}${piece.type}.svg`}
                  alt={`${piece.color === "w" ? "White" : "Black"} ${piece.type}`}
                  draggable={false}
                  className={`absolute inset-0 h-full w-full p-[8%] drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)] transition-transform duration-150 ${
                    isSelected ? "scale-105" : ""
                  }`}
                />
              )}
            </button>
          );
        }),
      )}
    </div>
  );
};
