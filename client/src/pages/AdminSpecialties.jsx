import { useEffect, useState } from "react";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/format";
import AdminNav from "../components/AdminNav";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { showToast } from "../store/uiSlice";
import { useDispatch } from "react-redux";

const emptyForm = { name: "", description: "" };

export default function AdminSpecialties() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const { data } = await http.get("/admin/specialties");
    setItems(data);
  }

  useEffect(() => {
    let cancelled = false;
    http
      .get("/admin/specialties")
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

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      if (editingId) {
        await http.put(`/admin/specialties/${editingId}`, form);
      } else {
        await http.post("/admin/specialties", form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
      dispatch(showToast({ type: "success", message: "Spesialisasi disimpan." }));
    } catch (err) {
      dispatch(showToast({ type: "error", message: getErrorMessage(err) }));
    }
  }

  async function handleDelete(id) {
    try {
      await http.delete(`/admin/specialties/${id}`);
      await load();
    } catch (err) {
      dispatch(showToast({ type: "error", message: getErrorMessage(err) }));
    }
  }

  return (
    <div>
      <AdminNav />
      <PageHeader eyebrow="Admin" title="Spesialisasi" />
      <form onSubmit={handleSubmit} className="mf-card mb-6 grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]">
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nama poli"
          className="mf-input mt-0"
        />
        <input
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Deskripsi"
          className="mf-input mt-0"
        />
        <Button type="submit">{editingId ? "Perbarui" : "Tambah"}</Button>
      </form>
      {items.length === 0 ? (
        <EmptyState title="Belum ada spesialisasi" />
      ) : (
        <div className="mf-card overflow-x-auto">
          <table className="mf-table">
            <thead className="text-ink/60">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Deskripsi</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-sand">
                  <td className="px-4 py-3 font-semibold">{item.name}</td>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="mr-3 font-semibold text-primary"
                      onClick={() => {
                        setEditingId(item.id);
                        setForm({ name: item.name, description: item.description || "" });
                      }}
                    >
                      Ubah
                    </button>
                    <button type="button" className="font-semibold text-danger" onClick={() => handleDelete(item.id)}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
