import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { http } from "../api/http";
import { getErrorMessage, sessionLabel } from "../utils/format";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { IconArrow } from "../components/Icons";

const FALLBACK_DISCLAIMER =
  "Ini bukan pengganti opini medis. Layanan ini tidak mendiagnosis, tidak meresepkan obat, dan bukan gawat darurat.";

export default function Chatbot() {
  const { token, user } = useSelector((state) => state.auth);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: "/chatbot" }} />;
  }
  if (user?.role && user.role !== "patient") {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await http.post("/chatbot/recommend", { message });
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Konsultasi awal"
        title="Ceritakan keluhan Anda"
        description="Staf virtual kami membantu mengarahkan ke poli dan dokter yang sesuai. Ini bukan konsultasi dengan dokter."
      />
      <aside className="mb-5 rounded-2xl border border-amber/25 bg-amber-soft px-4 py-3 text-sm text-ink">
        {result?.disclaimer || FALLBACK_DISCLAIMER}
      </aside>
      <form onSubmit={handleSubmit} className="mf-card p-5 md:p-6">
        <label className="block text-sm font-semibold">
          Keluhan
          <textarea
            required
            maxLength={1000}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Contoh: gigi geraham kiri sakit sejak kemarin"
            className="mf-input"
          />
        </label>
        {error ? <p className="mt-3 text-sm font-semibold text-danger">{error}</p> : null}
        <Button type="submit" className="mt-4" disabled={loading}>
          {loading ? "Mencari poli yang sesuai..." : "Kirim keluhan"}
        </Button>
      </form>

      {result ? (
        <section className="mt-8 space-y-4">
          <p className="leading-relaxed text-ink/80">{result.reply}</p>
          {(result.recommendations || []).length === 0 ? (
            <Link to="/spesialisasi" className="inline-flex items-center gap-1.5 font-semibold text-primary">
              Lihat daftar spesialisasi
              <IconArrow />
            </Link>
          ) : (
            result.recommendations.map((item) => (
              <article key={item.doctorId} className="mf-card p-5">
                <p className="mf-kicker">{item.specialtyName}</p>
                <h2 className="mt-2 font-display text-2xl font-medium text-ink">{item.doctorName}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.reason}</p>
                {item.nextSession ? (
                  <p className="mt-2 text-sm">
                    Sesi berikutnya: {item.nextSession.date} · {sessionLabel(item.nextSession.session)}
                  </p>
                ) : null}
                <Link
                  to={`/daftar-dokter/${item.doctorId}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  Buka profil dokter
                  <IconArrow />
                </Link>
              </article>
            ))
          )}
        </section>
      ) : null}
    </div>
  );
}
