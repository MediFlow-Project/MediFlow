import { HOSPITAL } from "../data/hospital";
import { IconAlert } from "./Icons";

export default function AuthShell({
  eyebrow,
  title,
  description,
  headline,
  error,
  footer,
  children,
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:items-start lg:gap-12">
      <aside className="mf-rise mf-surface-ink overflow-hidden rounded-3xl px-6 py-8 text-white max-lg:min-h-40 lg:sticky lg:top-32 lg:min-h-[32rem] lg:px-8 lg:py-10">
        <p className="mf-kicker-light">Portal rumah sakit</p>
        <p className="mf-display mt-4 text-3xl lg:text-4xl">{headline}</p>
        <dl className="mt-10 hidden space-y-5 border-t border-white/15 pt-6 lg:block">
          <div>
            <dt className="text-[0.72rem] font-semibold text-white/55">
              IGD 24 jam
            </dt>
            <dd className="mt-1 font-medium">{HOSPITAL.igd}</dd>
          </div>
          <div>
            <dt className="text-[0.72rem] font-semibold text-white/55">
              Jam poliklinik
            </dt>
            <dd className="mt-1 font-medium leading-relaxed">{HOSPITAL.hoursPoli}</dd>
          </div>
          <div>
            <dt className="text-[0.72rem] font-semibold text-white/55">
              Akreditasi
            </dt>
            <dd className="mt-1 font-medium">{HOSPITAL.accreditation}</dd>
          </div>
        </dl>
      </aside>

      <div className="mf-rise" style={{ animationDelay: "110ms" }}>
        <header className="mb-7">
          <p className="mf-kicker">{eyebrow}</p>
          <h1 className="mf-display mt-3 text-[2rem] text-ink sm:text-4xl">
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
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-danger/20 bg-clay/5 px-4 py-3 text-sm font-medium text-danger"
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
