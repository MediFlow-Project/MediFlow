import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Container from "../components/Container";
import { HOSPITAL } from "../data/hospital";
import { homeForRole } from "../utils/format";
import {
  IconArrow,
  IconClock,
  IconHeart,
  IconPhone,
  IconShield,
  IconStethoscope,
} from "../components/Icons";

const centers = [
  {
    to: "/layanan#poliklinik",
    icon: IconHeart,
    kicker: "Poliklinik",
    title: "Pusat spesialisasi",
    copy: "Dua puluh poli terpadu dengan jadwal sesi pagi dan siang yang tertib.",
  },
  {
    to: "/layanan#dokter",
    icon: IconStethoscope,
    kicker: "Staf medis",
    title: "Direktori dokter",
    copy: "Profil, jadwal praktik, dan biaya konsultasi dokter spesialis kami.",
  },
];

const visitSteps = [
  {
    n: "01",
    title: "Pilih poli atau dokter",
    copy: "Gunakan direktori poliklinik atau pilih dokter dari jadwal yang tersedia.",
  },
  {
    n: "02",
    title: "Kunci sesi kunjungan",
    copy: "Pilih pagi atau siang sesuai kuota. Nomor antrean terbit setelah janji tersimpan.",
  },
  {
    n: "03",
    title: "Datang sesuai giliran",
    copy: "Pantau papan antrean dari gawai. Tidak perlu menunggu di lobi sepanjang waktu.",
  },
];

const stats = [
  { label: "Berdiri", value: HOSPITAL.established, hint: "Melayani Jakarta Selatan" },
  { label: "Poliklinik", value: "20", hint: "Layanan spesialis terpadu" },
  { label: "Mutu", value: "KARS", hint: "Akreditasi Paripurna" },
];

const visitInfo = [
  { icon: IconClock, term: "Jam poliklinik", value: HOSPITAL.hoursPoli },
  { icon: IconHeart, term: "Jam besuk", value: HOSPITAL.hoursVisit },
  { icon: IconPhone, term: "IGD", value: `24 jam · ${HOSPITAL.igd}` },
];

