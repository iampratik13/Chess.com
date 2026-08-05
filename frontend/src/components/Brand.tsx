import { Link } from "react-router-dom";

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { tile: string; knight: string; text: string }> = {
  sm: { tile: "h-8 w-8 rounded-lg", knight: "h-5 w-5", text: "text-lg" },
  md: { tile: "h-10 w-10 rounded-xl", knight: "h-6 w-6", text: "text-2xl" },
  lg: { tile: "h-14 w-14 rounded-2xl", knight: "h-9 w-9", text: "text-4xl" },
};

/**
 * The Gambit wordmark: a white knight seated on a green chess-tile mark, paired
 * with the display-serif name. The tile gives the logo a distinct, ownable
 * silhouette and a playful hover.
 */
export const Brand = ({
  size = "md",
  to = "/",
  className = "",
}: {
  size?: Size;
  to?: string;
  className?: string;
}) => {
  const s = SIZES[size];
  return (
    <Link to={to} className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`relative flex items-center justify-center bg-primary shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-105 ${s.tile}`}
      >
        <img src="/pieces/wn.svg" alt="" className={s.knight} draggable={false} />
      </span>
      <span className={`font-display font-semibold tracking-tight ${s.text}`}>Gambit</span>
    </Link>
  );
};
