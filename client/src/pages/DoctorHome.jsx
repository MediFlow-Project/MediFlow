import { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  callNextPatient,
  fetchDoctorBoard,
  fetchDoctorSessions,
  openDoctorSession,
  skipPatient,
  startConsult,
} from "../store/queueSlice";
import { showToast } from "../store/uiSlice";
import useQueueSocket from "../hooks/useQueueSocket";
import { sessionLabel, todayDateOnly } from "../utils/format";
import PageHeader from "../components/PageHeader";
import QueueBoard from "../components/QueueBoard";
import Button from "../components/Button";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

export default function DoctorHome() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { sessions, board, status, actionStatus, error } = useSelector(
    (state) => state.queue
  );
  const [params, setParams] = useSearchParams();
  const date = params.get("date") || todayDateOnly();
  const session = params.get("session") || sessions[0]?.session || "morning";
  const doctorId = user?.doctor?.id;

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

  useQueueSocket({
    doctorId,
    date,
    session,
    onUpdated: hydrate,
  });

  function selectSession(next) {
    setParams({ date: next.date, session: next.session });
  }

  async function handleOpen() {
    const result = await dispatch(openDoctorSession({ date, session }));
    if (openDoctorSession.fulfilled.match(result)) {
      dispatch(showToast({ type: "success", message: "Sesi dibuka." }));
      dispatch(fetchDoctorSessions());
    } else {
      dispatch(showToast({ type: "error", message: result.payload }));
    }
  }

  async function handleCall() {
    const result = await dispatch(callNextPatient({ date, session }));
    if (callNextPatient.fulfilled.match(result)) {
      dispatch(showToast({ type: "success", message: `Nomor ${result.payload.queueNumber} dipanggil.` }));
      hydrate();
    } else {
      dispatch(showToast({ type: "error", message: result.payload }));
    }
  }

  async function handleSkip(appointmentId) {
    const result = await dispatch(skipPatient({ appointmentId }));
    if (skipPatient.fulfilled.match(result)) {
      dispatch(showToast({ type: "success", message: "Pasien dilewati." }));
      hydrate();
    } else {
      dispatch(showToast({ type: "error", message: result.payload }));
    }
  }

  async function handleStart(appointmentId) {
    const result = await dispatch(startConsult({ appointmentId }));
    if (startConsult.fulfilled.match(result)) {
      dispatch(showToast({ type: "success", message: "Konsultasi dimulai." }));
      hydrate();
    } else {
      dispatch(showToast({ type: "error", message: result.payload }));
    }
  }

  const currentMeta = sessions.find((item) => item.session === session && item.date === date);

  return (
    <div>
      <PageHeader
        eyebrow="Dokter"
        title="Papan sesi"
        description="Buka sesi, lalu panggil dari kartu amber."
      />
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
        {sessions.length === 0 ? (
          <EmptyState
            title="Tidak ada jadwal hari ini"
            hint="Admin belum mengatur jadwal untuk hari ini."
          />
        ) : (
          <div className="space-y-2">
            {sessions.map((item) => (
              <button
                key={`${item.date}-${item.session}`}
                type="button"
                onClick={() => selectSession(item)}
                className={`w-full rounded-2xl px-4 py-4 text-left ${
                  item.session === session
                    ? "bg-primary text-white"
                    : "mf-card text-ink"
                }`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide">
                  {sessionLabel(item.session)}
                </p>
                <p className="font-display text-xl font-medium">
                  {item.startTime}–{item.endTime}
                </p>
                <p className={`text-xs ${item.session === session ? "text-white/80" : "text-muted"}`}>
                  {item.isOpen ? "Sesi terbuka" : "Belum dibuka"} · sisa {item.remainingQuota}
                </p>
              </button>
            ))}
          </div>
        )}
        <Button variant="pine" className="w-full" onClick={handleOpen} disabled={actionStatus === "loading"}>
          {currentMeta?.isOpen ? "Buka ulang sesi" : "Buka sesi"}
        </Button>
        {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
      </aside>

      <div>
        {status === "loading" && !board ? (
          <Loading />
        ) : (
          <QueueBoard
            board={board}
            variant="doctor"
            actionBusy={actionStatus === "loading"}
            onCall={handleCall}
            onSkip={handleSkip}
            onStart={handleStart}
          />
        )}
      </div>
      </div>
    </div>
  );
}
