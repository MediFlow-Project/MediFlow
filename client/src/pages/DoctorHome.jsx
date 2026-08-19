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
import { showToast } from "../store/uiSlice";
import useQueueSocket from "../hooks/useQueueSocket";
import { sessionLabel, todayDateOnly } from "../utils/format";
import { http } from "../api/http";
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
  const [medicines, setMedicines] = useState([]);
  const [consultForm, setConsultForm] = useState({
    complaint: "",
    diagnosis: "",
    notes: "",
    medicineId: "",
    quantity: "1",
    dosage: "3x1 sesudah makan",
  });

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

  useQueueSocket({
    doctorId,
    date,
    session,
    onUpdated: hydrate,
  });

  const inConsult = (board?.items || []).find((item) => item.status === "in_consultation");
  const selectedMedicine = medicines.find(
    (item) => String(item.id) === String(consultForm.medicineId)
  );

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

  async function handleComplete(event) {
    event.preventDefault();
    if (!inConsult?.appointmentId) return;
    const items = consultForm.medicineId
      ? [
          {
            medicineId: Number(consultForm.medicineId),
            quantity: Number(consultForm.quantity),
            dosage: consultForm.dosage,
          },
        ]
      : [];
    const result = await dispatch(
      completeConsult({
        appointmentId: inConsult.appointmentId,
        complaint: consultForm.complaint,
        diagnosis: consultForm.diagnosis,
        notes: consultForm.notes,
        items,
      })
    );
    if (completeConsult.fulfilled.match(result)) {
      dispatch(showToast({ type: "success", message: "Konsultasi selesai. Tagihan dibuat." }));
      setConsultForm({
        complaint: "",
        diagnosis: "",
        notes: "",
        medicineId: "",
        quantity: "1",
        dosage: "3x1 sesudah makan",
      });
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

        <div className="space-y-4">
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
          {inConsult ? (
            <form onSubmit={handleComplete} className="mf-card space-y-3 p-5">
              <h2 className="font-display text-xl font-medium">
                Selesai konsul · nomor {String(inConsult.queueNumber).padStart(2, "0")}
              </h2>
              <label className="block text-sm font-semibold">
                Keluhan
                <textarea
                  required
                  value={consultForm.complaint}
                  onChange={(e) => setConsultForm({ ...consultForm, complaint: e.target.value })}
                  className="mf-input"
                  rows={2}
                />
              </label>
              <label className="block text-sm font-semibold">
                Diagnosa
                <textarea
                  required
                  value={consultForm.diagnosis}
                  onChange={(e) => setConsultForm({ ...consultForm, diagnosis: e.target.value })}
                  className="mf-input"
                  rows={2}
                />
              </label>
              <label className="block text-sm font-semibold">
                Catatan
                <input
                  value={consultForm.notes}
                  onChange={(e) => setConsultForm({ ...consultForm, notes: e.target.value })}
                  className="mf-input"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block text-sm font-semibold">
                  Obat
                  <div className="mt-1 flex items-center gap-3">
                    {selectedMedicine?.imgUrl ? (
                      <img
                        src={selectedMedicine.imgUrl}
                        alt={selectedMedicine.name}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    ) : null}
                    <select
                      value={consultForm.medicineId}
                      onChange={(e) => setConsultForm({ ...consultForm, medicineId: e.target.value })}
                      className="mf-input mt-0 flex-1"
                    >
                      <option value="">Tanpa obat</option>
                      {medicines.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <label className="block text-sm font-semibold">
                  Jumlah
                  <input
                    type="number"
                    min="1"
                    value={consultForm.quantity}
                    onChange={(e) => setConsultForm({ ...consultForm, quantity: e.target.value })}
                    className="mf-input"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Dosis
                  <input
                    value={consultForm.dosage}
                    onChange={(e) => setConsultForm({ ...consultForm, dosage: e.target.value })}
                    className="mf-input"
                  />
                </label>
              </div>
              <Button type="submit" disabled={actionStatus === "loading"}>
                Selesai & buat tagihan
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
