import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { http } from "../api/http";
import {
  DAY_NAMES,
  formatFee,
  getErrorMessage,
  initials,
  sessionLabel,
} from "../utils/format";
import PageHeader from "../components/PageHeader";
import SessionChip from "../components/SessionChip";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";

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
        state: { from: `/daftar-dokter/${id}` },
      });
      return;
    }
    if (user?.role !== "patient") return;
    navigate(
      `/daftar-dokter/${id}/pesan?date=${session.date}&session=${session.session}`
    );
  }

  if (loading) return <Loading />;
  if (error || !doctor) {
    return <EmptyState title="Dokter tidak ditemukan" hint={error} />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="mf-card overflow-hidden">
        <div className="h-64 bg-mist">
          {doctor.imgUrl ? (
            <img src={doctor.imgUrl} alt={doctor.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-6xl font-medium text-primary">
              {initials(doctor.name)}
            </div>
          )}
        </div>
        <div className="p-6">
          <p className="mf-kicker">{doctor.specialty?.name}</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink">{doctor.name}</h1>
          <p className="mt-3 leading-relaxed text-muted">{doctor.bio || "Dokter praktik di RS MediFlow."}</p>
          <p className="mt-4 text-lg font-semibold text-primary">{formatFee(doctor.consultationFee)}</p>
          <div className="mt-6 space-y-2 border-t border-line pt-5 text-sm text-muted">
            {(doctor.schedules || []).map((item) => (
              <p key={item.id}>
                {DAY_NAMES[item.dayOfWeek]} · {sessionLabel(item.session)} · {item.startTime}–
                {item.endTime} · kuota {item.quota}
              </p>
            ))}
          </div>
        </div>
      </aside>

      <section>
        <PageHeader
          eyebrow="14 hari ke depan"
          title="Pilih sesi"
          description="Booking mengunci sesi pagi atau siang, bukan jam tertentu. Login pasien diperlukan untuk konfirmasi."
        />
        {grouped.length === 0 ? (
          <EmptyState title="Tidak ada jadwal" hint="Dokter ini belum memiliki sesi terbuka." />
        ) : (
          <div className="space-y-6">
            {grouped.map(([date, sessions]) => (
              <div key={date}>
                <h2 className="mb-3 text-sm font-semibold text-ink">{date}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {sessions.map((session) => (
                    <SessionChip
                      key={`${session.date}-${session.session}`}
                      date={session.date}
                      session={session.session}
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
