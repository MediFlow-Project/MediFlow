const TONES = {
  ink: {
    box: "mf-surface-ink text-white",
    kicker: "text-accent-light",
    value: "text-white",
    hint: "text-white/70",
    mark: "bg-white/10 text-accent-light",
  },
  accent: {
    box: "bg-accent text-white",
    kicker: "text-white/80",
    value: "text-white",
    hint: "text-white/80",
    mark: "bg-white/15 text-white",
  },
  paper: {
    box: "mf-card",
    kicker: "text-muted",
    value: "text-ink",
    hint: "text-muted",
    mark: "bg-mist text-primary",
  },
};

export default function StatCard({
  label,
  value,
  hint,
  tone = "paper",
  icon: Icon,
}) {
  const t = TONES[tone] || TONES.paper;

  return (
    <article className={`mf-rise flex items-start gap-5 rounded-2xl p-6 sm:p-7 ${t.box}`}>
      <div className="min-w-0 flex-1">
        <p className={`text-[0.72rem] font-semibold ${t.kicker}`}>
          {label}
        </p>
        <p
          className={`tabular mt-3 font-display text-4xl font-semibold leading-none sm:text-5xl ${t.value}`}
        >
          {value}
        </p>
        {hint ? <p className={`mt-3 text-sm leading-relaxed ${t.hint}`}>{hint}</p> : null}
      </div>
      {Icon ? (
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full p-3 ${t.mark}`}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
    </article>
  );
}
