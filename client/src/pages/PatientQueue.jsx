import { useCallback, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAppointment } from "../store/appointmentsSlice";
import { fetchPatientBoard } from "../store/queueSlice";
import useQueueSocket from "../hooks/useQueueSocket";
import {
  formatDateId,
  sessionLabel,
} from "../utils/format";
import QueueBoard from "../components/QueueBoard";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

export default function PatientQueue() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const appointment = useSelector((state) => state.appointments.current);
  const { board, status, error } = useSelector((state) => state.queue);

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

  if (!appointment && status === "loading") return <Loading />;
  if (!appointment) {
    return <EmptyState title="Janji tidak ditemukan" hint={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live"
        title={`Antrean ${appointment.doctor?.name || ""}`}
        description={`${formatDateId(appointment.date)} · sesi ${sessionLabel(appointment.session)}. Nomor Anda ${String(appointment.queueNumber).padStart(2, "0")}.`}
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/saya" className="text-sm font-semibold text-primary">
            Kembali ke janji
          </Link>
        </div>
      </PageHeader>
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
      <QueueBoard board={board} myQueueNumber={appointment.queueNumber} />
    </div>
  );
}
