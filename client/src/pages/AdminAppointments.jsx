import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { http } from "../api/http";
import {
  formatDateId,
  getErrorMessage,
  sessionLabel,
} from "../utils/format";
import AdminNav from "../components/AdminNav";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { showToast } from "../store/uiSlice";

export default function AdminAppointments() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({ status: "", date: "", doctorId: "" });

  async function load(next = filters) {
    const { data } = await http.get("/admin/appointments", {
      params: {
        status: next.status || undefined,
        date: next.date || undefined,
        doctorId: next.doctorId || undefined,
      },
    });
    setItems(data);
  }

  useEffect(() => {
    let cancelled = false;
    http
      .get("/admin/doctors")
      .then(({ data }) => {
        if (!cancelled) setDoctors(data);
      })
      .catch(() => {});
    http
      .get("/admin/appointments")
      .then(({ data }) => {
        if (!cancelled) setItems(data);
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
      <PageHeader eyebrow="Admin" title="Janji temu" description="Monitor booking seluruh dokter." />
      <form
        className="mf-card mb-6 grid gap-3 p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          load(filters).catch((err) =>
            dispatch(showToast({ type: "error", message: getErrorMessage(err) }))
          );
        }}
      >
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="mf-input mt-0"
        >
          <option value="">Semua status</option>
          {["booked", "waiting", "called", "in_consultation", "completed", "cancelled", "no_show"].map(
            (status) => (
              <option key={status} value={status}>
                {status}
              </option>
            )
          )}
        </select>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="mf-input mt-0"
        />
        <select
          value={filters.doctorId}
          onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
          className="mf-input mt-0"
        >
          <option value="">Semua dokter</option>
          {doctors.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover">
          Filter
        </button>
      </form>
      <div className="mf-card overflow-x-auto">
        <table className="mf-table">
          <thead>
            <tr className="text-ink/60">
              <th className="px-4 py-3">Pasien</th>
              <th className="px-4 py-3">Dokter</th>
              <th className="px-4 py-3">Jadwal</th>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-sand">
                <td className="px-4 py-3">{item.patient?.name}</td>
                <td className="px-4 py-3">
                  {item.doctor?.name}
                  <span className="block text-xs text-ink/60">{item.doctor?.specialty?.name}</span>
                </td>
                <td className="px-4 py-3">
                  {formatDateId(item.date)} · {sessionLabel(item.session)}
                </td>
                <td className="px-4 py-3">{item.queueNumber}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
