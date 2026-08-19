import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { http } from "../api/http";
import {
  DAY_NAMES,
  formatDateId,
  formatFee,
  getErrorMessage,
  initials,
  sessionLabel,
} from "../utils/format";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Button from "../components/Button";
import { IconArrow } from "../components/Icons";

const SESSION_KEYS = ["morning", "afternoon"];

function SessionSlot({ date, sessionKey, slot, onBook }) {
  if (!slot) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-sand/60 px-4 py-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
          {sessionLabel(sessionKey)}
        </p>
        <p className="mt-2 text-sm text-muted">Tidak ada sesi</p>
      </div>
    );
  }

  const full = slot.remainingQuota <= 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
          {sessionLabel(sessionKey)}
        </p>
        <p className="text-xs font-semibold text-muted">
          {slot.startTime}–{slot.endTime}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-mist font-display text-sm font-medium text-primary">
          {slot.imgUrl ? (
            <img src={slot.imgUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(slot.doctorName)
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{slot.doctorName}</p>
          <p className="text-sm text-muted">{formatFee(slot.consultationFee)}</p>
        </div>
      </div>
      <p className={`mt-3 text-sm font-semibold ${full ? "text-danger" : "text-muted"}`}>
        {full ? "Kuota penuh" : `Sisa kuota ${slot.remainingQuota}`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="flex-1"
          disabled={full}
          onClick={() => onBook(slot.doctorId, date, sessionKey)}
        >
          {full ? "Penuh" : "Pesan sesi"}
        </Button>
        <Link
          to={`/daftar-dokter/${slot.doctorId}`}
          className="inline-flex items-center justify-center rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-primary hover:bg-mist"
        >
          Profil
        </Link>
      </div>
    </div>
  );
}

export default function SpecialtyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const [specialty, setSpecialty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    http
      .get(`/specialties/${id}`)
      .then(({ data }) => {
        if (!cancelled) {
          setSpecialty(data);
          setError("");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function bookSession(doctorId, date, session) {
    if (!token) {
      navigate("/login", { state: { from: `/spesialisasi/${id}` } });
      return;
    }
    if (user?.role !== "patient") return;
    navigate(`/daftar-dokter/${doctorId}/pesan?date=${date}&session=${session}`);
  }

  if (loading) return <Loading />;
  if (error || !specialty) {
    return <EmptyState title="Spesialisasi tidak ditemukan" hint={error} />;
  }

  const calendar = specialty.calendar || [];
  const doctors = specialty.doctors || [];

  return (
    <div>
      {specialty.imgUrl ? (
        <div className="mb-6 overflow-hidden rounded-3xl bg-mist">
          <img
            src={specialty.imgUrl}
            alt={specialty.name}
            className="h-48 w-full object-cover md:h-64"
          />
        </div>
      ) : null}
      <PageHeader
        eyebrow="Poli"
        title={specialty.name}
        description={
          specialty.description ||
          "Jadwal 14 hari ke depan: pilih tanggal, lalu sesi pagi atau siang beserta dokternya."
        }
      />

      {calendar.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal"
          hint="Poli ini belum memiliki sesi pagi atau siang yang terbuka."
        />
      ) : (
        <div className="space-y-4">
          {calendar.map((day) => (
            <article key={day.date} className="mf-card p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl font-medium text-ink">
                  {formatDateId(day.date)}
                </h2>
                <p className="text-sm text-muted">{DAY_NAMES[day.dayOfWeek]}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {SESSION_KEYS.map((sessionKey) => (
                  <SessionSlot
                    key={sessionKey}
                    date={day.date}
                    sessionKey={sessionKey}
                    slot={day.sessions?.[sessionKey]}
                    onBook={bookSession}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {doctors.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-2xl font-medium text-ink">Dokter di poli ini</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {doctors.map((doctor) => (
              <Link
                key={doctor.id}
                to={`/daftar-dokter/${doctor.id}`}
                className="mf-card flex items-center gap-4 p-5 transition hover:border-primary/25"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-mist font-display text-xl font-medium text-primary">
                  {doctor.imgUrl ? (
                    <img src={doctor.imgUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(doctor.name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-xl font-medium text-ink">{doctor.name}</h3>
                  <p className="text-sm text-muted">{formatFee(doctor.consultationFee)}</p>
                </div>
                <IconArrow className="shrink-0 text-primary" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
