const { APPOINTMENT_STATUS } = require("./constants");
const { addDays, isValidDateOnly, toDateOnly, todayDateOnly } = require("./date");

const CHAT_DAYS_AFTER_VISIT = 1;

function chatClosesOn(dateOnly) {
  const visitDate = toDateOnly(dateOnly);
  if (!isValidDateOnly(visitDate)) return null;
  return addDays(visitDate, CHAT_DAYS_AFTER_VISIT);
}

function isChatWritable(appointment, today = todayDateOnly()) {
  if (!appointment || appointment.status !== APPOINTMENT_STATUS.COMPLETED) return false;
  const closesOn = chatClosesOn(appointment.date);
  if (!closesOn) return false;
  return today <= closesOn;
}

function chatWriteError(appointment, today = todayDateOnly()) {
  if (isChatWritable(appointment, today)) return null;
  if (appointment?.status === APPOINTMENT_STATUS.COMPLETED) {
    return "Chat sudah ditutup. Percakapan hanya sampai H+1 setelah konsultasi.";
  }
  return "Chat dibuka setelah konsultasi selesai.";
}

module.exports = {
  CHAT_DAYS_AFTER_VISIT,
  chatClosesOn,
  isChatWritable,
  chatWriteError,
};
