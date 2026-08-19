const { Op } = require("sequelize");
const { Doctor, User, Specialty, Schedule, Appointment } = require("../models");
const HttpError = require("../helpers/HttpError");
const { formatDate } = require("../helpers/date");
const { ACTIVE_FOR_QUOTA } = require("../helpers/constants");

const UPCOMING_DAYS = 14;

function addDays(dateOnly, days) {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

class DoctorController {
  static async list(req, res, next) {
    try {
      const { specialtyId, name } = req.query;
      const doctorWhere = {};
      const userInclude = {
        model: User,
        attributes: ["id", "name", "email"],
      };

      if (specialtyId) doctorWhere.specialtyId = specialtyId;
      if (name) userInclude.where = { name: { [Op.iLike]: `%${name}%` } };

      const doctors = await Doctor.findAll({
        where: doctorWhere,
        include: [
          userInclude,
          { model: Specialty, attributes: ["id", "name"] },
        ],
        order: [[User, "name", "ASC"]],
      });

      res.json(
        doctors.map((d) => ({
          id: d.id,
          name: d.User?.name,
          bio: d.bio,
          consultationFee: d.consultationFee,
          imgUrl: d.imgUrl,
          specialty: d.Specialty
            ? { id: d.Specialty.id, name: d.Specialty.name }
            : null,
        }))
      );
    } catch (err) {
      next(err);
    }
  }

  static async detail(req, res, next) {
    try {
      const doctor = await Doctor.findByPk(req.params.id, {
        include: [
          { model: User, attributes: ["id", "name", "email", "phone"] },
          { model: Specialty, attributes: ["id", "name", "description"] },
          { model: Schedule },
        ],
      });
      if (!doctor) throw new HttpError(404, "Dokter tidak ditemukan");

      const today = formatDate(new Date());
      const end = addDays(today, UPCOMING_DAYS - 1);
      const appointments = await Appointment.findAll({
        where: {
          doctorId: doctor.id,
          date: { [Op.between]: [today, end] },
          status: { [Op.in]: ACTIVE_FOR_QUOTA },
        },
        attributes: ["date", "session"],
      });

      const usedMap = {};
      for (const a of appointments) {
        const key = `${a.date}:${a.session}`;
        usedMap[key] = (usedMap[key] || 0) + 1;
      }

      const upcomingSessions = [];
      for (let i = 0; i < UPCOMING_DAYS; i++) {
        const date = addDays(today, i);
        const [year, month, day] = date.split("-").map(Number);
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        const daySchedules = (doctor.Schedules || []).filter(
          (s) => s.dayOfWeek === dayOfWeek
        );
        for (const sch of daySchedules) {
          const used = usedMap[`${date}:${sch.session}`] || 0;
          upcomingSessions.push({
            date,
            session: sch.session,
            dayOfWeek,
            startTime: sch.startTime,
            endTime: sch.endTime,
            quota: sch.quota,
            remainingQuota: Math.max(0, sch.quota - used),
          });
        }
      }

      res.json({
        id: doctor.id,
        name: doctor.User?.name,
        email: doctor.User?.email,
        phone: doctor.User?.phone,
        bio: doctor.bio,
        imgUrl: doctor.imgUrl,
        consultationFee: doctor.consultationFee,
        specialty: doctor.Specialty
          ? {
              id: doctor.Specialty.id,
              name: doctor.Specialty.name,
              description: doctor.Specialty.description,
            }
          : null,
        schedules: (doctor.Schedules || [])
          .slice()
          .sort(
            (a, b) =>
              a.dayOfWeek - b.dayOfWeek || String(a.session).localeCompare(String(b.session))
          )
          .map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          session: s.session,
          startTime: s.startTime,
          endTime: s.endTime,
          quota: s.quota,
        })),
        upcomingSessions,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DoctorController;
