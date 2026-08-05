import { useRef, type PointerEvent } from "react";
import type { Color, PieceSymbol, Square } from "chess.js";

type Cell = { square: Square; type: PieceSymbol; color: Color } | null;

interface HeroBoard3DProps {
  board: Cell[][];
  lastMove?: { from: Square; to: Square } | null;
  className?: string;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const REST = "rotateX(24deg) rotateY(-8deg) rotateZ(1deg)";

/**
 * A decorative, mouse-reactive 3D chess board for marketing surfaces. Built on
 * CSS 3D transforms (perspective + preserve-3d) rather than WebGL, so it adds
 * no bundle weight and stays smooth. Pieces are elevated on the Z axis so they
 * float above the board and parallax as it tilts toward the cursor.
 */
export const HeroBoard3D = ({ board, lastMove, className = "" }: HeroBoard3DProps) => {
  const planeRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (planeRef.current) {
        planeRef.current.style.transform = `rotateX(${24 - py * 20}deg) rotateY(${-8 + px * 22}deg) rotateZ(1deg)`;
      }
    });
  };

  const reset = () => {
    cancelAnimationFrame(frame.current);
    if (planeRef.current) planeRef.current.style.transform = REST;
  };

  return (
    <div
      className={`[perspective:1400px] ${className}`}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      <div
        ref={planeRef}
        className="relative grid aspect-square w-full grid-cols-8 rounded-xl transition-transform duration-500 ease-out [transform-style:preserve-3d]"
        style={{ transform: REST }}
      >
        {/* Board base / drop shadow slab */}
        <div
          className="pointer-events-none absolute -inset-[3%] rounded-2xl bg-board-frame [transform:translateZ(-18px)] shadow-[0_50px_80px_-30px_rgba(0,0,0,0.6)]"
          aria-hidden
        />
        {board.map((row, y) =>
          row.map((piece, x) => {
            const square = `${FILES[x]}${8 - y}` as Square;
            const isDark = (x + y) % 2 === 1;
            const isActive = lastMove?.from === square || lastMove?.to === square;
            const bg = isActive
              ? isDark
                ? "bg-board-dark-active"
                : "bg-board-light-active"
              : isDark
                ? "bg-board-dark"
                : "bg-board-light";
            return (
              <div key={square} className={`relative aspect-square ${bg}`}>
                {piece && (
                  <img
                    src={`/pieces/${piece.color}${piece.type}.svg`}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full p-[10%] [transform:translateZ(26px)] drop-shadow-[0_10px_8px_rgba(0,0,0,0.35)]"
                  />
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
};
