const { APPOINTMENT_STATUS } = require("./constants");

function isChatWritable(appointment) {
  return Boolean(appointment && appointment.status === APPOINTMENT_STATUS.COMPLETED);
}

function chatWriteError(appointment) {
  if (isChatWritable(appointment)) return null;
  if (
    appointment?.status === APPOINTMENT_STATUS.CANCELLED ||
    appointment?.status === APPOINTMENT_STATUS.NO_SHOW
  ) {
    return "Chat tidak tersedia untuk janji ini.";
  }
  return "Chat dibuka setelah konsultasi selesai.";
}

module.exports = {
  isChatWritable,
  chatWriteError,
};
