import { statusLabel, invoiceLabel } from "../utils/format";

const APPOINTMENT_TONES = {
  booked: "bg-mist text-primary ring-primary/10",
  waiting: "bg-amber-soft text-bronze ring-gold/30",
  called: "bg-gold text-primary-dark ring-amber/40",
  in_consultation: "bg-primary text-white ring-primary/30",
  completed: "bg-moss/10 text-moss ring-moss/20",
  cancelled: "bg-sand text-muted ring-line",
  no_show: "bg-sand text-muted ring-line",
};

const INVOICE_TONES = {
  unpaid: "bg-mist text-primary ring-primary/10",
  pending: "bg-amber-soft text-bronze ring-gold/30",
  paid: "bg-moss/10 text-moss ring-moss/20",
  expire: "bg-sand text-muted ring-line",
  failed: "bg-clay/10 text-danger ring-danger/20",
};

const PULSING = ["called", "in_consultation"];

export default function StatusBadge({ status, kind = "appointment" }) {
  if (!status) return null;
  const tones = kind === "invoice" ? INVOICE_TONES : APPOINTMENT_TONES;
  const label = kind === "invoice" ? invoiceLabel(status) : statusLabel(status);
  const isLive = kind === "appointment" && PULSING.includes(status);

  return (
    <span
      className={`mf-chip ring-1 ${tones[status] || "bg-sand text-ink ring-line"}`}
    >
      {isLive ? (
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-current" aria-hidden="true" />
      ) : null}
      {label}
    </span>
  );
}
