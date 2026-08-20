import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { http } from "../api/http";
import {
  bookingPath,
  DAY_NAMES,
  formatDateId,
  formatFee,
  getErrorMessage,
  sessionLabel,
} from "../utils/format";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Button from "../components/Button";
import Alert from "../components/Alert";
import Avatar from "../components/Avatar";
import { IconArrow, IconCalendar, IconClock } from "../components/Icons";

const SESSION_KEYS = ["morning", "afternoon"];

function SessionSlot({ date, sessionKey, slot, onBook, staffBlocked }) {
  if (!slot) {
    return (
      <div className="flex h-full flex-col justify-center rounded-sm border border-dashed border-line bg-sand/40 px-5 py-6">
        <p className="text-xs font-semibold text-muted">
          {sessionLabel(sessionKey)}
        </p>
        <p className="mt-2 text-sm text-muted">Tidak ada sesi praktik</p>
      </div>
    );
  }

  const full = slot.remainingQuota <= 0;

  return (
    <div className="mf-card-quiet flex h-full flex-col rounded-sm bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="inline-flex rounded-sm bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-ink ring-1 ring-accent/30">
          {sessionLabel(sessionKey)}
        </p>
        <p className="tabular inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
          <IconClock className="h-3.5 w-3.5" />
          {slot.startTime}–{slot.endTime}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-3.5">
        <Avatar src={slot.imgUrl} name={slot.doctorName} size="md" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{slot.doctorName}</p>
          <p className="tabular text-sm text-muted">{formatFee(slot.consultationFee)}</p>
        </div>
      </div>
      <p
        className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${
          full ? "text-danger" : "text-moss"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${full ? "bg-danger" : "bg-moss"}`}
          aria-hidden="true"
        />
        {full ? "Kuota penuh" : `Sisa kuota ${slot.remainingQuota}`}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          className="flex-1"
          disabled={full || staffBlocked}
          onClick={() => onBook(slot.doctorId, date, sessionKey)}
        >
          {full ? "Penuh" : staffBlocked ? "Hanya pasien" : "Daftar sesi"}
        </Button>
        <Link to={`/daftar-dokter/${slot.doctorId}`} className="mf-ghost-link">
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

  const staffBlocked = Boolean(token && user && user.role !== "patient");

  function bookSession(doctorId, date, session) {
    if (staffBlocked) return;
    if (!token) {
      navigate("/login", {
        state: { from: bookingPath(doctorId, date, session) },
      });
      return;
    }
    navigate(bookingPath(doctorId, date, session));
  }

  if (loading) return <Loading label="Memuat jadwal poli..." />;
  if (error || !specialty) {
    return <EmptyState title="Poliklinik tidak ditemukan" hint={error} />;
  }

  const calendar = specialty.calendar || [];
  const doctors = specialty.doctors || [];

  return (
    <div>
      <div className="relative mb-9 overflow-hidden rounded-[2rem] text-white">
        {specialty.imgUrl ? (
          <img
            src={specialty.imgUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div
          className={`relative px-5 py-10 sm:px-8 sm:py-14 ${
            specialty.imgUrl
              ? "bg-gradient-to-r from-primary-dark/90 via-primary-dark/70 to-primary-dark/35"
              : "mf-surface-ink"
          }`}
        >
          <p className="mf-kicker-light">Poliklinik</p>
          <h1 className="mf-display mt-3 text-3xl sm:text-5xl">{specialty.name}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80">
            {specialty.description ||
              "Jadwal 14 hari ke depan: pilih tanggal, lalu sesi pagi atau siang beserta dokter jaga."}
          </p>
        </div>
      </div>
      {staffBlocked ? (
        <Alert tone="info" className="mb-5">
          Pendaftaran sesi hanya untuk akun pasien.
        </Alert>
      ) : null}

      {calendar.length === 0 ? (
        <EmptyState
          icon={IconCalendar}
          title="Belum ada jadwal"
          hint="Poli ini belum memiliki sesi pagi atau siang yang terbuka."
        />
      ) : (
        <div className="space-y-5">
          {calendar.map((day, index) => (
            <article
              key={day.date}
              className="mf-card mf-rise p-5 sm:p-6"
              style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
            >
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline pb-4">
                <h2 className="font-display text-2xl font-semibold text-ink">
                  {formatDateId(day.date)}
                </h2>
                <p className="mf-chip bg-mist text-primary ring-1 ring-primary/10">
                  {DAY_NAMES[day.dayOfWeek]}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {SESSION_KEYS.map((sessionKey) => (
                  <SessionSlot
                    key={sessionKey}
                    date={day.date}
                    sessionKey={sessionKey}
                    slot={day.sessions?.[sessionKey]}
                    onBook={bookSession}
                    staffBlocked={staffBlocked}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {doctors.length > 0 ? (
        <section className="mt-14">
          <p className="mf-kicker">Staf medis</p>
          <h2 className="mf-display mt-2.5 text-3xl text-ink">
            Dokter di poli ini
          </h2>
          <div className="mf-rule" />
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {doctors.map((doctor) => (
              <Link
                key={doctor.id}
                to={`/daftar-dokter/${doctor.id}`}
                className="mf-card mf-card-interactive group flex items-center justify-between gap-4 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar src={doctor.imgUrl} name={doctor.name} size="sm" />
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-semibold text-ink">
                      {doctor.name}
                    </h3>
                    <p className="tabular mt-0.5 text-sm text-muted">
                      {formatFee(doctor.consultationFee)}
                    </p>
                  </div>
                </div>
                <IconArrow className="h-4 w-4 shrink-0 text-accent" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
