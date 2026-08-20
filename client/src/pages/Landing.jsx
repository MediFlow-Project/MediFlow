import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import Container from "../components/Container";
import SpecialtyCard from "../components/SpecialtyCard";
import { HOSPITAL } from "../data/hospital";
import {
  IconArrow,
  IconCalendar,
  IconCheck,
  IconClock,
  IconHeart,
  IconPhone,
  IconStethoscope,
  IconUsers,
} from "../components/Icons";

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1800&q=80";

const MOSAIC = [
  {
    src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80",
    alt: "Perawatan pasien di RS MediFlow",
    className: "row-span-2 min-h-[16rem] sm:min-h-[22rem]",
  },
  {
    src: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=800&q=80",
    alt: "Ruang perawatan",
    className: "min-h-[8rem] sm:min-h-[10.5rem]",
  },
  {
    src: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
    alt: "Fasilitas diagnostik",
    className: "min-h-[8rem] sm:min-h-[10.5rem]",
  },
];

const FEATURES = [
  {
    icon: IconCalendar,
    title: "Pendaftaran mudah",
    copy: "Kunci sesi pagi atau siang dalam beberapa langkah.",
  },
  {
    icon: IconClock,
    title: "Antrean real-time",
    copy: "Pantau nomor kunjungan langsung dari portal pasien.",
  },
  {
    icon: IconStethoscope,
    title: "Dokter spesialis",
    copy: "Seratus dokter di dua puluh poliklinik terpadu.",
  },
  {
    icon: IconHeart,
    title: "Perawatan modern",
    copy: "Fasilitas lengkap dengan IGD yang siaga 24 jam.",
  },
];

const REASONS = [
  HOSPITAL.accreditation,
  "Fasilitas dan ruang perawatan modern",
  "Alur kunjungan yang berpusat pada pasien",
  `IGD 24 jam ${HOSPITAL.igd}`,
];

const STATS = [
  { value: "20", label: "Poliklinik" },
  { value: "100", label: "Dokter spesialis" },
  { value: HOSPITAL.established, label: "Berdiri sejak" },
  { value: "24/7", label: "IGD" },
];

