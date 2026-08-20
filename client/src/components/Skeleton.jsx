export default function Skeleton({ className = "h-4 w-full" }) {
  return <span className={`mf-skeleton block ${className}`} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-3 ${index === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ media = true }) {
  return (
    <div className="mf-card overflow-hidden" aria-hidden="true">
      {media ? <Skeleton className="h-44 w-full rounded-none" /> : null}
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/5" />
        <SkeletonText lines={2} />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, media = true, className = "" }) {
  return (
    <div
      className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} media={media} />
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mf-card flex items-center gap-4 p-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}
