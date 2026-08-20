import { Link } from "react-router-dom";
import { formatDateShort, formatFee, sessionLabel } from "../utils/format";
import Avatar from "./Avatar";
import { IconArrow } from "./Icons";

export default function DoctorCard({ doctor, nextSession }) {
  return (
    <article className="mf-card mf-card-interactive group grid gap-4 px-4 py-4 sm:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:px-5">
      <Avatar src={doctor.imgUrl} name={doctor.name} size="md" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-accent-ink">
          {doctor.specialty?.name || "Dokter"}
        </p>
        <h3 className="mt-0.5 truncate font-display text-xl font-semibold text-ink">
          {doctor.name}
        </h3>
        {nextSession === undefined ? (
          <p className="mt-2 text-xs text-muted">Memuat jadwal…</p>
        ) : nextSession ? (
          <p className="tabular mt-2 text-xs font-semibold text-moss">
            Berikutnya {formatDateShort(nextSession.date)} ·{" "}
            {sessionLabel(nextSession.session)} · sisa {nextSession.remainingQuota}
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted">Tidak ada sesi terbuka</p>
        )}
      </div>
      <div className="sm:text-right">
        <p className="text-xs font-medium text-muted">Biaya konsultasi</p>
        <p className="tabular mt-0.5 text-base font-semibold text-ink">
          {formatFee(doctor.consultationFee)}
        </p>
      </div>
      <Link
        to={`/daftar-dokter/${doctor.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink transition hover:text-primary"
      >
        Jadwal
        <IconArrow className="h-4 w-4" />
      </Link>
    </article>
  );
}
