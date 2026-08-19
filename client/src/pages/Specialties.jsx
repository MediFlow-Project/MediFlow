import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/format";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import { IconArrow, IconHeart } from "../components/Icons";

export default function Specialties() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    http
      .get("/specialties")
      .then(({ data }) => setItems(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        eyebrow="Poli"
        title="Spesialisasi"
        description="Pilih poli untuk melihat tanggal praktik, sesi pagi dan siang, beserta dokternya."
      />
      {error ? <p className="mb-4 font-semibold text-danger">{error}</p> : null}
      {items.length === 0 ? (
        <EmptyState
          title="Belum ada spesialisasi"
          hint="Admin belum menambahkan poli."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={`/spesialisasi/${item.id}`}
              className="group mf-card overflow-hidden transition hover:-translate-y-0.5 hover:border-primary/25"
            >
              <div className="relative h-40 overflow-hidden bg-mist">
                {item.imgUrl ? (
                  <img
                    src={item.imgUrl}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-primary">
                    <IconHeart />
                  </span>
                )}
              </div>
              <div className="p-6">
                <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
                  {item.name}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                  {item.description || "Poli praktik RS MediFlow."}
                </p>
                <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {item.doctorCount} dokter
                  <IconArrow className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
