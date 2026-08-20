const { Specialty, Doctor, User, Schedule, Appointment } = require("../models");
const { sequelize } = require("../models");
const HttpError = require("../helpers/HttpError");
const { hashPassword } = require("../helpers/bcrypt");
const { SESSIONS, ROLES } = require("../helpers/constants");
const { isValidDateOnly, toDateOnly } = require("../helpers/date");
const { resolveRequestImgUrl } = require("../helpers/requestImage");

class AdminSpecialtyController {
  static async list(req, res, next) {
    try {
      const specialties = await Specialty.findAll({ order: [["name", "ASC"]] });
      res.json(specialties);
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const { name, description } = req.body;
      if (!name) throw new HttpError(400, "Nama spesialisasi wajib diisi");
      const specialty = await Specialty.create({
        name: String(name).trim(),
        description,
        imgUrl: (await resolveRequestImgUrl(req, "specialties", null)) ?? null,
      });
      res.status(201).json(specialty);
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const specialty = await Specialty.findByPk(req.params.id);
      if (!specialty) throw new HttpError(404, "Spesialisasi tidak ditemukan");
      const { name, description } = req.body;
      const payload = {
        name: name !== undefined ? String(name).trim() : specialty.name,
        description: description !== undefined ? description : specialty.description,
        imgUrl: await resolveRequestImgUrl(req, "specialties", specialty.imgUrl),
      };
      await specialty.update(payload);
      res.json(specialty);
    } catch (err) {
      next(err);
    }
  }

  static async destroy(req, res, next) {
    try {
      const specialty = await Specialty.findByPk(req.params.id);
      if (!specialty) throw new HttpError(404, "Spesialisasi tidak ditemukan");
      const used = await Doctor.count({ where: { specialtyId: specialty.id } });
      if (used > 0) {
        throw new HttpError(409, "Spesialisasi masih dipakai dokter");
      }
      await specialty.destroy();
      res.json({ message: "Spesialisasi dihapus" });
    } catch (err) {
      next(err);
    }
  }
}

function serializeAdminDoctor(doctor) {
  return {
    id: doctor.id,
    userId: doctor.userId,
    name: doctor.User?.name,
    email: doctor.User?.email,
    phone: doctor.User?.phone,
    specialtyId: doctor.specialtyId,
    specialty: doctor.Specialty
      ? { id: doctor.Specialty.id, name: doctor.Specialty.name }
      : null,
    consultationFee: doctor.consultationFee,
    bio: doctor.bio,
    imgUrl: doctor.imgUrl,
  };
}

class AdminDoctorController {
  static async list(req, res, next) {
    try {
      const doctors = await Doctor.findAll({
        include: [
          { model: User, attributes: ["id", "name", "email", "phone"] },
          { model: Specialty, attributes: ["id", "name"] },
        ],
        order: [["id", "ASC"]],
      });
      res.json(doctors.map(serializeAdminDoctor));
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const { name, email, password, phone, specialtyId, consultationFee, bio } = req.body;
      if (!name || !email || !password || !specialtyId || consultationFee === undefined) {
        throw new HttpError(
          400,
          "name, email, password, specialtyId, dan consultationFee wajib diisi"
        );
      }

      const specialty = await Specialty.findByPk(specialtyId);
      if (!specialty) throw new HttpError(400, "Spesialisasi tidak ditemukan");
      const nextImgUrl = (await resolveRequestImgUrl(req, "doctors", null)) ?? null;

      const doctor = await sequelize.transaction(async (t) => {
        const user = await User.create(
          {
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            passwordHash: hashPassword(password),
            phone: phone ? String(phone).trim() : null,
            role: ROLES.DOCTOR,
          },
          { transaction: t }
        );
        return Doctor.create(
          {
            userId: user.id,
            specialtyId: Number(specialtyId),
            consultationFee: Number(consultationFee),
            bio,
            imgUrl: nextImgUrl,
          },
          { transaction: t }
        );
      });

      const created = await Doctor.findByPk(doctor.id, {
        include: [
          { model: User, attributes: ["id", "name", "email", "phone"] },
          { model: Specialty, attributes: ["id", "name"] },
        ],
      });
      res.status(201).json(serializeAdminDoctor(created));
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const doctor = await Doctor.findByPk(req.params.id, { include: [User] });
      if (!doctor) throw new HttpError(404, "Dokter tidak ditemukan");

      const { name, phone, specialtyId, consultationFee, bio, email } = req.body;
      const nextImgUrl = await resolveRequestImgUrl(req, "doctors", doctor.imgUrl);
      await sequelize.transaction(async (t) => {
        if (name || phone !== undefined || email) {
          await doctor.User.update(
            {
              name: name !== undefined ? String(name).trim() : doctor.User.name,
              phone: phone !== undefined ? phone : doctor.User.phone,
              email: email !== undefined ? String(email).trim().toLowerCase() : doctor.User.email,
            },
            { transaction: t }
          );
        }
        await doctor.update(
          {
            specialtyId: specialtyId !== undefined ? Number(specialtyId) : doctor.specialtyId,
            consultationFee:
              consultationFee !== undefined ? Number(consultationFee) : doctor.consultationFee,
            bio: bio !== undefined ? bio : doctor.bio,
            imgUrl: nextImgUrl,
          },
          { transaction: t }
        );
      });

      const updated = await Doctor.findByPk(doctor.id, {
        include: [
          { model: User, attributes: ["id", "name", "email", "phone"] },
          { model: Specialty, attributes: ["id", "name"] },
        ],
      });
      res.json(serializeAdminDoctor(updated));
    } catch (err) {
      next(err);
    }
  }

