import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/format";
import PageHeader from "../components/PageHeader";
import DoctorCard from "../components/DoctorCard";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import SpecialtyCard from "../components/SpecialtyCard";
import {
  IconChevron,
  IconFilter,
  IconHeart,
  IconSearch,
  IconStethoscope,
} from "../components/Icons";

const PAGE_SIZE = 12;

export default function Services() {
  const { hash } = useLocation();
  const [params, setParams] = useSearchParams();
  const name = params.get("name") || "";
  const specialtyId = params.get("specialtyId") || "";
  const requestedPage = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialtiesLoading, setSpecialtiesLoading] = useState(true);
  const [specialtiesError, setSpecialtiesError] = useState("");
  const [doctorsError, setDoctorsError] = useState("");
  const doctorsQueryKey = `${name.trim()}|${specialtyId}`;
  const [doctorsLoadedKey, setDoctorsLoadedKey] = useState("");
  const doctorsLoading = doctorsLoadedKey !== doctorsQueryKey;

  useEffect(() => {
    let cancelled = false;
    http
      .get("/specialties")
      .then(({ data }) => {
        if (!cancelled) {
          setSpecialties(Array.isArray(data) ? data : []);
          setSpecialtiesError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setSpecialtiesError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setSpecialtiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [nextById, setNextById] = useState({});

  useEffect(() => {
    let cancelled = false;
    const delay = name.trim() ? 300 : 0;
    const timer = setTimeout(() => {
      const query = {};
      if (name.trim()) query.name = name.trim();
      if (specialtyId) query.specialtyId = specialtyId;
      http
        .get("/doctors", { params: query })
        .then(({ data }) => {
          if (!cancelled) {
            setDoctors(Array.isArray(data) ? data : []);
            setDoctorsError("");
            setDoctorsLoadedKey(doctorsQueryKey);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setDoctorsError(getErrorMessage(err));
            setDoctorsLoadedKey(doctorsQueryKey);
          }
        });
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, specialtyId, doctorsQueryKey]);

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, specialtiesLoading, doctorsLoading]);

  const pageCount = Math.max(1, Math.ceil(doctors.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const paged = doctors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds = paged.map((doctor) => doctor.id).join(",");
  const from = doctors.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, doctors.length);

  useEffect(() => {
    let cancelled = false;
    const ids = pageIds
      ? pageIds.split(",").map((id) => Number(id)).filter(Boolean)
      : [];
    const missing = ids.filter((id) => !(id in nextById));
    if (missing.length === 0) return undefined;

    Promise.all(
      missing.map((id) =>
        http
          .get(`/doctors/${id}`)
          .then(({ data }) => {
            const next =
              (data.upcomingSessions || []).find(
                (session) => session.remainingQuota > 0
              ) || null;
            return [id, next];
          })
          .catch(() => [id, null])
      )
    ).then((entries) => {
      if (cancelled) return;
      setNextById((prev) => {
        const next = { ...prev };
        for (const [id, session] of entries) next[id] = session;
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pageIds, nextById]);

  function writeParams(nextName, nextSpecialty, nextPage) {
    const next = new URLSearchParams();
    // Kept untrimmed so a trailing space stays typeable; the filter trims when matching.
    if (nextName) next.set("name", nextName);
    if (nextSpecialty) next.set("specialtyId", nextSpecialty);
    if (nextPage > 1) next.set("page", String(nextPage));
    setParams(next, { replace: true });
  }

  function commitParams(nextName, nextSpecialty) {
    writeParams(nextName, nextSpecialty, 1);
  }

  function goToPage(nextPage) {
    const clamped = Math.min(Math.max(1, nextPage), pageCount);
    writeParams(name, specialtyId, clamped);
    document.getElementById("dokter")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Layanan"
        title="Poliklinik dan direktori dokter"
        description="Pilih poli untuk melihat jadwal praktik, sesi pagi dan siang, beserta dokter jaga. Atau cari nama dokter dan saring berdasarkan poli."
      />

      <section id="poliklinik" className="scroll-mt-36">
        <p className="mf-kicker">Poliklinik</p>
        <h2 className="mf-display mt-2.5 text-3xl text-ink">
          Layanan spesialisasi
        </h2>
        <div className="mf-rule" />

        {specialtiesLoading ? (
          <div className="mt-7">
            <Loading variant="rows" label="Memuat poliklinik..." />
          </div>
        ) : (
          <div className="mt-7">
            {specialtiesError ? (
              <Alert className="mb-6">{specialtiesError}</Alert>
            ) : null}
            {specialties.length === 0 ? (
              <EmptyState
                icon={IconHeart}
                title="Belum ada spesialisasi"
                hint="Admin belum menambahkan poli."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {specialties.map((item) => (
                  <SpecialtyCard key={item.id} specialty={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section id="dokter" className="mt-14 scroll-mt-36 md:mt-16">
        <p className="mf-kicker">Staf medis</p>
        <h2 className="mf-display mt-2.5 text-3xl text-ink">
          Direktori dokter
        </h2>
        <div className="mf-rule" />
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
          Cari nama atau saring berdasarkan poli, lalu pilih sesi kunjungan pagi
          atau siang.
        </p>

        <form
          className="mf-card mf-rise mt-7 mb-8 grid gap-3 p-4 sm:grid-cols-[1fr_15rem] sm:p-5"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="relative">
            <label className="sr-only" htmlFor="doctor-name">
              Nama dokter
            </label>
            <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="doctor-name"
              name="name"
              value={name}
              onChange={(event) => commitParams(event.target.value, specialtyId)}
              placeholder="Cari nama dokter"
              className="mf-input mt-0 pl-10"
            />
          </div>
          <div className="relative">
            <label className="sr-only" htmlFor="doctor-specialty">
              Poli
            </label>
            <IconFilter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <select
              id="doctor-specialty"
              name="specialtyId"
              value={specialtyId}
              onChange={(event) => commitParams(name, event.target.value)}
              className="mf-input mt-0 appearance-none pl-10"
            >
              <option value="">Semua poli</option>
              {specialties.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </form>

        {doctorsError ? <Alert className="mb-6">{doctorsError}</Alert> : null}

        {doctorsLoading ? (
          <Loading variant="rows" label="Memuat direktori dokter..." />
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={IconStethoscope}
            title="Tidak ada dokter"
            hint="Coba kata kunci atau poli lain."
          />
        ) : (
          <>
            <p className="mb-5 text-sm text-muted">
              Menampilkan {from}–{to} dari {doctors.length} dokter
            </p>
            <div className="grid gap-3">
              {paged.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  nextSession={doctor.id in nextById ? nextById[doctor.id] : undefined}
                />
              ))}
            </div>
            {pageCount > 1 ? (
              <nav
                className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
                aria-label="Halaman direktori dokter"
              >
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-primary transition duration-200 ease-soft hover:border-primary hover:bg-mist disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <IconChevron className="h-3.5 w-3.5 rotate-180" />
                  Sebelumnya
                </button>
                {Array.from({ length: pageCount }, (_, index) => {
                  const n = index + 1;
                  const current = n === page;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goToPage(n)}
                      aria-current={current ? "page" : undefined}
                      className={`min-w-9 rounded-full px-3 py-2 text-sm font-semibold tabular transition duration-200 ease-soft ${
                        current
                          ? "bg-primary text-white"
                          : "border border-line bg-white text-primary hover:border-primary hover:bg-mist"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= pageCount}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-primary transition duration-200 ease-soft hover:border-primary hover:bg-mist disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Berikutnya
                  <IconChevron className="h-3.5 w-3.5" />
                </button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
