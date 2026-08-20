import { useEffect, useState } from "react";
import { http } from "../api/http";
import { formatDateId, getErrorMessage, todayDateOnly } from "../utils/format";
import { HOSPITAL } from "../data/hospital";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import Skeleton from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import {
  IconArrow,
  IconCalendar,
  IconPill,
  IconReceipt,
  IconStethoscope,
  IconUsers,
} from "../components/Icons";
import { Link } from "react-router-dom";

const shortcuts = [
  {
    to: "/admin/janji",
    icon: IconCalendar,
    label: "Janji temu",
    copy: "Pantau pendaftaran seluruh dokter.",
  },
  {
    to: "/admin/tagihan",
    icon: IconReceipt,
    label: "Pembayaran",
    copy: "Status tagihan pasien.",
  },
  {
    to: "/admin/dokter",
    icon: IconStethoscope,
    label: "Direktori dokter",
    copy: "Akun staf medis dan biaya konsultasi.",
  },
  {
    to: "/admin/obat",
    icon: IconPill,
    label: "Katalog obat",
    copy: "Daftar obat untuk resep konsultasi.",
  },
];

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    http
      .get("/admin/dashboard")
      .then(({ data }) => {
        if (!cancelled) setCounts(data);
      })
      .catch((err) => {
        if (!cancelled) {
          showToast({ type: "error", message: getErrorMessage(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  return (
    <div>
      <PageHeader
        eyebrow="Direktorat medis"
        title="Ringkasan operasional"
        description="Hitungan pendaftaran dan antrean aktif hari ini. Bukan laporan keuangan."
      />

      {!counts ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="mf-card space-y-4 p-6 sm:p-7">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            tone="navy"
            label="Booking hari ini"
            value={counts.bookingsToday}
            hint={`Pendaftaran kunjungan poliklinik · ${formatDateId(
              todayDateOnly()
            )}`}
            icon={IconCalendar}
          />
          <StatCard
            tone="gold"
            label="Antrean aktif"
            value={counts.activeQueues}
            hint="Menunggu, dipanggil, dan sedang konsultasi"
            icon={IconUsers}
          />
          <StatCard
            tone="paper"
            label="Jam poliklinik"
            value="08–17"
            hint={`${HOSPITAL.hoursPoli}. ${HOSPITAL.closed}.`}
            icon={IconStethoscope}
          />
        </div>
      )}

      <section className="mt-12">
        <p className="mf-kicker">Akses cepat</p>
        <h2 className="mt-2.5 font-display text-3xl font-medium text-primary">
          Kelola master data
        </h2>
        <div className="mf-rule" />
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {shortcuts.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="mf-card mf-card-interactive group flex items-center gap-4 p-5"
            >
              <span
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-gold-soft p-3 text-bronze ring-1 ring-gold/25 transition duration-300 ease-soft group-hover:bg-primary group-hover:text-gold"
                aria-hidden="true"
              >
                <item.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-medium text-primary">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm text-muted">{item.copy}</p>
              </div>
              <IconArrow className="h-4 w-4 shrink-0 text-bronze transition-transform duration-300 ease-soft group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
