import { useId } from "react";

function Mark({ className = "h-10 w-10" }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <clipPath id={`${id}-shade`}>
          <rect x="32" y="0" width="32" height="64" />
        </clipPath>
      </defs>
      <g fill="#2a9d8f">
        <rect x="22" y="4" width="20" height="56" rx="10" />
        <rect x="4" y="22" width="56" height="20" rx="10" />
      </g>
      <g fill="#0f4f48" clipPath={`url(#${id}-shade)`}>
        <rect x="22" y="4" width="20" height="56" rx="10" />
        <rect x="4" y="22" width="56" height="20" rx="10" />
      </g>
      <path
        fill="#fff"
        d="M32 26.2c-3.7-4.6-10-1.5-10 4.5 0 6.5 10 12 10 12s10-5.5 10-12c0-6-6.3-9.1-10-4.5z"
      />
    </svg>
  );
}

export default function Logo({ compact = false, inverted = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark className={compact ? "h-8 w-8" : "h-10 w-10"} />
      {compact ? null : (
        <span
          className={`font-display text-lg font-medium tracking-tight md:text-xl ${
            inverted ? "text-white" : "text-primary"
          }`}
        >
          RS MediFlow
        </span>
      )}
    </span>
  );
}
