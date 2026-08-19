import { Link } from "react-router-dom";
import { formatFee, initials } from "../utils/format";
import { IconArrow } from "./Icons";

export default function DoctorCard({ doctor }) {
  return (
    <article className="mf-card group flex flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-primary/20">
      <div className="relative h-56 overflow-hidden bg-mist">
        {doctor.imgUrl ? (
          <img
            src={doctor.imgUrl}
            alt={doctor.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-5xl font-medium text-primary">
            {initials(doctor.name)}
          </div>
        )}
        <p className="absolute left-4 top-4 rounded-full bg-paper/92 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
          {doctor.specialty?.name || "Dokter"}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-2xl font-medium tracking-tight text-ink">
          {doctor.name}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {doctor.bio || "Dokter praktik di RS MediFlow."}
        </p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="text-sm font-semibold text-primary">
            {formatFee(doctor.consultationFee)}
          </p>
          <Link
            to={`/daftar-dokter/${doctor.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-primary"
          >
            Lihat jadwal
            <IconArrow />
          </Link>
        </div>
      </div>
    </article>
  );
}