export default function Landing() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-primary-dark text-white">
        <img
          src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=2000&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/88 to-primary-dark/20" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_120%,rgb(7_22_40/0.85),transparent_65%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary-dark/70 to-transparent" />

        <Container className="relative flex min-h-[86svh] flex-col justify-end gap-12 py-16 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:py-24">
          <div className="mf-rise max-w-xl">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.2em] text-gold backdrop-blur-sm">
              <IconShield className="h-3.5 w-3.5 shrink-0" />
              <span>
                {HOSPITAL.tagline}
                <span className="hidden sm:inline"> · Sejak {HOSPITAL.established}</span>
              </span>
            </p>
            <h1 className="mt-7 font-display text-[2.75rem] font-medium leading-[1.06] tracking-tight sm:text-6xl md:text-7xl">
              Perawatan yang tenang, tertib, dan{" "}
              <span className="text-gold">terpercaya</span>.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
              Pendaftaran poliklinik, konsultasi dokter spesialis, dan giliran
              kunjungan dalam satu alur rumah sakit.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/layanan"
                className="inline-flex items-center gap-2.5 rounded-sm bg-gold px-6 py-3.5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-primary-dark shadow-gold transition duration-200 ease-soft hover:-translate-y-0.5 hover:bg-white"
              >
                Lihat layanan
                <IconArrow className="h-4 w-4" />
              </Link>
              {user ? (
                <Link
                  to={homeForRole(user.role)}
                  className="inline-flex items-center rounded-sm border border-white/25 bg-white/5 px-6 py-3.5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition duration-200 ease-soft hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                >
                  Buka dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-sm border border-white/25 bg-white/5 px-6 py-3.5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition duration-200 ease-soft hover:-translate-y-0.5 hover:border-gold hover:text-gold"
                >
                  Masuk ke portal
                </Link>
              )}
            </div>
          </div>

          <aside
            className="mf-rise w-full max-w-sm rounded-lg border border-white/15 bg-primary-dark/65 p-7 shadow-2xl ring-1 ring-inset ring-white/10 backdrop-blur-md lg:mb-4"
            style={{ animationDelay: "140ms" }}
          >
            <p className="mf-kicker-light">Informasi kunjungan</p>
            <div className="mf-hairline mt-4" />
            <dl className="mt-5 space-y-5 text-sm">
              {visitInfo.map((row) => (
                <div key={row.term} className="flex gap-3.5">
                  <span
                    className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold ring-1 ring-white/10"
                    aria-hidden="true"
                  >
                    <row.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/50">
                      {row.term}
                    </dt>
                    <dd className="mt-1 font-medium leading-relaxed">{row.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </aside>
        </Container>
      </section>

      <section className="mf-surface-navy relative text-white shadow-lg">
        <div className="mf-hairline" />
        <Container className="grid divide-y divide-white/10 py-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="px-0 py-6 sm:px-8 sm:first:pl-0 sm:last:pr-0">
              <p className="mf-kicker-light">{stat.label}</p>
              <p className="mt-2 font-display text-4xl font-medium leading-none">
                {stat.value}
              </p>
              <p className="mt-2 text-xs text-white/55">{stat.hint}</p>
            </div>
          ))}
        </Container>
      </section>

      <Container as="section" className="py-16 md:py-24">
        <p className="mf-kicker">Layanan unggulan</p>
        <h2 className="mt-3 max-w-xl font-display text-4xl font-medium tracking-tight text-primary md:text-5xl">
          Dua pintu masuk ke perawatan Anda.
        </h2>
        <div className="mf-rule" />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {centers.map((item, index) => (
            <Link
              key={item.to}
              to={item.to}
              className="mf-card mf-card-interactive mf-rise group flex flex-col p-7"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <span className="inline-flex w-fit items-center justify-center rounded-full bg-gold-soft p-3.5 text-bronze ring-1 ring-gold/25 transition duration-300 ease-soft group-hover:bg-primary group-hover:text-gold group-hover:ring-primary/30">
                <item.icon />
              </span>
              <p className="mf-kicker mt-6">{item.kicker}</p>
              <h3 className="mt-2 font-display text-2xl font-medium text-primary">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.copy}</p>
              <span className="mt-7 inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-bronze transition-all duration-300 ease-soft group-hover:gap-3">
                Buka
                <IconArrow className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </Container>

      <section className="mf-surface-navy text-white">
        <Container className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <div
              className="absolute -bottom-4 -left-4 hidden h-full w-full rounded-lg border border-gold/40 sm:block"
              aria-hidden="true"
            />
            <div className="relative aspect-4/3 overflow-hidden rounded-lg shadow-2xl ring-1 ring-white/10">
              <img
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80"
                alt="Lobi RS MediFlow"
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/45 to-transparent" />
            </div>
          </div>
          <div>
            <p className="mf-kicker-light">Alur kunjungan</p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight md:text-5xl">
              Dari pendaftaran hingga ruang periksa, tanpa antre kertas.
            </h2>
            <ol className="mt-10 space-y-2">
              {visitSteps.map((step, index) => (
                <li
                  key={step.n}
                  className="mf-rise flex gap-5 rounded-md p-4 transition duration-300 ease-soft hover:bg-white/5"
                  style={{ animationDelay: `${index * 110}ms` }}
                >
                  <span
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-white/5 font-display text-lg font-medium text-gold"
                    aria-hidden="true"
                  >
                    {step.n}
                  </span>
                  <div className="min-w-0 pt-1">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                      {step.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      {user?.role === "patient" ? (
        <Container className="py-14">
          <div className="mf-card mf-card-interactive group flex flex-col items-start justify-between gap-5 p-7 sm:flex-row sm:items-center">
            <div>
              <p className="mf-kicker">Selamat datang kembali</p>
              <p className="mt-2 font-display text-2xl font-medium text-primary">
                {user.name}
              </p>
            </div>
            <Link
              to="/saya"
              className="mf-ghost-link group-hover:border-gold/60 group-hover:text-bronze"
            >
              Buka dashboard
              <IconArrow className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      ) : (
        <section className="mf-surface-gold border-t border-gold/25">
          <Container className="flex flex-col items-start justify-between gap-7 py-14 md:flex-row md:items-center md:py-16">
            <div>
              <p className="mf-kicker">Mulai sekarang</p>
              <h2 className="mt-2.5 font-display text-4xl font-medium text-primary">
                Siap berkunjung?
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
                Daftar sebagai pasien, pilih dokter, lalu kunci sesi pagi atau siang.
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex shrink-0 items-center gap-2.5 rounded-sm bg-primary px-7 py-3.5 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white shadow-lg transition duration-200 ease-soft hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl"
            >
              Daftar pasien
              <IconArrow className="h-4 w-4" />
            </Link>
          </Container>
        </section>
      )}
    </div>
  );
}
