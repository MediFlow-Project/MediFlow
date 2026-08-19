import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Container from "../components/Container";
import {
  IconArrow,
  IconCalendar,
  IconChat,
  IconClock,
  IconHeart,
  IconStethoscope,
  IconUsers,
} from "../components/Icons";

const doors = [
  {
    to: "/spesialisasi",
    icon: IconHeart,
    kicker: "Layanan",
    title: "Spesialisasi",
    copy: "Kenali poli yang tersedia, dari umum, gigi, hingga anak.",
  },
  {
    to: "/daftar-dokter",
    icon: IconStethoscope,
    kicker: "Tenaga medis",
    title: "Dokter kami",
    copy: "Lihat profil dokter, jadwal praktik, dan biaya konsultasi.",
  },
  {
    to: "/chatbot",
    icon: IconChat,
    kicker: "Pendampingan",
    title: "Konsultasi awal",
    copy: "Ceritakan keluhan Anda. Kami bantu arahkan ke poli yang sesuai.",
  },
];

const steps = [
  {
    n: "01",
    title: "Pilih poli atau dokter",
    copy: "Cari berdasarkan spesialisasi, nama, atau ceritakan keluhan di konsultasi awal.",
  },
  {
    n: "02",
    title: "Kunci sesi pagi atau siang",
    copy: "Kuota harian terbatas. Nomor antrean diberikan setelah janji tersimpan.",
  },
  {
    n: "03",
    title: "Datang sesuai giliran",
    copy: "Pantau papan antrean secara langsung, tanpa harus menunggu di lobi sepanjang waktu.",
  },
];

const stats = [
  { icon: IconUsers, label: "Poliklinik", value: "Terpadu" },
  { icon: IconCalendar, label: "Pendaftaran", value: "Online" },
  { icon: IconClock, label: "Praktik", value: "Senin–Sabtu" },
];

export default function Landing() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div>
      <section className="relative overflow-hidden bg-primary-dark text-white">
        <img
          src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1800&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-primary-dark/88 to-primary-dark/45" />
        <Container className="relative grid min-h-[78svh] items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
              Rumah Sakit MediFlow
            </p>
            <h1 className="mt-5 max-w-xl font-display text-4xl font-medium leading-[1.12] tracking-tight md:text-6xl">
              Melayani dengan hati, merawat dengan teliti.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/78 md:text-lg">
              Pendaftaran poliklinik, konsultasi dokter, dan antrean kunjungan
              dalam satu alur yang ramah, tertib, dan mudah dijangkau.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/daftar-dokter"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary hover:bg-paper"
              >
                Lihat dokter kami
                <IconArrow />
              </Link>
              <Link
                to="/register"
                className="inline-flex rounded-full border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Daftar sebagai pasien
              </Link>
            </div>
          </div>
          <aside className="rounded-[1.75rem] border border-white/15 bg-white/10 p-6 backdrop-blur-md">
            <p className="text-sm font-semibold text-white/70">Jam praktik poliklinik</p>
            <p className="mt-2 font-display text-3xl font-medium">Senin–Sabtu</p>
            <p className="mt-1 text-white/70">Pagi 08.00–12.00 · Siang 13.00–16.00</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-primary-dark/40 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">Pendaftaran</p>
                <p className="mt-2 font-semibold">Buka setiap hari praktik</p>
              </div>
              <div className="rounded-2xl bg-primary-dark/40 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">Konsultasi</p>
                <p className="mt-2 font-semibold">Menurut jadwal dokter</p>
              </div>
            </div>
          </aside>
        </Container>
      </section>

      <section className="border-b border-line bg-paper">
        <Container className="grid gap-6 py-8 sm:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <span className="inline-flex rounded-2xl bg-mist p-3 text-primary">
                <item.icon />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{item.label}</p>
                <p className="font-display text-xl font-medium text-ink">{item.value}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      <Container as="section" className="py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="mf-kicker">Mulai di sini</p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
            Tiga pintu masuk ke layanan kami
          </h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {doors.map((door) => (
            <Link
              key={door.to}
              to={door.to}
              className="group mf-card p-6 transition duration-200 hover:-translate-y-1 hover:border-primary/25"
            >
              <span className="inline-flex rounded-2xl bg-mist p-3 text-primary">
                <door.icon />
              </span>
              <p className="mf-kicker mt-5">{door.kicker}</p>
              <h3 className="mt-2 font-display text-2xl font-medium tracking-tight text-ink group-hover:text-primary">
                {door.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{door.copy}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Buka
                <IconArrow />
              </span>
            </Link>
          ))}
        </div>
      </Container>

      <section className="bg-paper">
        <Container className="grid items-center gap-12 py-16 md:py-20 lg:grid-cols-2">
          <div>
            <p className="mf-kicker">Alur kunjungan</p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
              Dari keluhan sampai nomor antrean, tanpa antre kertas.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Pasien memilih sesi, bukan jam tertentu. Rumah sakit menjaga kuota
              agar pelayanan tetap tertib.
            </p>
          </div>
          <ol className="space-y-5">
            {steps.map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="font-display text-2xl font-medium text-primary">{step.n}</span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {user?.role === "patient" ? (
        <Container className="pb-16">
          <p className="text-sm text-muted">
            Sudah terdaftar sebagai pasien?{" "}
            <Link to="/saya" className="font-semibold text-primary">
              Lihat kunjungan Anda
            </Link>
          </p>
        </Container>
      ) : (
        <section className="border-t border-line bg-primary text-white">
          <Container className="flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-3xl font-medium">Siap membuat janji?</h2>
              <p className="mt-2 max-w-lg text-sm text-white/75">
                Daftar sebagai pasien, pilih dokter, lalu kunci sesi pagi atau siang.
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary hover:bg-paper"
            >
              Daftar sekarang
              <IconArrow />
            </Link>
          </Container>
        </section>
      )}
    </div>
  );
}
