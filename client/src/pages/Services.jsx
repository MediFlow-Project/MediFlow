import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/format";
import PageHeader from "../components/PageHeader";
import DoctorCard from "../components/DoctorCard";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import {
  IconArrow,
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
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [specialtiesError, setSpecialtiesError] = useState("");
  const [doctorsError, setDoctorsError] = useState("");

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
            setDoctorsLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setDoctorsError(getErrorMessage(err));
            setDoctorsLoading(false);
          }
        });
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, specialtyId]);

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
        <h2 className="mt-2.5 font-display text-3xl font-medium text-primary">
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
              <div className="grid gap-3">
                {specialties.map((item, index) => (
                  <Link
                    key={item.id}
                    to={`/spesialisasi/${item.id}`}
                    className="mf-card mf-card-interactive mf-rise group flex overflow-hidden"
                    style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-mist sm:h-32 sm:w-40">
                      {item.imgUrl ? (
                        <img
                          src={item.imgUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-700 ease-soft group-hover:scale-[1.05]"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-mist to-sand text-primary/60">
                          <IconHeart className="h-8 w-8" />
                        </span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3 sm:px-5">
                      <div className="min-w-0">
                        <h3 className="font-display text-xl font-medium leading-tight tracking-tight text-primary sm:text-2xl">
                          {item.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                          {item.description || "Poli praktik RS MediFlow."}
                        </p>
                        <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-bronze">
                          {item.doctorCount} dokter
                        </p>
                      </div>
                      <IconArrow className="h-4 w-4 shrink-0 text-bronze transition-transform duration-300 ease-soft group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section id="dokter" className="mt-14 scroll-mt-36 md:mt-16">
        <p className="mf-kicker">Staf medis</p>
        <h2 className="mt-2.5 font-display text-3xl font-medium text-primary">
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
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
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
                  className="inline-flex items-center gap-1 rounded-sm border border-line bg-white px-3 py-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-primary shadow-xs transition duration-200 ease-soft hover:border-gold/60 hover:text-bronze disabled:cursor-not-allowed disabled:opacity-45"
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
                      className={`min-w-9 rounded-sm px-3 py-2 text-[0.66rem] font-bold tabular tracking-[0.08em] transition duration-200 ease-soft ${
                        current
                          ? "bg-primary text-white shadow-sm"
                          : "border border-line bg-white text-primary shadow-xs hover:border-gold/60 hover:text-bronze"
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
                  className="inline-flex items-center gap-1 rounded-sm border border-line bg-white px-3 py-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-primary shadow-xs transition duration-200 ease-soft hover:border-gold/60 hover:text-bronze disabled:cursor-not-allowed disabled:opacity-45"
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
