import { useEffect, useState } from "react";
import { http } from "../api/http";
import {
  formatDateId,
  formatFee,
  getErrorMessage,
  invoiceLabel,
  sessionLabel,
} from "../utils/format";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";
import Field from "../components/Field";
import DataTable from "../components/DataTable";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";
import { IconFilter, IconReceipt } from "../components/Icons";

const STATUSES = ["unpaid", "pending", "paid", "expire", "failed"];

export default function AdminInvoices() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ status: "", date: "" });

  async function load(next = filters) {
    const { data } = await http.get("/admin/invoices", {
      params: {
        status: next.status || undefined,
        date: next.date || undefined,
      },
    });
    setItems(data);
  }

  useEffect(() => {
    let cancelled = false;
    http
      .get("/admin/invoices")
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
          <p className="tabular text-xs text-muted">Tagihan #{row.id}</p>
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
      render: (row) =>
        row.date
          ? `${formatDateId(row.date)} · ${sessionLabel(row.session)}`
          : "—",
    },
    {
      key: "amount",
      header: "Nominal",
      align: "right",
      render: (row) => (
        <span className="tabular font-semibold text-ink">
          {formatFee(row.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      render: (row) => <StatusBadge kind="invoice" status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Kasir"
        title="Pembayaran"
        description="Monitor status tagihan. Administrasi tidak memproses pembayaran."
      />

      <form
        className="mf-card mf-rise mb-8 grid gap-4 p-5 md:grid-cols-[repeat(2,minmax(0,1fr))_auto] md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          load(filters).catch((err) =>
            showToast({ type: "error", message: getErrorMessage(err) })
          );
        }}
      >
        <Field label="Status pembayaran">
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
                  {invoiceLabel(status)}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Tanggal tagihan">
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
        <Button type="submit" size="lg">
          <IconFilter className="h-3.5 w-3.5" />
          Filter
        </Button>
      </form>

      <DataTable
        caption="Daftar tagihan"
        columns={columns}
        rows={items}
        empty={
          <EmptyState
            icon={IconReceipt}
            title="Tidak ada tagihan"
            hint="Ubah filter status atau tanggal."
          />
        }
      />
    </div>
  );
}
