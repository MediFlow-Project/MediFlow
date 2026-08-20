import { useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointment } from "../store/appointmentsSlice";
import { fetchPatientBoard } from "../store/queueSlice";
import useQueueSocket from "../hooks/useQueueSocket";
import { formatDateId, sessionLabel } from "../utils/format";
import QueueBoard from "../components/QueueBoard";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import Alert from "../components/Alert";
import LinkButton from "../components/LinkButton";

export default function PatientQueue() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const appointment = useSelector((state) => state.appointments.current);
  const detailStatus = useSelector((state) => state.appointments.detailStatus);
  const appointmentError = useSelector((state) => state.appointments.error);
  const { board, error } = useSelector((state) => state.queue);

  const hydrate = useCallback(() => {
    if (!appointment?.doctorId) return;
    dispatch(
      fetchPatientBoard({
        doctorId: appointment.doctorId,
        date: appointment.date,
        session: appointment.session,
      })
    );
  }, [appointment, dispatch]);

  useEffect(() => {
    dispatch(fetchAppointment(id));
  }, [dispatch, id]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useQueueSocket({
    doctorId: appointment?.doctorId,
    date: appointment?.date,
    session: appointment?.session,
    onUpdated: hydrate,
  });

  if (!appointment && (detailStatus === "loading" || !appointmentError)) {
    return <Loading label="Menghubungkan ke papan antrean..." />;
  }
  if (!appointment) {
    return <EmptyState title="Kunjungan tidak ditemukan" hint={appointmentError || error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Papan antrean"
        title={appointment.doctor?.specialty?.name || "Poliklinik"}
        description={`${appointment.doctor?.name || "Dokter"} · ${formatDateId(
          appointment.date
        )} · sesi ${sessionLabel(appointment.session)}. Nomor kunjungan Anda ${String(
          appointment.queueNumber
        ).padStart(2, "0")}.`}
      >
        <LinkButton to="/saya" variant="ghost">
          Kembali ke kunjungan
        </LinkButton>
      </PageHeader>
      {error ? <Alert>{error}</Alert> : null}
      <QueueBoard board={board} myQueueNumber={appointment.queueNumber} />
    </div>
  );
}
