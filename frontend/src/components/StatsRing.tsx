interface StatsRingProps {
  wins: number;
  losses: number;
  draws: number;
  loading?: boolean;
}

const SIZE = 184;
const STROKE = 18;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

const LegendRow = ({ dot, label, value }: { dot: string; label: string; value: number }) => (
  <li className="flex items-center gap-2">
    <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
    <span className="text-muted-foreground">{label}</span>
    <span className="ml-auto font-medium tabular-nums">{value}</span>
  </li>
);

/**
 * A pure-SVG donut summarizing the player's record. Distinct from the marketing
 * 3D board — this is the dashboard's data-forward hero visual.
 */
export const StatsRing = ({ wins, losses, draws, loading }: StatsRingProps) => {
  const total = wins + losses + draws;
  const winRate = total ? Math.round((wins / total) * 100) : 0;

  const segments = [
    { value: wins, className: "text-primary" },
    { value: draws, className: "text-muted-foreground/40" },
    { value: losses, className: "text-destructive" },
  ];

  let offset = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-secondary" />
          {total > 0 &&
            segments.map((segment, i) => {
              const dash = (segment.value / total) * C;
              const node = (
                <circle
                  key={i}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  fill="none"
                  strokeWidth={STROKE}
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-offset}
                  className={`${segment.className} stroke-current transition-[stroke-dasharray] duration-700 ease-out`}
                />
              );
              offset += dash;
              return node;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-semibold tabular-nums">
            {loading ? "—" : `${winRate}%`}
          </span>
          <span className="text-xs text-muted-foreground">win rate</span>
        </div>
      </div>

      <ul className="min-w-[7rem] space-y-2.5 text-sm">
        <LegendRow dot="bg-primary" label="Wins" value={wins} />
        <LegendRow dot="bg-muted-foreground/40" label="Draws" value={draws} />
        <LegendRow dot="bg-destructive" label="Losses" value={losses} />
      </ul>
    </div>
  );
};
