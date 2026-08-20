export default function PageHeader({ eyebrow, title, description, children }) {
  return (
    <header className="mf-rise mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8">
      <div className="max-w-2xl">
        {eyebrow ? <p className="mf-kicker">{eyebrow}</p> : null}
        <h1 className="mt-3 font-display text-[2.1rem] font-medium leading-[1.12] tracking-tight text-primary sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <div className="mf-rule" />
        {description ? (
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </header>
  );
}
