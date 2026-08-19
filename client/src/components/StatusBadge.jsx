import { statusLabel, invoiceLabel } from "../utils/format";

const APPOINTMENT_TONES = {
  booked: "bg-sand text-ink",
  waiting: "bg-mist text-primary",
  called: "bg-amber-soft text-amber",
  in_consultation: "bg-primary text-white",
  completed: "bg-emerald-50 text-moss",
  cancelled: "bg-sand text-muted",
  no_show: "bg-sand text-muted",
};

const INVOICE_TONES = {
  unpaid: "bg-sand text-ink",
  pending: "bg-amber-soft text-amber",
  paid: "bg-emerald-50 text-moss",
  expire: "bg-sand text-muted",
  failed: "bg-red-50 text-danger",
};

export default function StatusBadge({ status, kind = "appointment" }) {
  if (!status) return null;
  const tones = kind === "invoice" ? INVOICE_TONES : APPOINTMENT_TONES;
  const label = kind === "invoice" ? invoiceLabel(status) : statusLabel(status);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${tones[status] || "bg-sand text-ink"}`}
    >
      {label}
    </span>
  );
}
