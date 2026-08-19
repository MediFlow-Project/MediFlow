export default function EmptyState({ title, hint, children }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-line bg-paper px-6 py-16 text-center">
      <p className="font-display text-2xl font-medium text-ink">{title}</p>
      {hint ? <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{hint}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
