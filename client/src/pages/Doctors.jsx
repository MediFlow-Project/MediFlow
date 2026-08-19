import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/format";
import PageHeader from "../components/PageHeader";
import DoctorCard from "../components/DoctorCard";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";

export default function Doctors() {
  const [params, setParams] = useSearchParams();
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const name = params.get("name") || "";
  const specialtyId = params.get("specialtyId") || "";

  useEffect(() => {
    http.get("/specialties").then(({ data }) => setSpecialties(data));
  }, []);

  useEffect(() => {
    let cancelled = false;
    http
      .get("/doctors", { params: { name: name || undefined, specialtyId: specialtyId || undefined } })
      .then(({ data }) => {
        if (!cancelled) {
          setDoctors(data);
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
  }, [name, specialtyId]);

  return (
    <div>
      <PageHeader
        eyebrow="Direktori"
        title="Dokter RS MediFlow"
        description="Cari nama atau saring berdasarkan poli, lalu pilih sesi pagi atau siang."
      />
      <form
        className="mf-card mb-8 grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setParams({
            name: String(form.get("name") || ""),
            specialtyId: String(form.get("specialtyId") || ""),
          });
        }}
      >
        <label className="sr-only" htmlFor="doctor-name">Nama dokter</label>
        <input
          id="doctor-name"
          name="name"
          defaultValue={name}
          placeholder="Nama dokter"
          className="mf-input mt-0"
        />
        <label className="sr-only" htmlFor="doctor-specialty">Poli</label>
        <select
          id="doctor-specialty"
          name="specialtyId"
          defaultValue={specialtyId}
          className="mf-input mt-0"
        >
          <option value="">Semua poli</option>
          {specialties.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Cari
        </button>
      </form>
      {error ? <p className="mb-4 font-semibold text-danger">{error}</p> : null}
      {loading ? (
        <Loading />
      ) : doctors.length === 0 ? (
        <EmptyState title="Tidak ada dokter" hint="Coba kata kunci atau poli lain." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}
