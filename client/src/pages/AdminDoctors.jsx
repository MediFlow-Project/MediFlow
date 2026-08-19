import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { http } from "../api/http";
import { formatFee, getErrorMessage } from "../utils/format";
import AdminNav from "../components/AdminNav";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { showToast } from "../store/uiSlice";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  specialtyId: "",
  consultationFee: "",
  bio: "",
  imgUrl: "",
};

export default function AdminDoctors() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const [doctors, specs] = await Promise.all([
      http.get("/admin/doctors"),
      http.get("/admin/specialties"),
    ]);
    setItems(doctors.data);
    setSpecialties(specs.data);
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([http.get("/admin/doctors"), http.get("/admin/specialties")])
      .then(([doctors, specs]) => {
        if (cancelled) return;
        setItems(doctors.data);
        setSpecialties(specs.data);
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
      ...form,
      specialtyId: Number(form.specialtyId),
      consultationFee: Number(form.consultationFee),
    };
    try {
      if (editingId) {
        delete payload.password;
        await http.put(`/admin/doctors/${editingId}`, payload);
      } else {
        await http.post("/admin/doctors", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
      dispatch(showToast({ type: "success", message: "Dokter disimpan." }));
    } catch (err) {
      dispatch(showToast({ type: "error", message: getErrorMessage(err) }));
    }
  }

  async function handleDelete(id) {
    try {
      await http.delete(`/admin/doctors/${id}`);
      await load();
    } catch (err) {
      dispatch(showToast({ type: "error", message: getErrorMessage(err) }));
    }
  }

  return (
    <div>
      <AdminNav />
      <PageHeader eyebrow="Admin" title="Dokter" />
      <form onSubmit={handleSubmit} className="mf-card mb-6 grid gap-3 p-4 md:grid-cols-2">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" className="mf-input mt-0" />
        <input required={!editingId} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="mf-input mt-0" />
        {!editingId ? (
          <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className="mf-input mt-0" />
        ) : null}
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telepon" className="mf-input mt-0" />
        <select required value={form.specialtyId} onChange={(e) => setForm({ ...form, specialtyId: e.target.value })} className="mf-input mt-0">
          <option value="">Spesialisasi</option>
          {specialties.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <input required type="number" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} placeholder="Biaya konsul" className="mf-input mt-0" />
        <input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" className="mf-input mt-0 md:col-span-2" />
        <input value={form.imgUrl} onChange={(e) => setForm({ ...form, imgUrl: e.target.value })} placeholder="URL foto" className="mf-input mt-0 md:col-span-2" />
        <Button type="submit">{editingId ? "Perbarui" : "Tambah dokter"}</Button>
      </form>
      <div className="mf-card overflow-x-auto">
        <table className="mf-table">
          <thead>
            <tr className="text-ink/60">
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Poli</th>
              <th className="px-4 py-3">Biaya</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-sand">
                <td className="px-4 py-3">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-ink/60">{item.email}</p>
                </td>
                <td className="px-4 py-3">{item.specialty?.name}</td>
                <td className="px-4 py-3">{formatFee(item.consultationFee)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="mr-3 font-semibold text-primary"
                    onClick={() => {
                      setEditingId(item.id);
                      setForm({
                        name: item.name || "",
                        email: item.email || "",
                        password: "",
                        phone: item.phone || "",
                        specialtyId: String(item.specialtyId || ""),
                        consultationFee: String(item.consultationFee ?? ""),
                        bio: item.bio || "",
                        imgUrl: item.imgUrl || "",
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
