const { Op } = require("sequelize");
const { Specialty, Doctor, User, Schedule, Appointment } = require("../models");
const HttpError = require("../helpers/HttpError");
const { formatDate, todayDateOnly, dayOfWeekFromDate, toDateOnly } = require("../helpers/date");
const { ACTIVE_FOR_QUOTA } = require("../helpers/constants");

const UPCOMING_DAYS = 14;

function addDays(dateOnly, days) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function serializeDoctor(doctor) {
  return {
    id: doctor.id,
    name: doctor.User?.name,
    consultationFee: doctor.consultationFee,
    bio: doctor.bio,
    imgUrl: doctor.imgUrl,
  };
}

function buildCalendar(doctors, usedMap, today) {
  const calendar = [];
  for (let offset = 0; offset < UPCOMING_DAYS; offset += 1) {
    const date = addDays(today, offset);
    const dayOfWeek = dayOfWeekFromDate(date);
    const sessions = { morning: null, afternoon: null };

    for (const doctor of doctors) {
      for (const schedule of doctor.Schedules || []) {
        if (Number(schedule.dayOfWeek) !== dayOfWeek) continue;
        const session = schedule.session;
        if (session !== "morning" && session !== "afternoon") continue;
        const used = usedMap[`${doctor.id}:${date}:${session}`] || 0;
        sessions[session] = {
          doctorId: doctor.id,
          doctorName: doctor.User?.name,
          imgUrl: doctor.imgUrl,
          consultationFee: doctor.consultationFee,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          quota: schedule.quota,
          remainingQuota: Math.max(0, schedule.quota - used),
        };
      }
    }

    if (sessions.morning || sessions.afternoon) {
      calendar.push({ date, dayOfWeek, sessions });
    }
  }
  return calendar;
}

class SpecialtyController {
  static async list(req, res, next) {
    try {
      const specialties = await Specialty.findAll({
        include: [{ model: Doctor, attributes: ["id"] }],
        order: [["name", "ASC"]],
      });

      res.json(
        specialties.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          imgUrl: s.imgUrl,
          doctorCount: s.Doctors?.length || 0,
        }))
      );
    } catch (err) {
      next(err);
    }
  }

  static async detail(req, res, next) {
    try {
      const specialty = await Specialty.findByPk(req.params.id, {
        include: [
          {
            model: Doctor,
            include: [
              { model: User, attributes: ["id", "name"] },
              { model: Schedule },
            ],
          },
        ],
      });
      if (!specialty) throw new HttpError(404, "Spesialisasi tidak ditemukan");

      const doctors = specialty.Doctors || [];
      const doctorIds = doctors.map((doctor) => doctor.id);
      const today = todayDateOnly();
      const usedMap = {};

      if (doctorIds.length) {
        const appointments = await Appointment.findAll({
          where: {
            doctorId: { [Op.in]: doctorIds },
            date: { [Op.between]: [today, addDays(today, UPCOMING_DAYS - 1)] },
            status: { [Op.in]: ACTIVE_FOR_QUOTA },
          },
          attributes: ["doctorId", "date", "session"],
        });
        for (const appointment of appointments || []) {
          const key = `${appointment.doctorId}:${toDateOnly(appointment.date)}:${appointment.session}`;
          usedMap[key] = (usedMap[key] || 0) + 1;
        }
      }

      res.json({
        id: specialty.id,
        name: specialty.name,
        description: specialty.description,
        imgUrl: specialty.imgUrl,
        doctors: doctors.map(serializeDoctor),
        calendar: buildCalendar(doctors, usedMap, today),
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SpecialtyController;
