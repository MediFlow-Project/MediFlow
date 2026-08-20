import { useEffect, useState } from "react";
import { http } from "../api/http";
import {
  formatDateId,
  getErrorMessage,
  sessionLabel,
  statusLabel,
} from "../utils/format";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";
import Field from "../components/Field";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";
import { IconCalendar, IconFilter } from "../components/Icons";

const STATUSES = [
  "booked",
  "waiting",
  "called",
  "in_consultation",
  "completed",
  "cancelled",
  "no_show",
];

export default function AdminAppointments() {
  const { showToast } = useToast();
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
        if (!cancelled) {
          showToast({ type: "error", message: getErrorMessage(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const columns = [
    {
      key: "patient",
      header: "Pasien",
      primary: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-ink">{row.patient?.name}</p>
          <p className="tabular text-xs text-muted">
            Nomor {String(row.queueNumber).padStart(2, "0")}
          </p>
        </div>
      ),
    },
    {
      key: "doctor",
      header: "Dokter",
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-ink">{row.doctor?.name}</p>
          <p className="text-xs text-muted">{row.doctor?.specialty?.name}</p>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Jadwal",
      render: (row) => `${formatDateId(row.date)} · ${sessionLabel(row.session)}`,
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Direktorat medis"
        title="Janji temu"
        description="Monitor pendaftaran kunjungan seluruh dokter."
      />

      <form
        className="mf-card mf-rise mb-8 grid gap-4 p-5 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          load(filters).catch((err) =>
            showToast({ type: "error", message: getErrorMessage(err) })
          );
        }}
      >
        <Field label="Status janji">
          {(props) => (
            <select
              {...props}
              className={`${props.className} mt-1.5`}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Semua status</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Tanggal kunjungan">
          {(props) => (
            <input
              {...props}
              type="date"
              className={`${props.className} mt-1.5`}
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />
          )}
        </Field>
        <Field label="Dokter">
          {(props) => (
            <select
              {...props}
              className={`${props.className} mt-1.5`}
              value={filters.doctorId}
              onChange={(e) =>
                setFilters({ ...filters, doctorId: e.target.value })
              }
            >
              <option value="">Semua dokter</option>
              {doctors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Button type="submit" size="lg">
          <IconFilter className="h-3.5 w-3.5" />
          Filter
        </Button>
      </form>

      <DataTable
        caption="Daftar janji temu"
        columns={columns}
        rows={items}
        empty={
          <EmptyState
            icon={IconCalendar}
            title="Tidak ada janji temu"
            hint="Ubah filter status, tanggal, atau dokter."
          />
        }
      />
    </div>
  );
}
