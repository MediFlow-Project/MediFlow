import { useEffect, useState } from "react";
import { http } from "../api/http";
import { DAY_NAMES, getErrorMessage, sessionLabel } from "../utils/format";
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import Field from "../components/Field";
import AdminFormCard from "../components/AdminFormCard";
import DataTable from "../components/DataTable";
import RowActions from "../components/RowActions";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";
import { IconClock, IconPlus } from "../components/Icons";

const emptyForm = {
  doctorId: "",
  dayOfWeek: "1",
  session: "morning",
  startTime: "08:00",
  endTime: "12:00",
  quota: "10",
};

export default function AdminSchedules() {
  const { showToast } = useToast();
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
  }

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
      resetForm();
      await load();
      showToast({ type: "success", message: "Jadwal disimpan." });
    } catch (err) {
      showToast({ type: "error", message: getErrorMessage(err) });
    }
  }

  async function handleDelete(id) {
    try {
      await http.delete(`/admin/schedules/${id}`);
      await load();
    } catch (err) {
      showToast({ type: "error", message: getErrorMessage(err) });
    }
  }

  const columns = [
    {
      key: "doctor",
      header: "Dokter",
      primary: true,
      render: (row) => (
        <p className="font-semibold text-ink">
          {row.Doctor?.User?.name || `Dokter #${row.doctorId}`}
        </p>
      ),
    },
    { key: "day", header: "Hari", render: (row) => DAY_NAMES[row.dayOfWeek] },
    {
      key: "session",
      header: "Sesi",
      render: (row) => (
        <span className="mf-chip bg-gold-soft text-bronze ring-1 ring-gold/30">
          {sessionLabel(row.session)}
        </span>
      ),
    },
    {
      key: "time",
      header: "Jam",
      render: (row) => (
        <span className="tabular">
          {row.startTime}–{row.endTime}
        </span>
      ),
    },
    {
      key: "quota",
      header: "Kuota",
      align: "right",
      render: (row) => (
        <span className="tabular font-semibold text-ink">{row.quota}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      label: false,
      render: (row) => (
        <RowActions
          name={`jadwal ${DAY_NAMES[row.dayOfWeek]}`}
          onEdit={() => {
            setEditingId(row.id);
            setForm({
              doctorId: String(row.doctorId),
              dayOfWeek: String(row.dayOfWeek),
              session: row.session,
              startTime: row.startTime,
              endTime: row.endTime,
              quota: String(row.quota),
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
        title="Jadwal sesi"
        description="Praktik pagi dan siang per dokter, Senin sampai Sabtu."
      />

      <AdminFormCard
        eyebrow={editingId ? "Ubah data" : "Tambah baru"}
        title={editingId ? "Perbarui jadwal" : "Jadwal baru"}
        hint={
          editingId
            ? "Dokter tidak dapat diubah pada jadwal yang sudah tersimpan."
            : undefined
        }
        onSubmit={handleSubmit}
        actions={
          <>
            <Button type="submit" size="lg">
              {editingId ? (
                <IconClock className="h-3.5 w-3.5" />
              ) : (
                <IconPlus className="h-3.5 w-3.5" />
              )}
              {editingId ? "Perbarui" : "Tambah jadwal"}
            </Button>
            {editingId ? (
              <Button variant="ghost" size="lg" onClick={resetForm}>
                Batal
              </Button>
            ) : null}
          </>
        }
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Dokter" required>
            {(props) => (
              <select
                {...props}
                disabled={Boolean(editingId)}
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              >
                <option value="">Pilih dokter</option>
                {doctors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Hari praktik">
            {(props) => (
              <select
                {...props}
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
              >
                {DAY_NAMES.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Sesi">
            {(props) => (
              <select
                {...props}
                value={form.session}
                onChange={(e) => setForm({ ...form, session: e.target.value })}
              >
                <option value="morning">Pagi</option>
                <option value="afternoon">Siang</option>
              </select>
            )}
          </Field>
          <Field label="Jam mulai" hint="Format 24 jam, contoh 08:00.">
            {(props) => (
              <input
                {...props}
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            )}
          </Field>
          <Field label="Jam selesai" hint="Format 24 jam, contoh 12:00.">
            {(props) => (
              <input
                {...props}
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            )}
          </Field>
          <Field label="Kuota pasien">
            {(props) => (
              <input
                {...props}
                type="number"
                min="1"
                value={form.quota}
                onChange={(e) => setForm({ ...form, quota: e.target.value })}
              />
            )}
          </Field>
        </div>
      </AdminFormCard>

      <DataTable
        caption="Daftar jadwal praktik"
        columns={columns}
        rows={items}
        empty={
          <EmptyState
            icon={IconClock}
            title="Belum ada jadwal"
            hint="Tambahkan sesi praktik melalui formulir di atas."
          />
        }
      />
    </div>
  );
}
