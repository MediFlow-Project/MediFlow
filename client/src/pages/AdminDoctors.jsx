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
import Avatar from "../components/Avatar";
import { useToast } from "../context/ToastContext";
import { IconPlus, IconStethoscope } from "../components/Icons";

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
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);

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
        email: form.email,
        phone: form.phone || "",
        specialtyId: Number(form.specialtyId),
        consultationFee: Number(form.consultationFee),
        bio: form.bio || "",
        imgUrl: form.imgUrl || "",
      };
      if (!editingId) fields.password = form.password;
      const payload = photoFile
        ? toAdminFormData(fields, photoFile)
        : { ...fields, imgUrl: form.imgUrl || null };
      if (editingId) {
        await adminSave("put", `/admin/doctors/${editingId}`, payload);
      } else {
        await adminSave("post", "/admin/doctors", payload);
      }
      resetForm();
      await load();
      showToast({ type: "success", message: "Dokter disimpan." });
    } catch (err) {
      showToast({ type: "error", message: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await http.delete(`/admin/doctors/${id}`);
      await load();
    } catch (err) {
      showToast({ type: "error", message: getErrorMessage(err) });
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setPhotoFile(null);
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
  }

  const columns = [
    {
      key: "name",
      header: "Nama",
      primary: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.imgUrl} name={row.name} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-ink">{row.name}</p>
            <p className="truncate text-xs text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: "specialty", header: "Poli", render: (row) => row.specialty?.name },
    {
      key: "fee",
      header: "Biaya",
      align: "right",
      render: (row) => (
        <span className="tabular font-semibold text-ink">
          {formatFee(row.consultationFee)}
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
          onEdit={() => startEdit(row)}
          onDelete={() => handleDelete(row.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Master data"
        title="Direktori dokter"
        description="Akun staf medis, poli, biaya konsultasi, dan foto."
      />

      <AdminFormCard
        eyebrow={editingId ? "Ubah data" : "Tambah baru"}
        title={editingId ? "Perbarui dokter" : "Dokter baru"}
        hint={
          editingId
            ? "Password tidak berubah kecuali diatur ulang oleh administrasi."
            : "Akun dokter dibuat langsung dengan email dan password awal."
        }
        onSubmit={handleSubmit}
        actions={
          <>
            <Button type="submit" size="lg" loading={saving}>
              {editingId ? null : <IconPlus className="h-3.5 w-3.5" />}
              {saving ? "Menyimpan..." : editingId ? "Perbarui" : "Tambah dokter"}
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
          <Field label="Nama dokter" required>
            {(props) => (
              <input
                {...props}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            )}
          </Field>
          <Field label="Email" required={!editingId}>
            {(props) => (
              <input
                {...props}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            )}
          </Field>
          {!editingId ? (
            <Field label="Password akun" hint="Minimal 6 karakter." required>
              {(props) => (
                <input
                  {...props}
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              )}
            </Field>
          ) : null}
          <Field label="Nomor telepon">
            {(props) => (
              <input
                {...props}
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            )}
          </Field>
          <Field label="Poliklinik" required>
            {(props) => (
              <select
                {...props}
                value={form.specialtyId}
                onChange={(e) =>
                  setForm({ ...form, specialtyId: e.target.value })
                }
              >
                <option value="">Pilih spesialisasi</option>
                {specialties.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Biaya konsultasi" hint="Dalam rupiah, tanpa titik." required>
            {(props) => (
              <input
                {...props}
                type="number"
                min="0"
                value={form.consultationFee}
                onChange={(e) =>
                  setForm({ ...form, consultationFee: e.target.value })
                }
              />
            )}
          </Field>
          <Field label="Bio singkat" className="md:col-span-2">
            {(props) => (
              <input
                {...props}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            )}
          </Field>
          <ImageField
            id="doctor-photo"
            label="Foto dokter"
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
        caption="Daftar dokter"
        columns={columns}
        rows={items}
        empty={
          <EmptyState
            icon={IconStethoscope}
            title="Belum ada dokter"
            hint="Tambahkan akun staf medis melalui formulir di atas."
          />
        }
      />
    </div>
  );
}
