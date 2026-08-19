export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="mf-kicker">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-ink md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
