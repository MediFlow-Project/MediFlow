const TONES = {
  navy: {
    box: "mf-surface-navy text-white shadow-lg",
    kicker: "text-gold",
    value: "text-white",
    hint: "text-white/65",
    mark: "bg-white/10 text-gold ring-white/15",
  },
  gold: {
    box: "mf-surface-gold text-primary shadow-md ring-1 ring-gold/35",
    kicker: "text-bronze",
    value: "text-primary",
    hint: "text-bronze/80",
    mark: "bg-white/70 text-bronze ring-gold/30",
  },
  paper: {
    box: "mf-card",
    kicker: "text-bronze",
    value: "text-primary",
    hint: "text-muted",
    mark: "bg-mist text-primary ring-primary/10",
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
    <article className={`mf-rise flex items-start gap-5 rounded-md p-6 sm:p-7 ${t.box}`}>
      <div className="min-w-0 flex-1">
        <p className={`text-[0.66rem] font-bold uppercase tracking-[0.2em] ${t.kicker}`}>
          {label}
        </p>
        <p
          className={`tabular mt-2 font-display text-4xl font-medium leading-none sm:text-5xl ${t.value}`}
        >
          {value}
        </p>
        {hint ? <p className={`mt-3 text-sm leading-relaxed ${t.hint}`}>{hint}</p> : null}
      </div>
      {Icon ? (
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full p-3 ring-1 ${t.mark}`}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
    </article>
  );
}
