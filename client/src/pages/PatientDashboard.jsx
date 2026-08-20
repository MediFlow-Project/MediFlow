import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { cancelAppointment, fetchAppointments } from "../store/appointmentsSlice";
import { fetchInbox } from "../store/chatSlice";
import { useToast } from "../context/ToastContext";
import {
  canCancel,
  canPayInvoice,
  formatDateId,
  sessionLabel,
} from "../utils/format";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import Avatar from "../components/Avatar";
import StatCard from "../components/StatCard";
import {
  IconArrow,
  IconCalendar,
  IconChat,
  IconReceipt,
} from "../components/Icons";

const LIVE_STATUSES = ["booked", "waiting", "called", "in_consultation"];
const SESSION_RANK = { morning: 0, afternoon: 1 };

const shortcuts = [
  {
    to: "/layanan",
    icon: IconCalendar,
    label: "Buat kunjungan",
    copy: "Pilih poli, dokter, atau konsultasi awal.",
  },
  {
    to: "/tagihan",
    icon: IconReceipt,
    label: "Tagihan",
    copy: "Cek dan lunasi pembayaran kunjungan.",
  },
  {
    to: "/pesan",
    icon: IconChat,
    label: "Pesan",
    copy: "Chat dokter setelah konsultasi, tanpa batas waktu.",
  },
];

function nextLiveVisit(items) {
  return (
    items
      .filter((item) => LIVE_STATUSES.includes(item.status))
      .slice()
      .sort((a, b) => {
        const byDate = String(a.date).localeCompare(String(b.date));
        if (byDate !== 0) return byDate;
        return (SESSION_RANK[a.session] ?? 9) - (SESSION_RANK[b.session] ?? 9);
      })[0] || null
  );
}

export default function PatientDashboard() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { items, status } = useSelector((state) => state.appointments);
  const inbox = useSelector((state) => state.chat.inbox);
  const firstName = user?.name?.trim().split(/\s+/)[0] || "pasien";

  useEffect(() => {
    dispatch(fetchAppointments());
    dispatch(fetchInbox());
  }, [dispatch]);

  const liveCount = useMemo(
    () => items.filter((item) => LIVE_STATUSES.includes(item.status)).length,
    [items]
  );
  const unreadCount = useMemo(
    () => inbox.reduce((sum, thread) => sum + (Number(thread.unreadCount) || 0), 0),
    [inbox]
  );
  const unpaidCount = useMemo(
    () =>
      items.filter((item) => item.invoice && canPayInvoice(item.invoice.status))
        .length,
    [items]
  );
  const upcoming = useMemo(() => nextLiveVisit(items), [items]);

  async function handleCancel(id) {
    const result = await dispatch(cancelAppointment(id));
    if (cancelAppointment.fulfilled.match(result)) {
      showToast({ type: "success", message: "Kunjungan dibatalkan." });
    } else {
      showToast({ type: "error", message: result.payload });
    }
  }

  if (status === "loading" && items.length === 0) {
    return <Loading variant="rows" label="Memuat dashboard..." />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={`Selamat datang, ${firstName}`}
        description="Pantau kunjungan aktif, pesan dokter, dan tagihan dari satu halaman."
      >
        <LinkButton to="/layanan" variant="ghost">
          Buat kunjungan
        </LinkButton>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          tone="navy"
          label="Kunjungan aktif"
          value={liveCount}
          hint="Terjadwal hingga ruang periksa"
          icon={IconCalendar}
        />
        <Link to="/pesan" className="block rounded-md">
          <StatCard
            tone="gold"
            label="Pesan belum dibaca"
            value={unreadCount}
            hint="Chat setelah konsultasi"
            icon={IconChat}
          />
        </Link>
        <Link to="/tagihan" className="block rounded-md">
          <StatCard
            tone="paper"
            label="Tagihan belum lunas"
            value={unpaidCount}
            hint="Menunggu pelunasan"
            icon={IconReceipt}
          />
        </Link>
      </div>

      {upcoming ? (
        <article className="mf-card mf-rise mt-8 overflow-hidden p-5 sm:p-6">
          <p className="mf-kicker">Kunjungan berikutnya</p>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Avatar
                src={upcoming.doctor?.imgUrl}
                name={upcoming.doctor?.name}
                size="lg"
                className="hidden sm:inline-flex"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-bronze">
                  {upcoming.doctor?.specialty?.name}
                </p>
                <h2 className="mt-1 font-display text-2xl font-medium leading-tight tracking-tight text-primary">
                  {upcoming.doctor?.name}
                </h2>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                  <span>{formatDateId(upcoming.date)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Sesi {sessionLabel(upcoming.session)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular font-semibold text-ink">
                    Nomor {String(upcoming.queueNumber).padStart(2, "0")}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StatusBadge status={upcoming.status} />
              <LinkButton to={`/saya/antrean/${upcoming.id}`} size="sm">
                Papan antrean
              </LinkButton>
            </div>
          </div>
        </article>
      ) : null}

      <section className="mt-10">
        <p className="mf-kicker">Akses cepat</p>
        <div className="mf-rule" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
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

      <section className="mt-12">
        <p className="mf-kicker">Rekam kunjungan</p>
        <h2 className="mt-2.5 font-display text-3xl font-medium text-primary">
          Semua janji temu
        </h2>
        <div className="mf-rule mb-7" />

        {items.length === 0 ? (
          <EmptyState
            icon={IconCalendar}
            title="Belum ada kunjungan"
            hint="Pilih poli atau dokter, lalu kunci sesi pagi atau siang."
          >
            <LinkButton to="/layanan" size="lg">
              Lihat layanan
            </LinkButton>
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => {
              const unread =
                inbox.find(
                  (thread) => Number(thread.appointmentId) === Number(item.id)
                )?.unreadCount || 0;
              const isLive = LIVE_STATUSES.includes(item.status);

              return (
                <article
                  key={item.id}
                  className="mf-card mf-rise relative overflow-hidden p-5 pl-6 sm:p-6 sm:pl-7"
                  style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-1.5 ${
                      isLive ? "bg-gold" : "bg-line"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <Avatar
                        src={item.doctor?.imgUrl}
                        name={item.doctor?.name}
                        size="lg"
                        className="hidden sm:inline-flex"
                      />
                      <div className="min-w-0">
                        <p className="mf-kicker">{item.doctor?.specialty?.name}</p>
                        <h3 className="mt-1.5 font-display text-2xl font-medium leading-tight tracking-tight text-primary">
                          {item.doctor?.name}
                        </h3>
                        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                          <span>{formatDateId(item.date)}</span>
                          <span aria-hidden="true">·</span>
                          <span>Sesi {sessionLabel(item.session)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular font-semibold text-ink">
                            Nomor {String(item.queueNumber).padStart(2, "0")}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} />
                      {isLive ? (
                        <LinkButton to={`/saya/antrean/${item.id}`} size="sm">
                          Papan antrean
                        </LinkButton>
                      ) : null}
                      {item.status === "completed" ? (
                        <LinkButton
                          to={`/pesan/${item.id}`}
                          variant="ghost"
                          size="sm"
                        >
                          Pesan{unread ? ` (${unread})` : ""}
                        </LinkButton>
                      ) : null}
                      {item.status === "completed" ? (
                        <LinkButton
                          to={item.invoice?.id ? `/tagihan/${item.invoice.id}` : "/tagihan"}
                          variant="ghost"
                          size="sm"
                        >
                          Tagihan
                        </LinkButton>
                      ) : null}
                      {canCancel(item.status) ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(item.id)}
                        >
                          Batalkan
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
