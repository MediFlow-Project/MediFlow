export default function Logo({ compact = false, inverted = false }) {
  const mark = compact ? "h-9 w-9" : "h-11 w-11";
  return (
    <span className="inline-flex items-center gap-3">
      <svg viewBox="0 0 48 48" className={`shrink-0 ${mark}`} aria-hidden="true">
        <rect width="48" height="48" rx="6" fill={inverted ? "#C4A574" : "#0C2340"} />
        <rect x="21" y="10" width="6" height="28" rx="0.5" fill={inverted ? "#0C2340" : "#C4A574"} />
        <rect x="10" y="21" width="28" height="6" rx="0.5" fill={inverted ? "#0C2340" : "#C4A574"} />
      </svg>
      {compact ? null : (
        <span className="leading-tight">
          <span
            className={`block font-display text-xl font-semibold tracking-tight md:text-[1.35rem] ${
              inverted ? "text-white" : "text-primary"
            }`}
          >
            RS MediFlow
          </span>
          <span
            className={`block text-[0.62rem] font-semibold uppercase tracking-[0.2em] ${
              inverted ? "text-gold" : "text-bronze"
            }`}
          >
            Rumah Sakit
          </span>
        </span>
      )}
    </span>
  );
}
