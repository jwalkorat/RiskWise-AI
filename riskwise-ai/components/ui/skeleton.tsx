/**
 * Skeleton — animated shimmer placeholder for loading states.
 *
 * Usage:
 *   <Skeleton className="h-6 w-40" />          // text line
 *   <Skeleton className="h-32 w-full" />        // card body
 *   <Skeleton className="h-10 w-10 rounded-full" /> // avatar
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}
