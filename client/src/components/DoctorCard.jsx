import { Link } from "react-router-dom";
import { formatDateShort, formatFee, initials, sessionLabel } from "../utils/format";
import { IconArrow } from "./Icons";

export default function DoctorCard({ doctor, nextSession }) {
  return (
    <article className="mf-card mf-card-interactive group flex overflow-hidden">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-mist sm:h-36 sm:w-40">
        {doctor.imgUrl ? (
          <img
            src={doctor.imgUrl}
            alt={doctor.name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition duration-700 ease-soft group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-mist to-sand font-display text-3xl font-medium text-primary/70">
            {initials(doctor.name)}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <p className="mf-kicker">{doctor.specialty?.name || "Dokter"}</p>
          <h3 className="mt-1 font-display text-xl font-medium leading-tight tracking-tight text-primary sm:text-2xl">
            {doctor.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
            {doctor.bio || "Staf medis RS MediFlow."}
          </p>
          {nextSession === undefined ? (
            <p className="mt-2 text-xs text-muted">Memuat jadwal…</p>
          ) : nextSession ? (
            <p className="mt-2 text-xs font-semibold text-moss">
              Berikutnya {formatDateShort(nextSession.date)} ·{" "}
              {sessionLabel(nextSession.session)} · sisa {nextSession.remainingQuota}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">Tidak ada sesi terbuka</p>
          )}
        </div>
        <div className="flex shrink-0 items-end justify-between gap-4 border-t border-hairline pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
          <div className="sm:text-right">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">
              Biaya konsultasi
            </p>
            <p className="tabular mt-0.5 text-base font-semibold text-ink">
              {formatFee(doctor.consultationFee)}
            </p>
          </div>
          <Link
            to={`/daftar-dokter/${doctor.id}`}
            className="inline-flex items-center gap-1.5 rounded-sm px-1 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-bronze transition group-hover:gap-2.5 hover:text-primary"
          >
            Jadwal
            <IconArrow className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
