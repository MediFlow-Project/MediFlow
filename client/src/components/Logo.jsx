import { HOSPITAL } from "../data/hospital";

export default function Logo({ compact = false, inverted = false }) {
  const mark = compact ? "h-9 w-9" : "h-11 w-11";
  const fill = inverted ? "#FFFFFF" : "#0EA5B5";
  const cross = inverted ? "#0EA5B5" : "#FFFFFF";
  return (
    <span className="inline-flex items-center gap-3">
      <svg viewBox="0 0 48 48" className={`shrink-0 ${mark}`} aria-hidden="true">
        <rect width="48" height="48" rx="14" fill={fill} />
        <rect x="21" y="10" width="6" height="28" rx="2" fill={cross} />
        <rect x="10" y="21" width="28" height="6" rx="2" fill={cross} />
      </svg>
      {compact ? null : (
        <span className="leading-tight">
          <span
            className={`block text-xl font-semibold tracking-tight md:text-[1.35rem] ${
              inverted ? "text-white" : "text-ink"
            }`}
          >
            MediFlow
          </span>
          <span
            className={`mt-0.5 block text-[0.68rem] font-medium ${
              inverted ? "text-white/70" : "text-muted"
            }`}
          >
            {HOSPITAL.tagline}
          </span>
        </span>
      )}
    </span>
  );
}
