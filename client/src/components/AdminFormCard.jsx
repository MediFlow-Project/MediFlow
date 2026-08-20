export default function AdminFormCard({
  eyebrow,
  title,
  hint,
  onSubmit,
  actions,
  children,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="mf-card mf-rise mb-8 p-5 md:p-6"
    >
      <header className="mb-6 border-b border-hairline pb-4">
        {eyebrow ? <p className="mf-kicker">{eyebrow}</p> : null}
        <h2 className="mt-1.5 font-display text-2xl font-semibold text-ink">
          {title}
        </h2>
        {hint ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{hint}</p>
        ) : null}
      </header>
      {children}
      {actions ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
          {actions}
        </div>
      ) : null}
    </form>
  );
}
