import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { http } from "../api/http";
import { formatFee, getErrorMessage, initials } from "../utils/format";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import { IconArrow } from "../components/Icons";

export default function SpecialtyDetail() {
  const { id } = useParams();
  const [specialty, setSpecialty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    http
      .get(`/specialties/${id}`)
      .then(({ data }) => {
        if (!cancelled) {
          setSpecialty(data);
          setError("");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Loading />;
  if (error || !specialty) {
    return <EmptyState title="Spesialisasi tidak ditemukan" hint={error} />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Poli"
        title={specialty.name}
        description={specialty.description || "Dokter pada spesialisasi ini."}
      />
      {(specialty.doctors || []).length === 0 ? (
        <EmptyState title="Belum ada dokter" hint="Poli ini belum memiliki dokter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {specialty.doctors.map((doctor) => (
            <Link
              key={doctor.id}
              to={`/daftar-dokter/${doctor.id}`}
              className="mf-card flex items-center gap-4 p-5 transition hover:border-primary/25"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-mist font-display text-xl font-medium text-primary">
                {doctor.imgUrl ? (
                  <img src={doctor.imgUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(doctor.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-medium text-ink">{doctor.name}</h2>
                <p className="text-sm text-muted">{formatFee(doctor.consultationFee)}</p>
              </div>
              <IconArrow className="shrink-0 text-primary" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
