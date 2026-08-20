import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { http } from "../api/http";
import { createAppointment } from "../store/appointmentsSlice";
import { useToast } from "../context/ToastContext";
import {
  formatDateId,
  formatFee,
  getErrorMessage,
  sessionLabel,
} from "../utils/format";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import Letterhead from "../components/Letterhead";
import Alert from "../components/Alert";
import Avatar from "../components/Avatar";

export default function Booking() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const date = params.get("date");
  const session = params.get("session");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
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
      showToast({ type: "success", message: "Kunjungan berhasil didaftarkan." });
      navigate("/saya");
    } else {
      setError(result.payload || "Gagal membuat janji.");
    }
  }

  if (loading) return <Loading label="Menyiapkan konfirmasi..." />;

  const rows = [
    { term: "Tanggal kunjungan", value: formatDateId(date) },
    { term: "Sesi praktik", value: sessionLabel(session) },
    { term: "Biaya konsultasi", value: formatFee(doctor?.consultationFee) },
    { term: "Sisa kuota", value: chosen?.remainingQuota ?? "—" },
  ];

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        eyebrow="Pendaftaran kunjungan"
        title="Konfirmasi sesi praktik"
        description="Nomor antrean terbit setelah pendaftaran tersimpan di rekam kunjungan Anda."
      />
      <div className="mf-card mf-rise p-6 shadow-md md:p-8">
        <Letterhead compact />

        <div className="mt-7 flex items-center gap-4">
          <Avatar src={doctor?.imgUrl} name={doctor?.name} size="lg" />
          <div className="min-w-0">
            <p className="mf-kicker">{doctor?.specialty?.name}</p>
            <p className="mt-1.5 font-display text-3xl font-medium leading-tight tracking-tight text-primary">
              {doctor?.name}
            </p>
          </div>
        </div>

        <dl className="mf-card-quiet mt-7 divide-y divide-hairline px-4 text-sm">
          {rows.map((row) => (
            <div
              key={row.term}
              className="flex items-baseline justify-between gap-4 py-3.5"
            >
              <dt className="text-muted">{row.term}</dt>
              <dd className="tabular text-right font-semibold text-ink">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {error ? <Alert className="mt-5">{error}</Alert> : null}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className="flex-1"
            onClick={confirm}
            loading={submitting}
            disabled={!date || !session}
          >
            {submitting ? "Menyimpan..." : "Konfirmasi pendaftaran"}
          </Button>
          <LinkButton to={`/daftar-dokter/${id}`} variant="ghost" size="lg">
            Kembali
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
