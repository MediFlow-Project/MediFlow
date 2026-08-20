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
import { formatDateId, getErrorMessage, todayDateOnly } from "../utils/format";
import { http } from "../api/http";
import PageHeader from "../components/PageHeader";
import QueueBoard from "../components/QueueBoard";
import DoctorSessionPicker from "../components/DoctorSessionPicker";
import ConsultationForm from "../components/ConsultationForm";
import Loading from "../components/Loading";
import Alert from "../components/Alert";
import ConfirmDialog from "../components/ConfirmDialog";

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
  const [medicinesError, setMedicinesError] = useState("");
  const [pendingSkipId, setPendingSkipId] = useState(null);

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
      .then(({ data }) => {
        setMedicines(Array.isArray(data) ? data : []);
        setMedicinesError("");
      })
      .catch((err) => {
        setMedicines([]);
        setMedicinesError(getErrorMessage(err));
      });
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

  async function handleSkip() {
    if (!pendingSkipId) return;
    const result = await dispatch(skipPatient({ appointmentId: pendingSkipId }));
    setPendingSkipId(null);
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
              onSkip={setPendingSkipId}
              onStart={handleStart}
            />
          )}
          {medicinesError ? <Alert>{medicinesError}</Alert> : null}
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
      <ConfirmDialog
        open={Boolean(pendingSkipId)}
        title="Lewati pasien?"
        description="Status kunjungan menjadi tidak hadir. Pasien berikutnya dapat dipanggil."
        confirmLabel="Lewati"
        danger
        busy={busy}
        onConfirm={handleSkip}
        onCancel={() => !busy && setPendingSkipId(null)}
      />
    </div>
  );
}
