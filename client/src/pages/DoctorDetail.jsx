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
  sessionLabel,
} from "../utils/format";
import PageHeader from "../components/PageHeader";
import SessionChip from "../components/SessionChip";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import Alert from "../components/Alert";
import Avatar from "../components/Avatar";
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

  const staffBlocked = Boolean(token && user && user.role !== "patient");

  function chooseSession(session) {
    if (session.remainingQuota <= 0 || staffBlocked) return;
    setSelected(session);
    if (!token) {
      navigate("/login", {
        state: { from: bookingPath(id, session.date, session.session) },
      });
      return;
    }
    navigate(bookingPath(id, session.date, session.session));
  }

  if (loading) return <Loading label="Memuat profil dokter..." />;
  if (error || !doctor) {
    return <EmptyState title="Dokter tidak ditemukan" hint={error} />;
  }

  const schedules = doctor.schedules || [];

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
      <aside className="mf-card mf-rise self-start p-6 lg:sticky lg:top-32">
        <div className="flex items-center gap-4">
          <Avatar src={doctor.imgUrl} name={doctor.name} size="xl" />
          <div className="min-w-0">
            <p className="mf-kicker">{doctor.specialty?.name || "Konsultan"}</p>
            <h1 className="mf-display mt-2 text-2xl text-ink sm:text-3xl">
              {doctor.name}
            </h1>
          </div>
        </div>
        <div className="mf-rule" />
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {doctor.bio || "Dokter praktik di RS MediFlow."}
        </p>

        <div className="mt-6 flex items-baseline justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3.5">
          <span className="text-sm font-medium text-muted">
            Biaya konsultasi
          </span>
          <span className="tabular font-display text-2xl font-semibold text-primary">
            {formatFee(doctor.consultationFee)}
          </span>
        </div>

        {schedules.length > 0 ? (
          <div className="mt-6 border-t border-hairline pt-5">
            <p className="mf-kicker inline-flex items-center gap-2">
              <IconClock className="h-3.5 w-3.5" />
              Jadwal rutin
            </p>
            <table className="mf-table mt-3">
              <thead>
                <tr>
                  <th>Hari</th>
                  <th>Sesi</th>
                  <th className="text-right">Kuota</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((item) => (
                  <tr key={item.id}>
                    <td className="font-semibold">{DAY_NAMES[item.dayOfWeek]}</td>
                    <td>
                      {sessionLabel(item.session)}
                      <span className="tabular ml-2 text-xs text-muted">
                        {item.startTime}–{item.endTime}
                      </span>
                    </td>
                    <td className="tabular text-right">{item.quota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </aside>

      <section>
        <PageHeader
          eyebrow="Pendaftaran kunjungan"
          title="Pilih sesi praktik"
          description="Booking mengunci sesi pagi atau siang, bukan jam tertentu. Akun pasien diperlukan untuk konfirmasi."
        />
        {staffBlocked ? (
          <Alert tone="info" className="mb-5">
            Pendaftaran sesi hanya untuk akun pasien.
          </Alert>
        ) : null}
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
                <h2 className="flex items-center gap-2.5 text-sm font-semibold text-primary">
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-accent" aria-hidden="true" />
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
                      disabled={session.remainingQuota <= 0 || staffBlocked}
                      disabledLabel={
                        session.remainingQuota <= 0
                          ? "Kuota penuh"
                          : "Hanya akun pasien"
                      }
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
