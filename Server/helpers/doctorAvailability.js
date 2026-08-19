const { Doctor, Specialty, Schedule, User } = require("../models");
const { remainingQuota } = require("./quota");
const { todayDateOnly, dayOfWeekFromDate, formatDate } = require("./date");

const LOOKAHEAD_DAYS = 7;

async function getAvailableDoctors() {
  const doctors = await Doctor.findAll({
    include: [
      { model: User, attributes: ["id", "name"] },
      { model: Specialty, attributes: ["id", "name"] },
      { model: Schedule },
    ],
  });

  const today = todayDateOnly();
  const result = [];

  for (const doctor of doctors) {
    const doctorName = doctor.User?.name;
    const specialtyName = doctor.Specialty?.name;
    const schedules = doctor.Schedules || [];
    if (!doctorName || !specialtyName || !schedules.length) continue;

    const sessions = [];
    for (let offset = 0; offset < LOOKAHEAD_DAYS; offset += 1) {
      const dateObj = new Date(`${today}T00:00:00`);
      dateObj.setDate(dateObj.getDate() + offset);
      const dateStr = formatDate(dateObj);
      const dayOfWeek = dayOfWeekFromDate(dateStr);

      for (const schedule of schedules) {
        if (Number(schedule.dayOfWeek) !== dayOfWeek) continue;
        const remaining = await remainingQuota(
          doctor.id,
          dateStr,
          schedule.session,
          schedule.quota
        );
        if (remaining <= 0) continue;
        sessions.push({
          date: dateStr,
          session: schedule.session,
          remaining,
        });
      }
    }

    if (!sessions.length) continue;

    result.push({
      doctorId: doctor.id,
      doctorName,
      specialtyName,
      consultationFee: doctor.consultationFee,
      imgUrl: doctor.imgUrl,
      sessions,
    });
  }

  return result;
}

function toPublicRecommendation(raw, availableDoctors) {
  const doctor = availableDoctors.find(
    (item) => Number(item.doctorId) === Number(raw.doctorId)
  );
  if (!doctor) return null;

  const next = raw.nextSession || {};
  const session = doctor.sessions.find(
    (item) =>
      item.date === next.date &&
      (next.session === "morning" || next.session === "afternoon") &&
      item.session === next.session
  );
  if (!session) return null;

  const reason = typeof raw.reason === "string" ? raw.reason.trim() : "";

  return {
    doctorId: doctor.doctorId,
    doctorName: doctor.doctorName,
    specialtyName: doctor.specialtyName,
    imgUrl: doctor.imgUrl,
    reason,
    nextSession: {
      date: session.date,
      session: session.session,
    },
  };
}

module.exports = { getAvailableDoctors, toPublicRecommendation };
