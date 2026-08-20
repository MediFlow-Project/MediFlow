const { formatDate } = require("../../helpers/date");

function addDays(dateOnly, days) {
  const [year, month, day] = String(dateOnly).split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

module.exports = { addDays };
