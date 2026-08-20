export default function EmptyState({ title, hint, icon: Icon, children }) {
  return (
    <div className="mf-card mf-fade flex flex-col items-center px-6 py-14 text-center">
      {Icon ? (
        <span
          className="mb-5 inline-flex items-center justify-center rounded-full border border-accent/30 bg-accent-soft p-4 text-accent-ink"
          aria-hidden="true"
        >
          <Icon className="h-6 w-6" />
        </span>
      ) : null}
      <p className="font-display text-3xl font-semibold text-ink">
        {title}
      </p>
      <div className="mf-rule mx-auto max-w-32" />
      {hint ? (
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{hint}</p>
      ) : null}
      {children ? <div className="mt-7">{children}</div> : null}
    </div>
  );
}
