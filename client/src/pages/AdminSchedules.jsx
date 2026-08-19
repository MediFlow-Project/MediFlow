import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { http } from "../api/http";
import { DAY_NAMES, getErrorMessage, sessionLabel } from "../utils/format";
import AdminNav from "../components/AdminNav";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { showToast } from "../store/uiSlice";

const emptyForm = {
  doctorId: "",
  dayOfWeek: "1",
  session: "morning",
  startTime: "08:00",
  endTime: "12:00",
  quota: "10",
};

export default function AdminSchedules() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const [schedules, doctorRes] = await Promise.all([
      http.get("/admin/schedules"),
      http.get("/admin/doctors"),
    ]);
    setItems(schedules.data);
    setDoctors(doctorRes.data);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([http.get("/admin/schedules"), http.get("/admin/doctors")])
      .then(([schedules, doctorRes]) => {
        if (cancelled) return;
        setItems(schedules.data);
        setDoctors(doctorRes.data);
      })
      .catch((err) => {
        if (!cancelled) dispatch(showToast({ type: "error", message: getErrorMessage(err) }));
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      doctorId: Number(form.doctorId),
      dayOfWeek: Number(form.dayOfWeek),
      session: form.session,
      startTime: form.startTime,
      endTime: form.endTime,
      quota: Number(form.quota),
    };
    try {
      if (editingId) {
        delete payload.doctorId;
        await http.put(`/admin/schedules/${editingId}`, payload);
      } else {
        await http.post("/admin/schedules", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
      dispatch(showToast({ type: "success", message: "Jadwal disimpan." }));
    } catch (err) {
      dispatch(showToast({ type: "error", message: getErrorMessage(err) }));
    }
  }

  async function handleDelete(id) {
    try {
      await http.delete(`/admin/schedules/${id}`);
      await load();
    } catch (err) {
      dispatch(showToast({ type: "error", message: getErrorMessage(err) }));
    }
  }

  return (
    <div>
      <AdminNav />
      <PageHeader eyebrow="Admin" title="Jadwal sesi" />
      <form onSubmit={handleSubmit} className="mf-card mb-6 grid gap-3 p-4 md:grid-cols-3">
        <select required value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })} className="mf-input mt-0">
          <option value="">Dokter</option>
          {doctors.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="mf-input mt-0">
          {DAY_NAMES.map((name, index) => (
            <option key={name} value={index}>{name}</option>
          ))}
        </select>
        <select value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} className="mf-input mt-0">
          <option value="morning">Pagi</option>
          <option value="afternoon">Siang</option>
        </select>
        <input value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="mf-input mt-0" />
        <input value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="mf-input mt-0" />
        <input type="number" value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} className="mf-input mt-0" />
        <Button type="submit">{editingId ? "Perbarui" : "Tambah jadwal"}</Button>
      </form>
      <div className="mf-card overflow-x-auto">
        <table className="mf-table">
          <thead>
            <tr className="text-ink/60">
              <th className="px-4 py-3">Dokter</th>
              <th className="px-4 py-3">Hari</th>
              <th className="px-4 py-3">Sesi</th>
              <th className="px-4 py-3">Jam</th>
              <th className="px-4 py-3">Kuota</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-sand">
                <td className="px-4 py-3">{item.Doctor?.User?.name || item.doctorId}</td>
                <td className="px-4 py-3">{DAY_NAMES[item.dayOfWeek]}</td>
                <td className="px-4 py-3">{sessionLabel(item.session)}</td>
                <td className="px-4 py-3">{item.startTime}–{item.endTime}</td>
                <td className="px-4 py-3">{item.quota}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="mr-3 font-semibold text-primary"
                    onClick={() => {
                      setEditingId(item.id);
                      setForm({
                        doctorId: String(item.doctorId),
                        dayOfWeek: String(item.dayOfWeek),
                        session: item.session,
                        startTime: item.startTime,
                        endTime: item.endTime,
                        quota: String(item.quota),
                      });
                    }}
                  >
                    Ubah
                  </button>
                  <button type="button" className="font-semibold text-danger" onClick={() => handleDelete(item.id)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
