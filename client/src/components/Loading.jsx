import { SkeletonGrid, SkeletonRows } from "./Skeleton";

export default function Loading({ label = "Memuat...", variant = "spinner" }) {
  if (variant === "cards" || variant === "rows") {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        {variant === "cards" ? <SkeletonGrid /> : <SkeletonRows />}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mf-fade flex min-h-[40vh] flex-col items-center justify-center gap-5"
    >
      <span className="relative inline-flex h-12 w-12" aria-hidden="true">
        <span className="absolute inset-0 rounded-full border-2 border-primary/10" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gold border-r-gold/40" />
        <span className="absolute inset-[0.9rem] rounded-full bg-primary/80" />
      </span>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
    </div>
  );
}
