const { Op } = require("sequelize");
const { Appointment } = require("../models");
const { APPOINTMENT_STATUS } = require("./constants");
const { todayDateOnly } = require("./date");

async function getDashboardCounts(referenceDate) {
  const date = referenceDate || todayDateOnly();
  const bookingsToday = await Appointment.count({
    where: {
      date,
      status: { [Op.ne]: APPOINTMENT_STATUS.CANCELLED },
    },
  });
  const activeQueues = await Appointment.count({
    where: {
      status: {
        [Op.in]: [
          APPOINTMENT_STATUS.WAITING,
          APPOINTMENT_STATUS.CALLED,
          APPOINTMENT_STATUS.IN_CONSULTATION,
        ],
      },
    },
  });
  return { bookingsToday, activeQueues };
}

module.exports = { getDashboardCounts };
