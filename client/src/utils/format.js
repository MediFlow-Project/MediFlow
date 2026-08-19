export const SESSION_LABEL = {
  morning: "Pagi",
  afternoon: "Siang",
};

export const STATUS_LABEL = {
  booked: "Terjadwal",
  waiting: "Menunggu",
  called: "Dipanggil",
  in_consultation: "Konsultasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  no_show: "Tidak hadir",
};

export const INVOICE_LABEL = {
  unpaid: "Belum bayar",
  pending: "Menunggu",
  paid: "Lunas",
  expire: "Kedaluwarsa",
  failed: "Gagal",
};

export const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export function sessionLabel(session) {
  return SESSION_LABEL[session] || session;
}

export function statusLabel(status) {
  return STATUS_LABEL[status] || status;
}

export function invoiceLabel(status) {
  return INVOICE_LABEL[status] || status;
}

export function formatFee(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDateId(dateOnly) {
  if (!dateOnly) return "—";
  const [y, m, d] = String(dateOnly).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(dateOnly) {
  if (!dateOnly) return "—";
  const [y, m, d] = String(dateOnly).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function todayDateOnly() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function homeForRole(role) {
  if (role === "doctor") return "/dokter";
  if (role === "admin") return "/admin/janji";
  if (role === "patient") return "/saya";
  return "/";
}

export function getErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.message ||
    "Terjadi kesalahan. Coba lagi."
  );
}

export function initials(name) {
  if (!name) return "RS";
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function canCancel(status) {
  return status === "booked" || status === "waiting";
}

export function canPayInvoice(status) {
  return ["unpaid", "pending", "expire", "failed"].includes(status);
}

export function queueRoomName(doctorId, date, session) {
  return `queue:${doctorId}:${date}:${session}`;
}
