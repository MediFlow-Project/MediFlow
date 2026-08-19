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
        description="Pilih poli untuk melihat dokter yang tersedia di RS MediFlow."
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
              className="group mf-card p-6 transition hover:-translate-y-0.5 hover:border-primary/25"
            >
              <span className="inline-flex rounded-2xl bg-mist p-3 text-primary">
                <IconHeart />
              </span>
              <h2 className="mt-5 font-display text-2xl font-medium tracking-tight text-ink">
                {item.name}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                {item.description || "Poli praktik RS MediFlow."}
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                {item.doctorCount} dokter
                <IconArrow className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
