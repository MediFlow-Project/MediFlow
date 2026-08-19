const db = require("../models");

const LOOKAHEAD_DAYS = 7;

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function matchesDayOfWeek(scheduleDay, date) {
  const jsDay = date.getDay();
  const n = Number(scheduleDay);
  if (n === jsDay) return true;
  const isoDay = jsDay === 0 ? 7 : jsDay;
  return n === isoDay;
}

async function getAvailableDoctors() {
  const { Doctor, Specialty, Schedule, Appointment, User } = db;
  if (!Doctor || !Specialty || !Schedule) {
    return [];
  }

  const doctors = await Doctor.findAll();
  const specialties = await Specialty.findAll();
  const schedules = await Schedule.findAll();
  const users = User ? await User.findAll() : [];

  const specialtyById = new Map(specialties.map((row) => [row.id, row]));
  const userById = new Map(users.map((row) => [row.id, row]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = [];

  for (const doctor of doctors) {
    const specialty = specialtyById.get(doctor.specialtyId);
    const user = userById.get(doctor.userId);
    if (!specialty || !user?.name) continue;

    const doctorSchedules = schedules.filter((row) => row.doctorId === doctor.id);
    const sessions = [];

    for (let offset = 0; offset < LOOKAHEAD_DAYS; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const dateStr = toDateString(date);

      for (const schedule of doctorSchedules) {
        if (!matchesDayOfWeek(schedule.dayOfWeek, date)) continue;

        let booked = 0;
        if (Appointment) {
          booked = await Appointment.count({
            where: {
              doctorId: doctor.id,
              date: dateStr,
              session: schedule.session,
              status: { [db.Sequelize.Op.ne]: "cancelled" },
            },
          });
        }

        const remaining = Number(schedule.quota) - booked;
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
      doctorName: user.name,
      specialtyName: specialty.name,
      consultationFee: doctor.consultationFee,
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
    (item) => item.date === next.date && (next.session === "morning" || next.session === "afternoon") && item.session === next.session
  );
  if (!session) return null;

  const reason = typeof raw.reason === "string" ? raw.reason.trim() : "";

  return {
    doctorId: doctor.doctorId,
    doctorName: doctor.doctorName,
    specialtyName: doctor.specialtyName,
    reason,
    nextSession: {
      date: session.date,
      session: session.session,
    },
  };
}

module.exports = { getAvailableDoctors, toPublicRecommendation };