  static async destroy(req, res, next) {
    try {
      const doctor = await Doctor.findByPk(req.params.id);
      if (!doctor) throw new HttpError(404, "Dokter tidak ditemukan");
      const used = await Appointment.count({ where: { doctorId: doctor.id } });
      if (used > 0) {
        throw new HttpError(409, "Dokter masih memiliki janji temu");
      }
      await sequelize.transaction(async (t) => {
        await Schedule.destroy({ where: { doctorId: doctor.id }, transaction: t });
        const userId = doctor.userId;
        await doctor.destroy({ transaction: t });
        await User.destroy({ where: { id: userId }, transaction: t });
      });
      res.json({ message: "Dokter dihapus" });
    } catch (err) {
      next(err);
    }
  }
}

class AdminScheduleController {
  static async list(req, res, next) {
    try {
      const where = {};
      if (req.query.doctorId) where.doctorId = req.query.doctorId;
      const schedules = await Schedule.findAll({
        where,
        include: [
          {
            model: Doctor,
            include: [{ model: User, attributes: ["id", "name"] }],
          },
        ],
        order: [
          ["doctorId", "ASC"],
          ["dayOfWeek", "ASC"],
          ["session", "ASC"],
        ],
      });
      res.json(schedules);
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const { doctorId, dayOfWeek, session, startTime, endTime, quota } = req.body;
      if (
        doctorId === undefined ||
        dayOfWeek === undefined ||
        !session ||
        !startTime ||
        !endTime ||
        quota === undefined
      ) {
        throw new HttpError(
          400,
          "doctorId, dayOfWeek, session, startTime, endTime, dan quota wajib diisi"
        );
      }
      if (!SESSIONS.includes(session)) {
        throw new HttpError(400, "Session harus morning atau afternoon");
      }
      const doctor = await Doctor.findByPk(doctorId);
      if (!doctor) throw new HttpError(400, "Dokter tidak ditemukan");

      const schedule = await Schedule.create({
        doctorId,
        dayOfWeek,
        session,
        startTime,
        endTime,
        quota,
      });
      res.status(201).json(schedule);
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const schedule = await Schedule.findByPk(req.params.id);
      if (!schedule) throw new HttpError(404, "Jadwal tidak ditemukan");
      const { dayOfWeek, session, startTime, endTime, quota } = req.body;
      if (session && !SESSIONS.includes(session)) {
        throw new HttpError(400, "Session harus morning atau afternoon");
      }
      await schedule.update({
        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : schedule.dayOfWeek,
        session: session !== undefined ? session : schedule.session,
        startTime: startTime !== undefined ? startTime : schedule.startTime,
        endTime: endTime !== undefined ? endTime : schedule.endTime,
        quota: quota !== undefined ? quota : schedule.quota,
      });
      res.json(schedule);
    } catch (err) {
      next(err);
    }
  }

  static async destroy(req, res, next) {
    try {
      const schedule = await Schedule.findByPk(req.params.id);
      if (!schedule) throw new HttpError(404, "Jadwal tidak ditemukan");
      await schedule.destroy();
      res.json({ message: "Jadwal dihapus" });
    } catch (err) {
      next(err);
    }
  }
}

class AdminAppointmentController {
  static async list(req, res, next) {
    try {
      const { status, date, doctorId } = req.query;
      const where = {};
      if (status) where.status = status;
      if (date) {
        if (!isValidDateOnly(date)) {
          throw new HttpError(400, "Format tanggal harus YYYY-MM-DD");
        }
        where.date = date;
      }
      if (doctorId) where.doctorId = doctorId;

      const appointments = await Appointment.findAll({
        where,
        include: [
          { model: User, as: "Patient", attributes: ["id", "name", "email", "phone"] },
          {
            model: Doctor,
            include: [
              { model: User, attributes: ["id", "name"] },
              { model: Specialty, attributes: ["id", "name"] },
            ],
          },
        ],
        order: [
          ["date", "DESC"],
          ["queueNumber", "ASC"],
        ],
      });

      res.json(
        appointments.map((a) => ({
          id: a.id,
          patientId: a.patientId,
          doctorId: a.doctorId,
          date: toDateOnly(a.date),
          session: a.session,
          queueNumber: a.queueNumber,
          status: a.status,
          patient: a.Patient,
          doctor: a.Doctor
            ? {
                id: a.Doctor.id,
                name: a.Doctor.User?.name,
                specialty: a.Doctor.Specialty,
              }
            : null,
        }))
      );
    } catch (err) {
      next(err);
    }
  }
}

module.exports = {
  AdminSpecialtyController,
  AdminDoctorController,
  AdminScheduleController,
  AdminAppointmentController,
};
