import { sessionLabel, formatDateShort } from "../utils/format";

export default function SessionChip({
  session,
  remainingQuota,
  date,
  selected,
  disabled,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3.5 text-left transition ${
        selected
          ? "border-primary bg-primary text-white"
          : disabled
            ? "cursor-not-allowed border-line bg-sand text-muted"
            : "border-line bg-paper hover:border-primary hover:bg-mist"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wide">
        {formatDateShort(date)} · {sessionLabel(session)}
      </p>
      <p className="mt-1 text-sm font-semibold">
        {disabled ? "Kuota penuh" : `Sisa ${remainingQuota}`}
      </p>
    </button>
  );
}
