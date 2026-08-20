import { Link } from "react-router-dom";

export default function SpecialtyCard({ specialty, featured = false }) {
  return (
    <Link
      to={`/spesialisasi/${specialty.id}`}
      className={`mf-card mf-card-interactive group relative overflow-hidden ${
        featured ? "sm:col-span-2 lg:col-span-2" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden bg-mist ${
          featured ? "aspect-[16/9] sm:aspect-[2/1] lg:aspect-[5/3]" : "aspect-[4/3]"
        }`}
      >
        {specialty.imgUrl ? (
          <img
            src={specialty.imgUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 ease-soft group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-mist" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className="font-display text-lg font-semibold text-white sm:text-xl">
            {specialty.name}
          </p>
          <p className="mt-1 text-sm text-white/80">
            {specialty.doctorCount} dokter
          </p>
        </div>
      </div>
    </Link>
  );
}
