function formatDate(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateOnly(value) {
  if (!value) return value;
  if (typeof value === "string") return value.slice(0, 10);
  return formatDate(value);
}

function todayDateOnly() {
  return formatDate(new Date());
}

function dayOfWeekFromDate(dateOnly) {
  const [year, month, day] = String(dateOnly).split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

function isPastDate(dateOnly) {
  return toDateOnly(dateOnly) < todayDateOnly();
}

function isValidDateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

module.exports = {
  formatDate,
  toDateOnly,
  todayDateOnly,
  dayOfWeekFromDate,
  isPastDate,
  isValidDateOnly,
};
