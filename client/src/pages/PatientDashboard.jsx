import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { cancelAppointment, fetchAppointments } from "../store/appointmentsSlice";
import { fetchInbox } from "../store/chatSlice";
import { showToast } from "../store/uiSlice";
import {
  canCancel,
  canWriteChat,
  formatDateId,
  sessionLabel,
} from "../utils/format";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Button from "../components/Button";

export default function PatientDashboard() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.appointments);
  const inbox = useSelector((state) => state.chat.inbox);

  useEffect(() => {
    dispatch(fetchAppointments());
    dispatch(fetchInbox());
  }, [dispatch]);

  async function handleCancel(id) {
    const result = await dispatch(cancelAppointment(id));
    if (cancelAppointment.fulfilled.match(result)) {
      dispatch(showToast({ type: "success", message: "Janji dibatalkan." }));
    } else {
      dispatch(showToast({ type: "error", message: result.payload }));
    }
  }

  if (status === "loading" && items.length === 0) return <Loading />;

  return (
    <div>
      <PageHeader
        eyebrow="Pasien"
        title="Janji saya"
        description="Pantau nomor antrean, chat dokter, atau buka papan live."
      />
      {items.length === 0 ? (
        <EmptyState
          title="Belum ada janji"
          hint="Pilih dokter dan kunci sesi pagi atau siang."
        >
          <Link
            to="/daftar-dokter"
            className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Cari dokter
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
              const unread = inbox.find((thread) => Number(thread.appointmentId) === Number(item.id))?.unreadCount || 0;
              return (
            <article
              key={item.id}
              className="mf-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="mf-kicker">{item.doctor?.specialty?.name}</p>
                <h2 className="mt-1 font-display text-2xl font-medium tracking-tight text-ink">
                  {item.doctor?.name}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {formatDateId(item.date)} · {sessionLabel(item.session)} · nomor{" "}
                  {String(item.queueNumber).padStart(2, "0")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={item.status} />
                {["booked", "waiting", "called", "in_consultation"].includes(item.status) ? (
                  <Link
                    to={`/saya/antrean/${item.id}`}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    Lihat antrean
                  </Link>
                ) : null}
                {item.status === "completed" ? (
                  <Link to={`/pesan/${item.id}`} className="text-sm font-semibold text-primary">
                    {canWriteChat(item) ? `Chat${unread ? ` (${unread})` : ""}` : "Riwayat chat"}
                  </Link>
                ) : null}
                {item.status === "completed" && item.invoice?.id ? (
                  <Link to={`/tagihan/${item.invoice.id}`} className="text-sm font-semibold text-primary">
                    Tagihan
                  </Link>
                ) : item.status === "completed" ? (
                  <Link to="/tagihan" className="text-sm font-semibold text-primary">
                    Tagihan
                  </Link>
                ) : null}
                {canCancel(item.status) ? (
                  <Button variant="danger" onClick={() => handleCancel(item.id)}>
                    Batalkan
                  </Button>
                ) : null}
              </div>
            </article>
              );
            })}
        </div>
      )}
    </div>
  );
}
