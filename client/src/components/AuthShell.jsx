import { HOSPITAL } from "../data/hospital";
import { IconAlert, IconShield } from "./Icons";

export default function AuthShell({
  eyebrow,
  title,
  description,
  headline,
  image,
  error,
  footer,
  children,
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
      <aside className="mf-rise relative overflow-hidden rounded-lg shadow-xl ring-1 ring-primary/10 max-lg:h-40 lg:sticky lg:top-32 lg:min-h-[32rem]">
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/55 to-primary-dark/10" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6 lg:p-8">
          <p className="mf-kicker-light">Portal pasien</p>
          <p className="mt-2 font-display text-2xl font-medium leading-tight lg:mt-3 lg:text-4xl">
            {headline}
          </p>
          <p className="mt-4 hidden items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-gold backdrop-blur-sm lg:inline-flex">
            <IconShield className="h-3.5 w-3.5" />
            {HOSPITAL.accreditation}
          </p>
        </div>
      </aside>

      <div className="mf-rise" style={{ animationDelay: "110ms" }}>
        <header className="mb-7">
          <p className="mf-kicker">{eyebrow}</p>
          <h1 className="mt-3 font-display text-[2rem] font-medium leading-[1.12] tracking-tight text-primary sm:text-4xl">
            {title}
          </h1>
          <div className="mf-rule" />
          {description ? (
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{description}</p>
          ) : null}
        </header>

        <div className="mf-card p-6 md:p-8">
          {error ? (
            <p
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-sm border border-danger/20 bg-clay/5 px-4 py-3 text-sm font-medium text-danger"
            >
              <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : null}
          {children}
        </div>

        {footer ? (
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        ) : null}
      </div>
    </div>
  );
}
