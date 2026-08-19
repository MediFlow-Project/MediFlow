import StatusBadge from "./StatusBadge";
import Button from "./Button";

function QueueNumber({ value, size = "md" }) {
  const display = value ? String(value).padStart(2, "0") : "—";
  const sizes = {
    xl: "text-7xl md:text-8xl",
    lg: "text-5xl md:text-6xl",
    md: "text-3xl",
  };
  return (
    <p className={`tabular font-display font-medium tracking-tighter ${sizes[size]}`}>
      {display}
    </p>
  );
}

export default function QueueBoard({
  board,
  myQueueNumber,
  variant = "patient",
  onCall,
  onSkip,
  onStart,
  actionBusy = false,
}) {
  const items = board?.items || [];
  const nowServing = board?.nowServing;
  const ahead = items.filter(
    (item) =>
      myQueueNumber &&
      item.queueNumber < myQueueNumber &&
      ["booked", "waiting", "called", "in_consultation"].includes(item.status)
  ).length;
  const hasBusy = items.some(
    (item) => item.status === "called" || item.status === "in_consultation"
  );
  const hasWaiting = items.some((item) => item.status === "waiting");

  const list = (
    <ol className="space-y-2">
      {items.length === 0 ? (
        <li className="rounded-2xl bg-sand px-4 py-8 text-center text-sm text-muted">
          Belum ada pasien di papan ini.
        </li>
      ) : (
        items.map((item) => {
          const isMine = myQueueNumber && item.queueNumber === myQueueNumber;
          const isServing = nowServing && item.queueNumber === nowServing;
          return (
            <li
              key={`${item.queueNumber}-${item.appointmentId || item.status}`}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 ${
                isServing
                  ? "bg-amber-soft ring-1 ring-amber/40"
                  : isMine
                    ? "bg-mist ring-1 ring-primary/20"
                    : "bg-sand/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="tabular w-10 font-display text-2xl font-medium text-ink">
                  {String(item.queueNumber).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{item.patientNameMasked}</p>
                  {isServing ? (
                    <p className="text-xs font-semibold text-amber">Sedang dipanggil</p>
                  ) : null}
                  {isMine && !isServing ? (
                    <p className="text-xs font-semibold text-primary">Nomor Anda</p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.status} />
                {variant === "doctor" && item.appointmentId ? (
                  <>
                    {(item.status === "waiting" || item.status === "called") && (
                      <Button
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
                        disabled={actionBusy}
                        onClick={() => onSkip?.(item.appointmentId)}
                      >
                        Lewati
                      </Button>
                    )}
                    {item.status === "called" && (
                      <Button
                        variant="pine"
                        className="px-3 py-1.5 text-xs"
                        disabled={actionBusy}
                        onClick={() => onStart?.(item.appointmentId)}
                      >
                        Mulai konsul
                      </Button>
                    )}
                  </>
                ) : null}
              </div>
            </li>
          );
        })
      )}
    </ol>
  );

  if (variant === "doctor") {
    return (
      <section className="grid gap-4 lg:grid-cols-[minmax(260px,380px)_1fr]">
        <article className="relative overflow-hidden rounded-[1.5rem] bg-amber p-6 text-white shadow-lg shadow-amber/20">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="live-dot bg-white after:bg-white" />
            Sedang dipanggil
          </div>
          <QueueNumber value={nowServing} size="xl" />
          <p className="mt-1 text-sm font-medium text-white/80">
            Antrean live, tanpa refresh
          </p>
          <Button
            className="mt-6 w-full bg-ink text-white hover:bg-ink/90"
            onClick={onCall}
            disabled={actionBusy || hasBusy || !hasWaiting}
          >
            Panggil berikutnya
          </Button>
        </article>
        <article className="mf-card p-5 md:p-6">{list}</article>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <article className="relative overflow-hidden rounded-[1.5rem] bg-amber p-6 text-white shadow-lg shadow-amber/20">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="live-dot bg-white after:bg-white" />
            Sedang dipanggil
          </div>
          <QueueNumber value={nowServing} size="lg" />
          <p className="text-sm font-medium text-white/80">Nomor giliran saat ini</p>
        </article>
        <article className="rounded-[1.5rem] bg-primary p-6 text-white">
          <p className="text-sm font-semibold text-white/80">Nomor saya</p>
          <QueueNumber value={myQueueNumber} size="lg" />
          <p className="text-sm text-white/80">
            {ahead === 0 ? "Giliran Anda atau sudah lewat" : `${ahead} antrean di depan`}
          </p>
        </article>
      </div>
      <article className="mf-card p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Daftar antrean</p>
          <p className="text-xs font-semibold text-muted">Update realtime</p>
        </div>
        {list}
      </article>
    </section>
  );
}
