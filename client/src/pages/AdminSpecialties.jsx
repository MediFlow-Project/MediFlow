import { useEffect, useState } from "react";
import { http } from "../api/http";
import { getErrorMessage } from "../utils/format";
import { adminSave, toAdminFormData } from "../api/upload";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import Field from "../components/Field";
import EmptyState from "../components/EmptyState";
import ImageField from "../components/ImageField";
import AdminFormCard from "../components/AdminFormCard";
import DataTable from "../components/DataTable";
import RowActions from "../components/RowActions";
import { useToast } from "../context/ToastContext";
import { IconHeart, IconPlus } from "../components/Icons";

const emptyForm = { name: "", description: "", imgUrl: "" };

export default function AdminSpecialties() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);

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
        description: form.description || "",
        imgUrl: form.imgUrl || "",
      };
      const payload = photoFile
        ? toAdminFormData(fields, photoFile)
        : { ...fields, imgUrl: form.imgUrl || null };
      if (editingId) {
        await adminSave("put", `/admin/specialties/${editingId}`, payload);
      } else {
        await adminSave("post", "/admin/specialties", payload);
      }
      resetForm();
      await load();
      showToast({ type: "success", message: "Spesialisasi disimpan." });
    } catch (err) {
      showToast({ type: "error", message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await http.delete(`/admin/specialties/${id}`);
      await load();
    } catch (err) {
      showToast({ type: "error", message: getErrorMessage(err) });
    }
  }

  const columns = [
    {
      key: "name",
      header: "Poliklinik",
      primary: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.imgUrl ? (
            <img
              src={row.imgUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-primary/10"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mist text-primary/50">
              <IconHeart className="h-5 w-5" />
            </span>
          )}
          <p className="font-semibold text-ink">{row.name}</p>
        </div>
      ),
    },
    {
      key: "description",
      header: "Deskripsi",
      render: (row) => (
        <span className="text-muted">{row.description || "—"}</span>
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
              description: row.description || "",
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
        eyebrow="Master data"
        title="Poliklinik"
        description="Nama, deskripsi, dan foto layanan spesialisasi."
      />

      <AdminFormCard
        eyebrow={editingId ? "Ubah data" : "Tambah baru"}
        title={editingId ? "Perbarui poliklinik" : "Poliklinik baru"}
        onSubmit={handleSubmit}
        actions={
          <>
            <Button type="submit" size="lg" loading={saving}>
              {editingId ? null : <IconPlus className="h-3.5 w-3.5" />}
              {saving ? "Menyimpan..." : editingId ? "Perbarui" : "Tambah poli"}
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
          <Field label="Nama poli" required>
            {(props) => (
              <input
                {...props}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}
          </Field>
          <Field label="Deskripsi" hint="Tampil pada kartu poli di halaman publik.">
            {(props) => (
              <input
                {...props}
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            )}
          </Field>
          <ImageField
            id="specialty-photo"
            label="Foto poliklinik"
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
        caption="Daftar poliklinik"
        columns={columns}
        rows={items}
        empty={
          <EmptyState
            icon={IconHeart}
            title="Belum ada spesialisasi"
            hint="Tambahkan poli melalui formulir di atas."
          />
        }
      />
    </div>
  );
}
