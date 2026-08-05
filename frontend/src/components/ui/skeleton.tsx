import { cn } from "@/lib/utils";

/** Warm shimmer placeholder used while data loads. */
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("relative overflow-hidden rounded-md bg-secondary", className)}
    {...props}
  >
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-black/5 to-transparent" />
  </div>
);
