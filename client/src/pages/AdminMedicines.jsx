import { useEffect, useState } from "react";
import { http } from "../api/http";
import { formatFee, getErrorMessage } from "../utils/format";
import { adminSave, toAdminFormData } from "../api/upload";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import Field from "../components/Field";
import ImageField from "../components/ImageField";
import AdminFormCard from "../components/AdminFormCard";
import DataTable from "../components/DataTable";
import RowActions from "../components/RowActions";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";
import { IconPill, IconPlus } from "../components/Icons";

const emptyForm = { name: "", price: "", imgUrl: "" };

export default function AdminMedicines() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);

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
        if (!cancelled) {
          showToast({ type: "error", message: getErrorMessage(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setPhotoFile(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const fields = {
        name: form.name,
        price: Number(form.price),
        imgUrl: form.imgUrl || "",
      };
      const payload = photoFile
        ? toAdminFormData(fields, photoFile)
        : { ...fields, imgUrl: form.imgUrl || null };
      if (editingId) {
        await adminSave("put", `/admin/medicines/${editingId}`, payload);
      } else {
        await adminSave("post", "/admin/medicines", payload);
      }
      resetForm();
      await load();
      showToast({ type: "success", message: "Obat disimpan." });
    } catch (err) {
      showToast({ type: "error", message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await http.delete(`/admin/medicines/${id}`);
      await load();
    } catch (err) {
      showToast({ type: "error", message: getErrorMessage(err) });
    }
  }

  const columns = [
    {
      key: "name",
      header: "Obat",
      primary: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imgUrl ? (
            <img
              src={row.imgUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-sm object-cover ring-1 ring-primary/10"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-mist text-primary/50">
              <IconPill className="h-5 w-5" />
            </span>
          )}
          <p className="font-semibold text-ink">{row.name}</p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Harga",
      align: "right",
      render: (row) => (
        <span className="tabular font-semibold text-ink">
          {formatFee(row.price)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      label: false,
      render: (row) => (
        <RowActions
          name={row.name}
          onEdit={() => {
            setEditingId(row.id);
            setPhotoFile(null);
            setForm({
              name: row.name,
              price: String(row.price),
              imgUrl: row.imgUrl || "",
            });
          }}
          onDelete={() => handleDelete(row.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Farmasi"
        title="Katalog obat"
        description="Daftar obat yang dapat dicantumkan pada ringkasan konsultasi."
      />

      <AdminFormCard
        eyebrow={editingId ? "Ubah data" : "Tambah baru"}
        title={editingId ? "Perbarui obat" : "Obat baru"}
        onSubmit={handleSubmit}
        actions={
          <>
            <Button type="submit" size="lg" loading={saving}>
              {editingId ? null : <IconPlus className="h-3.5 w-3.5" />}
              {saving ? "Menyimpan..." : editingId ? "Perbarui" : "Tambah obat"}
            </Button>
            {editingId ? (
              <Button variant="ghost" size="lg" onClick={resetForm}>
                Batal
              </Button>
            ) : null}
          </>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Nama obat" required>
            {(props) => (
              <input
                {...props}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}
          </Field>
          <Field label="Harga" hint="Dalam rupiah, tanpa titik." required>
            {(props) => (
              <input
                {...props}
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            )}
          </Field>
          <ImageField
            id="medicine-photo"
            label="Foto obat"
            existingUrl={form.imgUrl}
            file={photoFile}
            onFileChange={(nextFile, meta) => {
              setPhotoFile(nextFile);
              if (meta?.cleared) setForm((prev) => ({ ...prev, imgUrl: "" }));
            }}
          />
        </div>
      </AdminFormCard>

      <DataTable
        caption="Katalog obat"
        columns={columns}
        rows={items}
        empty={
          <EmptyState
            icon={IconPill}
            title="Belum ada obat"
            hint="Tambahkan obat melalui formulir di atas."
          />
        }
      />
    </div>
  );
}
