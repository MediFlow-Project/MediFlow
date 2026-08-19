const { Op } = require("sequelize");
const { Appointment, User } = require("../models");
const { maskPatientName } = require("./maskName");
const { toDateOnly } = require("./date");
const { BUSY_STATUSES, BOARD_STATUSES } = require("./constants");

async function buildQueuePayload(doctorId, date, session, { includeAppointmentId = false } = {}) {
  const dateOnly = toDateOnly(date);
  const appointments = await Appointment.findAll({
    where: {
      doctorId,
      date: dateOnly,
      session,
      status: { [Op.in]: BOARD_STATUSES },
    },
    include: [{ model: User, as: "Patient", attributes: ["id", "name"] }],
    order: [["queueNumber", "ASC"]],
  });

  const serving = appointments.find((a) => BUSY_STATUSES.includes(a.status));
  const nowServing = serving ? serving.queueNumber : null;

  const items = appointments.map((a) => {
    const item = {
      queueNumber: a.queueNumber,
      patientNameMasked: maskPatientName(a.Patient?.name),
      status: a.status,
    };
    if (includeAppointmentId) item.appointmentId = a.id;
    return item;
  });

  return {
    doctorId: Number(doctorId),
    date: dateOnly,
    session,
    nowServing,
    items,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { buildQueuePayload };
