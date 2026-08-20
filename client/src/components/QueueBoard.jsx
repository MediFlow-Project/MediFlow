import StatusBadge from "./StatusBadge";
import Button from "./Button";
import LinkButton from "./LinkButton";

const NUMBER_SIZES = {
  xl: "text-7xl md:text-8xl",
  lg: "text-6xl",
  md: "text-3xl",
};

const ACTIVE_STATUSES = ["booked", "waiting", "called", "in_consultation"];

function QueueNumber({ value, size = "md", className = "" }) {
  const display = value ? String(value).padStart(2, "0") : "—";
  return (
    <p
      className={`tabular font-display font-medium leading-[0.95] tracking-tighter ${NUMBER_SIZES[size]} ${className}`}
    >
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
      ACTIVE_STATUSES.includes(item.status)
  ).length;
  const hasBusy = items.some(
    (item) => item.status === "called" || item.status === "in_consultation"
  );
  const hasWaiting = items.some((item) => item.status === "waiting");

  const list = (
    <ol className="divide-y divide-hairline">
      {items.length === 0 ? (
        <li className="bg-sand/40 px-4 py-14 text-center text-sm text-muted">
          Belum ada pasien di papan ini.
        </li>
      ) : (
        items.map((item) => {
          const isMine = myQueueNumber && item.queueNumber === myQueueNumber;
          const isServing = nowServing && item.queueNumber === nowServing;
          return (
            <li
              key={`${item.queueNumber}-${item.appointmentId || item.status}`}
              className={`relative flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 pl-6 transition-colors duration-200 ${
                isServing
                  ? "bg-gold-soft"
                  : isMine
                    ? "bg-mist"
                    : "bg-white hover:bg-mist/40"
              }`}
            >
              {isServing || isMine ? (
                <span
                  className={`absolute inset-y-0 left-0 w-1 ${
                    isServing ? "bg-gold" : "bg-primary/45"
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className={`tabular inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-xl font-medium ${
                    isServing
                      ? "bg-primary text-gold shadow-sm"
                      : "bg-mist text-primary ring-1 ring-primary/10"
                  }`}
                >
                  {String(item.queueNumber).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {item.patientNameMasked}
                  </p>
                  {isServing ? (
                    <p className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-bronze">
                      Sedang dipanggil
                    </p>
                  ) : isMine ? (
                    <p className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-primary">
                      Nomor Anda
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.status} />
                {variant === "doctor" && item.appointmentId ? (
                  <>
                    {item.status === "waiting" || item.status === "called" ? (
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={actionBusy}
                        onClick={() => onSkip?.(item.appointmentId)}
                      >
                        Lewati
                      </Button>
                    ) : null}
                    {item.status === "called" ? (
                      <Button
                        variant="pine"
                        size="sm"
                        disabled={actionBusy}
                        onClick={() => onStart?.(item.appointmentId)}
                      >
                        Mulai konsul
                      </Button>
                    ) : null}
                    {item.status === "completed" ? (
                      <LinkButton
                        to={`/pesan/${item.appointmentId}`}
                        variant="ghost"
                        size="sm"
                      >
                        Pesan
                      </LinkButton>
                    ) : null}
                  </>
                ) : null}
              </div>
            </li>
          );
        })
      )}
    </ol>
  );

  const listCard = (
    <article className="mf-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-hairline bg-gradient-to-b from-white to-mist px-4 py-3.5">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-primary">
          Daftar antrean
        </p>
        <p className="inline-flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
          <span className="live-dot !bg-moss" aria-hidden="true" />
          Live
        </p>
      </div>
      {list}
    </article>
  );

  const nowServingPanel = (size) => (
    <article className="mf-surface-navy relative overflow-hidden rounded-md p-7 text-white shadow-xl">
      <span
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="mf-kicker-light inline-flex items-center gap-2.5">
          <span className="live-dot" aria-hidden="true" />
          Sedang dilayani
        </p>
        <QueueNumber value={nowServing} size={size} className="mt-4 text-gold" />
        <div className="mf-hairline mt-5" />
        <p className="mt-4 text-sm text-white/60">
          {nowServing
            ? "Papan poliklinik · langsung diperbarui"
            : "Belum ada nomor yang dipanggil"}
        </p>
        {variant === "doctor" ? (
          <Button
            variant="amber"
            size="lg"
            className="mt-6 w-full"
            onClick={onCall}
            disabled={actionBusy || hasBusy || !hasWaiting}
          >
            Panggil berikutnya
          </Button>
        ) : null}
      </div>
    </article>
  );

  if (variant === "doctor") {
    return (
      <section className="grid gap-5 lg:grid-cols-[minmax(260px,360px)_1fr]">
        {nowServingPanel("xl")}
        {listCard}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        {nowServingPanel("lg")}
        <article className="mf-card relative overflow-hidden p-7">
          <span
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold-soft blur-2xl"
            aria-hidden="true"
          />
          <div className="relative">
            <p className="mf-kicker">Nomor kunjungan Anda</p>
            <QueueNumber value={myQueueNumber} size="lg" className="mt-4 text-primary" />
            <div className="mf-hairline mt-5" />
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  ahead === 0 ? "bg-moss" : "bg-gold"
                }`}
                aria-hidden="true"
              />
              {ahead === 0
                ? "Giliran Anda atau sudah lewat"
                : `${ahead} antrean di depan`}
            </p>
          </div>
        </article>
      </div>
      {listCard}
    </section>
  );
}
