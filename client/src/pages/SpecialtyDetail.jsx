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
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import { IconArrow, IconCalendar, IconClock } from "../components/Icons";

const SESSION_KEYS = ["morning", "afternoon"];

function SessionSlot({ date, sessionKey, slot, onBook }) {
  if (!slot) {
    return (
      <div className="flex h-full flex-col justify-center rounded-sm border border-dashed border-line bg-sand/40 px-5 py-6">
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted">
          {sessionLabel(sessionKey)}
        </p>
        <p className="mt-2 text-sm text-muted">Tidak ada sesi praktik</p>
      </div>
    );
  }

  const full = slot.remainingQuota <= 0;

  return (
    <div className="mf-card-quiet flex h-full flex-col bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <p className="mf-chip bg-gold-soft text-bronze ring-1 ring-gold/30">
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
          disabled={full}
          onClick={() => onBook(slot.doctorId, date, sessionKey)}
        >
          {full ? "Penuh" : "Daftar sesi"}
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
  // Seeded photo URLs can rot; drop the decorative banner instead of showing a broken image.
  const [brokenImg, setBrokenImg] = useState("");

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
      navigate("/login", {
        state: { from: bookingPath(doctorId, date, session) },
      });
      return;
    }
    if (user?.role !== "patient") return;
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
      {specialty.imgUrl && brokenImg !== specialty.imgUrl ? (
        <div className="mf-rise relative mb-9 overflow-hidden rounded-lg bg-primary-dark shadow-xl">
          <img
            src={specialty.imgUrl}
            alt=""
            aria-hidden="true"
            onError={() => setBrokenImg(specialty.imgUrl)}
            className="h-48 w-full object-cover opacity-70 md:h-64"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/25 to-transparent" />
          <p className="mf-kicker-light absolute bottom-5 left-6">
            Poliklinik RS MediFlow
          </p>
        </div>
      ) : null}
      <PageHeader
        eyebrow="Poliklinik"
        title={specialty.name}
        description={
          specialty.description ||
          "Jadwal 14 hari ke depan: pilih tanggal, lalu sesi pagi atau siang beserta dokter jaga."
        }
      />

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
                <h2 className="font-display text-2xl font-medium text-primary">
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
          <h2 className="mt-2.5 font-display text-3xl font-medium text-primary">
            Dokter di poli ini
          </h2>
          <div className="mf-rule" />
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {doctors.map((doctor) => (
              <Link
                key={doctor.id}
                to={`/daftar-dokter/${doctor.id}`}
                className="mf-card mf-card-interactive group flex items-center gap-4 p-5"
              >
                <Avatar src={doctor.imgUrl} name={doctor.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-xl font-medium text-primary">
                    {doctor.name}
                  </h3>
                  <p className="tabular text-sm text-muted">
                    {formatFee(doctor.consultationFee)}
                  </p>
                </div>
                <IconArrow className="h-4 w-4 shrink-0 text-bronze transition-transform duration-300 ease-soft group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
