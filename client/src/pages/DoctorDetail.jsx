import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { http } from "../api/http";
import {
  DAY_NAMES,
  bookingPath,
  formatDateDay,
  formatFee,
  getErrorMessage,
  initials,
  sessionLabel,
} from "../utils/format";
import PageHeader from "../components/PageHeader";
import SessionChip from "../components/SessionChip";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { IconCalendar, IconClock } from "../components/Icons";

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    http
      .get(`/doctors/${id}`)
      .then(({ data }) => {
        if (!cancelled) {
          setDoctor(data);
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

  const grouped = useMemo(() => {
    const map = new Map();
    for (const session of doctor?.upcomingSessions || []) {
      if (!map.has(session.date)) map.set(session.date, []);
      map.get(session.date).push(session);
    }
    return [...map.entries()];
  }, [doctor]);

  function chooseSession(session) {
    if (session.remainingQuota <= 0) return;
    setSelected(session);
    if (!token) {
      navigate("/login", {
        state: { from: bookingPath(id, session.date, session.session) },
      });
      return;
    }
    if (user?.role !== "patient") return;
    navigate(bookingPath(id, session.date, session.session));
  }

  if (loading) return <Loading label="Memuat profil dokter..." />;
  if (error || !doctor) {
    return <EmptyState title="Dokter tidak ditemukan" hint={error} />;
  }

  const schedules = doctor.schedules || [];

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
      <aside className="mf-card mf-rise self-start overflow-hidden lg:sticky lg:top-32">
        <div className="relative h-72 bg-mist">
          {doctor.imgUrl ? (
            <img
              src={doctor.imgUrl}
              alt={doctor.name}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-mist to-sand font-display text-6xl font-medium text-primary/70">
              {initials(doctor.name)}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary-dark/60 to-transparent" />
          <p className="absolute left-4 top-4 rounded-full bg-primary-dark/85 px-3.5 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-gold backdrop-blur-sm">
            {doctor.specialty?.name}
          </p>
        </div>
        <div className="p-6">
          <p className="mf-kicker">Konsultan</p>
          <h1 className="mt-2.5 font-display text-3xl font-medium leading-tight tracking-tight text-primary">
            {doctor.name}
          </h1>
          <div className="mf-rule" />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {doctor.bio || "Dokter praktik di RS MediFlow."}
          </p>

          <div className="mf-card-quiet mt-6 flex items-baseline justify-between gap-3 px-4 py-3.5">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted">
              Biaya konsultasi
            </span>
            <span className="tabular font-display text-2xl font-medium text-primary">
              {formatFee(doctor.consultationFee)}
            </span>
          </div>

          {schedules.length > 0 ? (
            <div className="mt-6 border-t border-hairline pt-5">
              <p className="mf-kicker inline-flex items-center gap-2">
                <IconClock className="h-3.5 w-3.5" />
                Jadwal rutin
              </p>
              <ul className="mt-4 space-y-2.5">
                {schedules.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm"
                  >
                    <span className="font-semibold text-ink">
                      {DAY_NAMES[item.dayOfWeek]}
                      <span className="ml-2 font-normal text-muted">
                        {sessionLabel(item.session)}
                      </span>
                    </span>
                    <span className="tabular text-xs text-muted">
                      {item.startTime}–{item.endTime} · kuota {item.quota}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </aside>

      <section>
        <PageHeader
          eyebrow="Pendaftaran kunjungan"
          title="Pilih sesi praktik"
          description="Booking mengunci sesi pagi atau siang, bukan jam tertentu. Akun pasien diperlukan untuk konfirmasi."
        />
        {grouped.length === 0 ? (
          <EmptyState
            icon={IconCalendar}
            title="Tidak ada jadwal"
            hint="Dokter ini belum memiliki sesi terbuka."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {grouped.map(([date, sessions], index) => (
              <div
                key={date}
                className="mf-card-quiet mf-rise p-4"
                style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
              >
                <h2 className="flex items-center gap-2.5 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-primary">
                  <span className="h-px w-4 flex-none bg-gold" aria-hidden="true" />
                  {formatDateDay(date)}
                </h2>
                <div className="mt-3 space-y-2.5">
                  {sessions.map((session) => (
                    <SessionChip
                      key={`${session.date}-${session.session}`}
                      session={session.session}
                      startTime={session.startTime}
                      endTime={session.endTime}
                      remainingQuota={session.remainingQuota}
                      disabled={session.remainingQuota <= 0}
                      selected={
                        selected?.date === session.date &&
                        selected?.session === session.session
                      }
                      onClick={() => chooseSession(session)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
