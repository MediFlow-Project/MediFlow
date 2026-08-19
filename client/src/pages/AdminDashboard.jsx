import { useEffect, useState } from "react";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/format";
import AdminNav from "../components/AdminNav";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import { showToast } from "../store/uiSlice";
import { useDispatch } from "react-redux";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    http
      .get("/admin/dashboard")
      .then(({ data }) => {
        if (!cancelled) setCounts(data);
      })
      .catch((err) => {
        if (!cancelled) dispatch(showToast({ type: "error", message: getErrorMessage(err) }));
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return (
    <div>
      <AdminNav />
      <PageHeader
        eyebrow="Admin"
        title="Dashboard hari ini"
        description="Hitungan booking dan antrean aktif. Bukan laporan keuangan."
      />
      {!counts ? (
        <Loading />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-[1.5rem] bg-primary p-6 text-white">
            <p className="text-sm font-semibold text-white/80">Booking hari ini</p>
            <p className="tabular mt-2 font-display text-5xl font-medium">{counts.bookingsToday}</p>
          </article>
          <article className="rounded-[1.5rem] bg-amber p-6 text-white">
            <p className="text-sm font-semibold text-white/80">Antrean aktif</p>
            <p className="tabular mt-2 font-display text-5xl font-medium">{counts.activeQueues}</p>
            <p className="mt-2 text-sm text-white/80">waiting, called, dan in_consultation</p>
          </article>
        </div>
      )}
    </div>
  );
}