export default function Landing() {
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    http
      .get("/specialties")
      .then(({ data }) => {
        if (!cancelled) setSpecialties(Array.isArray(data) ? data.slice(0, 6) : []);
      })
      .catch(() => {
        if (!cancelled) setSpecialties([]);
      });
    http
      .get("/doctors")
      .then(({ data }) => {
        if (!cancelled) setDoctors(Array.isArray(data) ? data.slice(0, 4) : []);
      })
      .catch(() => {
        if (!cancelled) setDoctors([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <section className="relative pb-8 pt-4 md:pb-10 md:pt-6">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] shadow-lg">
            <img
              src={HERO_PHOTO}
              alt="Gedung RS MediFlow"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-white/35" />
            <div className="relative grid gap-8 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,20rem)] lg:items-center lg:gap-10 lg:py-20">
              <div className="mf-rise max-w-xl">
                <p className="inline-flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-[0.78rem] font-semibold text-primary">
                  {HOSPITAL.accreditation}
                </p>
                <h1 className="mf-display mt-5 text-[2.15rem] text-ink sm:text-5xl lg:text-[3.15rem]">
                  Kesehatan Anda, komitmen kami.
                </h1>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Poliklinik terpadu, dokter spesialis, dan pendaftaran kunjungan
                  yang tertib di {HOSPITAL.legalName}.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to="/layanan"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[0.92rem] font-semibold text-white transition hover:bg-primary-hover"
                  >
                    Buat kunjungan
                    <IconArrow className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/layanan#poliklinik"
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-6 py-3 text-[0.92rem] font-semibold text-ink transition hover:border-primary hover:bg-white"
                  >
                    Lihat layanan
                    <IconArrow className="h-4 w-4" />
                  </Link>
                </div>
                <a
                  href={`tel:${HOSPITAL.igd.replace(/\s/g, "")}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ink"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-mist text-primary">
                    <IconPhone className="h-4 w-4" />
                  </span>
                  IGD 24 jam {HOSPITAL.igd}
                </a>
              </div>

              <aside className="mf-card mf-rise p-5 shadow-md sm:p-6" style={{ animationDelay: "80ms" }}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">Pembaruan antrean</p>
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-moss">
                    <span className="live-dot !bg-moss" aria-hidden="true" />
                    Live
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Nomor kunjungan tampil di portal setelah sesi pagi atau siang
                  terkunci. Bukan papan publik.
                </p>
                <Link
                  to="/layanan"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  Lihat cara daftar
                  <IconArrow className="h-4 w-4" />
                </Link>
              </aside>
            </div>
          </div>
        </Container>
      </section>

      <Container className="relative z-[1] -mt-2 md:-mt-4">
        <div className="mf-card grid gap-6 px-5 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-4 lg:px-4 lg:py-5">
          {FEATURES.map((item) => (
            <article key={item.title} className="flex gap-3 px-2 py-1">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mist text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>

      <Container as="section" className="py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="mf-kicker">Mengapa memilih kami</p>
            <h2 className="mf-display mt-3 text-3xl text-ink sm:text-4xl">
              Perawatan yang menempatkan Anda di depan.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {HOSPITAL.legalName} di {HOSPITAL.city} melayani kunjungan poliklinik
              dengan jadwal yang jelas, tenaga spesialis, dan IGD sepanjang hari.
            </p>
            <ul className="mt-7 space-y-3">
              {REASONS.map((reason) => (
                <li key={reason} className="flex items-start gap-3 text-sm text-ink">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mist text-primary">
                    <IconCheck className="h-3 w-3" />
                  </span>
                  {reason}
                </li>
              ))}
            </ul>
            <Link
              to="/layanan"
              className="mf-ghost-link mt-8"
            >
              Pelajari layanan kami
              <IconArrow className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
            {MOSAIC.map((item) => (
              <div
                key={item.src}
                className={`overflow-hidden rounded-2xl ${item.className}`}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </Container>

      <section className="px-4 pb-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-white sm:px-10 md:py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <p className="tabular font-display text-3xl font-semibold sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Container as="section" className="py-16 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mf-kicker">Staf medis</p>
            <h2 className="mf-display mt-3 text-3xl text-ink sm:text-4xl">
              Temui dokter spesialis kami.
            </h2>
          </div>
          <Link to="/layanan#dokter" className="mf-ghost-link">
            Lihat semua dokter
            <IconArrow className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {doctors.map((doctor) => (
            <article
              key={doctor.id}
              className="mf-card w-[15.5rem] shrink-0 overflow-hidden lg:w-auto"
            >
              <div className="aspect-[4/5] bg-mist">
                {doctor.imgUrl ? (
                  <img
                    src={doctor.imgUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-primary">
                    <IconUsers className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{doctor.name}</p>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {doctor.specialty?.name || "Dokter"}
                  </p>
                </div>
                <Link
                  to={`/daftar-dokter/${doctor.id}`}
                  aria-label={`Jadwal ${doctor.name}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mist text-primary transition hover:bg-primary hover:text-white"
                >
                  <IconArrow className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Container>

      <Container as="section" className="pb-16 md:pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mf-kicker">Poliklinik</p>
            <h2 className="mf-display mt-3 text-3xl text-ink sm:text-4xl">
              Dua puluh pintu masuk ke perawatan.
            </h2>
          </div>
          <Link to="/layanan#poliklinik" className="mf-ghost-link">
            Lihat semua
            <IconArrow className="h-4 w-4" />
          </Link>
        </div>
        {specialties.length === 0 ? (
          <p className="mt-8 text-sm text-muted">Memuat poliklinik…</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {specialties.map((item) => (
              <SpecialtyCard key={item.id} specialty={item} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
