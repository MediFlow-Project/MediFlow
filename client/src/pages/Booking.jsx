import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { http } from "../api/http";
import { createAppointment } from "../store/appointmentsSlice";
import { showToast } from "../store/uiSlice";
import {
  formatDateId,
  formatFee,
  getErrorMessage,
  sessionLabel,
} from "../utils/format";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";

export default function Booking() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const date = params.get("date");
  const session = params.get("session");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    http
      .get(`/doctors/${id}`)
      .then(({ data }) => setDoctor(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const chosen = doctor?.upcomingSessions?.find(
    (item) => item.date === date && item.session === session
  );

  async function confirm() {
    setSubmitting(true);
    setError("");
    const result = await dispatch(
      createAppointment({ doctorId: Number(id), date, session })
    );
    setSubmitting(false);
    if (createAppointment.fulfilled.match(result)) {
      dispatch(showToast({ type: "success", message: "Janji berhasil dibuat." }));
      navigate("/saya");
    } else {
      setError(result.payload || "Gagal membuat janji.");
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        eyebrow="Konfirmasi"
        title="Kunci sesi ini?"
        description="Nomor antrean diberikan setelah janji tersimpan."
      />
      <div className="mf-card p-6 md:p-7">
        <p className="font-display text-3xl font-medium tracking-tight text-ink">{doctor?.name}</p>
        <p className="mt-1 text-sm font-semibold text-primary">{doctor?.specialty?.name}</p>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b border-line pb-3">
            <dt className="text-muted">Tanggal</dt>
            <dd className="font-semibold">{formatDateId(date)}</dd>
          </div>
          <div className="flex justify-between border-b border-line pb-3">
            <dt className="text-muted">Sesi</dt>
            <dd className="font-semibold">{sessionLabel(session)}</dd>
          </div>
          <div className="flex justify-between border-b border-line pb-3">
            <dt className="text-muted">Biaya konsul</dt>
            <dd className="font-semibold">{formatFee(doctor?.consultationFee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Sisa kuota</dt>
            <dd className="font-semibold">{chosen?.remainingQuota ?? "—"}</dd>
          </div>
        </dl>
        {error ? <p className="mt-4 text-sm font-semibold text-danger">{error}</p> : null}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={confirm} disabled={submitting || !date || !session}>
            {submitting ? "Menyimpan..." : "Konfirmasi booking"}
          </Button>
          <Link to={`/daftar-dokter/${id}`} className="text-sm font-semibold text-primary">
            Kembali
          </Link>
        </div>
      </div>
    </div>
  );
}
