import { sessionLabel } from "../utils/format";

export default function SessionChip({
  session,
  remainingQuota,
  startTime,
  endTime,
  selected,
  disabled,
  disabledLabel,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-sm border px-4 py-3 text-left transition duration-200 ease-soft ${
        selected
          ? "border-primary bg-primary text-white"
          : disabled
            ? "cursor-not-allowed border-hairline bg-sand/70 text-muted"
            : "border-line bg-white hover:border-accent"
      }`}
    >
      <p className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold opacity-80">
          {sessionLabel(session)}
        </span>
        {startTime ? (
          <span className="tabular font-mono text-[0.72rem] opacity-70">
            {startTime}–{endTime}
          </span>
        ) : null}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold">
        {!disabled && !selected ? (
          <span className="h-1.5 w-1.5 shrink-0 bg-moss" aria-hidden="true" />
        ) : null}
        {disabled
          ? disabledLabel || "Kuota penuh"
          : `Sisa ${remainingQuota}`}
      </p>
    </button>
  );
}
