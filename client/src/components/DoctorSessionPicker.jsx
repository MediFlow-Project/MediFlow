import { sessionLabel } from "../utils/format";
import Button from "./Button";
import EmptyState from "./EmptyState";
import Alert from "./Alert";
import { IconCalendar, IconClock } from "./Icons";

export default function DoctorSessionPicker({
  sessions,
  activeDate,
  activeSession,
  isOpen,
  busy,
  error,
  onSelect,
  onOpen,
}) {
  return (
    <aside className="space-y-4">
      {sessions.length === 0 ? (
        <EmptyState
          icon={IconCalendar}
          title="Tidak ada jadwal"
          hint="Admin belum mengatur jadwal untuk hari ini."
        />
      ) : (
        <div className="space-y-2.5">
          <p className="mf-kicker px-1">Sesi praktik</p>
          {sessions.map((item) => {
            const active =
              item.session === activeSession && item.date === activeDate;
            return (
              <button
                key={`${item.date}-${item.session}`}
                type="button"
                onClick={() => onSelect(item)}
                aria-current={active ? "true" : undefined}
                className={`w-full rounded-sm px-5 py-4 text-left transition duration-200 ease-soft ${
                  active
                    ? "mf-surface-ink text-white"
                    : "mf-card hover:border-accent"
                }`}
              >
                <p
                  className={
                    active
                      ? "mf-kicker-light"
                      : "text-xs font-semibold text-accent-ink"
                  }
                >
                  {sessionLabel(item.session)}
                </p>
                <p
                  className={`tabular mt-1.5 font-display text-2xl font-semibold ${
                    active ? "text-white" : "text-primary"
                  }`}
                >
                  {item.startTime}–{item.endTime}
                </p>
                <p
                  className={`mt-2 inline-flex items-center gap-2 text-xs ${
                    active ? "text-white/70" : "text-muted"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 ${
                      item.isOpen ? "bg-moss" : "bg-line"
                    }`}
                    aria-hidden="true"
                  />
                  {item.isOpen ? "Sesi terbuka" : "Belum dibuka"} · sisa{" "}
                  {item.remainingQuota}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <Button variant="pine" className="w-full" onClick={onOpen} loading={busy}>
        <IconClock className="h-3.5 w-3.5" />
        {isOpen ? "Buka ulang sesi" : "Buka sesi"}
      </Button>

      {error ? <Alert>{error}</Alert> : null}
    </aside>
  );
}
