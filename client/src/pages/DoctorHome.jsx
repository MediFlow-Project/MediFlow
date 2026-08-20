import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  callNextPatient,
  completeConsult,
  fetchDoctorBoard,
  fetchDoctorSessions,
  openDoctorSession,
  skipPatient,
  startConsult,
} from "../store/queueSlice";
import { useToast } from "../context/ToastContext";
import useQueueSocket from "../hooks/useQueueSocket";
import { formatDateId, todayDateOnly } from "../utils/format";
import { http } from "../api/http";
import PageHeader from "../components/PageHeader";
import QueueBoard from "../components/QueueBoard";
import DoctorSessionPicker from "../components/DoctorSessionPicker";
import ConsultationForm from "../components/ConsultationForm";
import Loading from "../components/Loading";

export default function DoctorHome() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user } = useSelector((state) => state.auth);
  const { sessions, board, status, actionStatus, error } = useSelector(
    (state) => state.queue
  );
  const [params, setParams] = useSearchParams();
  const date = params.get("date") || todayDateOnly();
  const session = params.get("session") || sessions[0]?.session || "morning";
  const doctorId = user?.doctor?.id;
  const [medicines, setMedicines] = useState([]);

  const hydrate = useCallback(() => {
    if (!date || !session) return;
    dispatch(fetchDoctorBoard({ date, session }));
  }, [date, session, dispatch]);

  useEffect(() => {
    dispatch(fetchDoctorSessions());
  }, [dispatch]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    http
      .get("/admin/medicines")
      .then(({ data }) => setMedicines(data))
      .catch(() => {});
  }, []);

  useQueueSocket({ doctorId, date, session, onUpdated: hydrate });

  const inConsult = (board?.items || []).find(
    (item) => item.status === "in_consultation"
  );
  const currentMeta = sessions.find(
    (item) => item.session === session && item.date === date
  );
  const busy = actionStatus === "loading";

  function notify(type, message) {
    showToast({ type, message });
  }

  async function handleOpen() {
    const result = await dispatch(openDoctorSession({ date, session }));
    if (openDoctorSession.fulfilled.match(result)) {
      notify("success", "Sesi dibuka.");
      dispatch(fetchDoctorSessions());
    } else {
      notify("error", result.payload);
    }
  }

  async function handleCall() {
    const result = await dispatch(callNextPatient({ date, session }));
    if (callNextPatient.fulfilled.match(result)) {
      notify("success", `Nomor ${result.payload.queueNumber} dipanggil.`);
      hydrate();
    } else {
      notify("error", result.payload);
    }
  }

  async function handleSkip(appointmentId) {
    const result = await dispatch(skipPatient({ appointmentId }));
    if (skipPatient.fulfilled.match(result)) {
      notify("success", "Pasien dilewati.");
      hydrate();
    } else {
      notify("error", result.payload);
    }
  }

  async function handleStart(appointmentId) {
    const result = await dispatch(startConsult({ appointmentId }));
    if (startConsult.fulfilled.match(result)) {
      notify("success", "Konsultasi dimulai.");
      hydrate();
    } else {
      notify("error", result.payload);
    }
  }

  async function handleComplete(values) {
    if (!inConsult?.appointmentId) return false;
    const result = await dispatch(
      completeConsult({ appointmentId: inConsult.appointmentId, ...values })
    );
    if (completeConsult.fulfilled.match(result)) {
      notify("success", "Konsultasi selesai. Tagihan dibuat.");
      hydrate();
      return true;
    }
    notify("error", result.payload);
    return false;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Ruang praktik"
        title="Papan sesi hari ini"
        description={`Buka sesi, panggil pasien sesuai nomor, lalu isi ringkasan konsultasi. ${formatDateId(
          date
        )}.`}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,290px)_minmax(0,1fr)]">
        <DoctorSessionPicker
          sessions={sessions}
          activeDate={date}
          activeSession={session}
          isOpen={currentMeta?.isOpen}
          busy={busy}
          error={error}
          onSelect={(next) =>
            setParams({ date: next.date, session: next.session })
          }
          onOpen={handleOpen}
        />

        <div className="space-y-5">
          {status === "loading" && !board ? (
            <Loading label="Memuat papan antrean..." />
          ) : (
            <QueueBoard
              board={board}
              variant="doctor"
              actionBusy={busy}
              onCall={handleCall}
              onSkip={handleSkip}
              onStart={handleStart}
            />
          )}
          {inConsult ? (
            <ConsultationForm
              key={inConsult.appointmentId}
              queueNumber={inConsult.queueNumber}
              patientName={inConsult.patientNameMasked}
              medicines={medicines}
              busy={busy}
              onSubmit={handleComplete}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
