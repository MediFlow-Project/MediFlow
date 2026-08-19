import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { http } from "../api/http";
import { formatFee, getErrorMessage } from "../utils/format";
import AdminNav from "../components/AdminNav";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import { showToast } from "../store/uiSlice";

const emptyForm = { name: "", price: "", imgUrl: "" };

export default function AdminMedicines() {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const { data } = await http.get("/admin/medicines");
    setItems(data);
  }

  useEffect(() => {
    let cancelled = false;
    http
      .get("/admin/medicines")
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
    const payload = {
      name: form.name,
      price: Number(form.price),
      imgUrl: form.imgUrl || null,
    };
    try {
      if (editingId) {
        await http.put(`/admin/medicines/${editingId}`, payload);
      } else {
        await http.post("/admin/medicines", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
      dispatch(showToast({ type: "success", message: "Obat disimpan." }));
    } catch (err) {
      dispatch(showToast({ type: "error", message: getErrorMessage(err) }));
    }
  }

  async function handleDelete(id) {
    try {
      await http.delete(`/admin/medicines/${id}`);
      await load();
    } catch (err) {
      dispatch(showToast({ type: "error", message: getErrorMessage(err) }));
    }
  }

  return (
    <div>
      <AdminNav />
      <PageHeader eyebrow="Admin" title="Katalog obat" />
      <form onSubmit={handleSubmit} className="mf-card mb-6 grid gap-3 p-4 md:grid-cols-[1fr_10rem_1fr_auto]">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama obat" className="mf-input mt-0" />
        <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Harga" className="mf-input mt-0" />
        <input value={form.imgUrl} onChange={(e) => setForm({ ...form, imgUrl: e.target.value })} placeholder="URL foto obat" className="mf-input mt-0" />
        <Button type="submit">{editingId ? "Perbarui" : "Tambah"}</Button>
      </form>
      <div className="mf-card overflow-x-auto">
        <table className="mf-table">
          <thead>
            <tr className="text-ink/60">
              <th className="px-4 py-3">Foto</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Harga</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-sand">
                <td className="px-4 py-3">
                  {item.imgUrl ? (
                    <img src={item.imgUrl} alt={item.name} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold">{item.name}</td>
                <td className="px-4 py-3">{formatFee(item.price)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="mr-3 font-semibold text-primary"
                    onClick={() => {
                      setEditingId(item.id);
                      setForm({ name: item.name, price: String(item.price), imgUrl: item.imgUrl || "" });
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
