const { Appointment, Doctor, Schedule } = require("../models");
const { sequelize } = require("../models");
const HttpError = require("../helpers/HttpError");
const {
  SESSIONS,
  APPOINTMENT_STATUS,
  ROLES,
  BUSY_STATUSES,
} = require("../helpers/constants");
const {
  isValidDateOnly,
  isPastDate,
  todayDateOnly,
  dayOfWeekFromDate,
} = require("../helpers/date");
const { remainingQuota, isSessionOpen, markSessionOpen } = require("../helpers/quota");
const { buildQueuePayload } = require("../helpers/queuePayload");
const {
  emitQueueUpdated,
  emitQueueCalled,
} = require("../sockets/emit");
const {
  notifyQueueCalled,
  notifyQueueSkipped,
  notifySessionOpened,
} = require("../helpers/notify");

function requireDateSession(date, session) {
  if (!date || !session) {
    throw new HttpError(400, "date dan session wajib diisi");
  }
  if (!isValidDateOnly(date)) {
    throw new HttpError(400, "Format tanggal harus YYYY-MM-DD");
  }
  if (!SESSIONS.includes(session)) {
    throw new HttpError(400, "Session harus morning atau afternoon");
  }
}

async function assertQueueAccess(req, doctorId, date, session) {
  if (req.user.role === ROLES.ADMIN) return;
  if (req.user.role === ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
    if (!doctor || doctor.id !== Number(doctorId)) {
      throw new HttpError(403, "Anda tidak memiliki akses");
    }
    return;
  }
  if (req.user.role === ROLES.PATIENT) {
    const own = await Appointment.findOne({
      where: { patientId: req.user.id, doctorId, date, session },
    });
    if (!own) throw new HttpError(403, "Anda tidak memiliki akses");
    return;
  }
  throw new HttpError(403, "Anda tidak memiliki akses");
}

class QueueController {
  static async publicBoard(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { date, session } = req.query;
      requireDateSession(date, session);
      await assertQueueAccess(req, doctorId, date, session);
      const payload = await buildQueuePayload(doctorId, date, session, {
        includeAppointmentId: true,
      });
      res.json(payload);
    } catch (err) {
      next(err);
    }
  }

  static async sessionsToday(req, res, next) {
    try {
      const date = todayDateOnly();
      const dayOfWeek = dayOfWeekFromDate(date);
      const schedules = await Schedule.findAll({
        where: { doctorId: req.doctor.id, dayOfWeek },
        order: [["session", "ASC"]],
      });

      const result = [];
      for (const sch of schedules) {
        const appointments = await Appointment.findAll({
          where: { doctorId: req.doctor.id, date, session: sch.session },
        });
        const remaining = await remainingQuota(
          req.doctor.id,
          date,
          sch.session,
          sch.quota
        );
        result.push({
          date,
          session: sch.session,
          startTime: sch.startTime,
          endTime: sch.endTime,
          quota: sch.quota,
          remainingQuota: remaining,
          bookedCount: appointments.filter((a) => a.status === APPOINTMENT_STATUS.BOOKED).length,
          waitingCount: appointments.filter((a) => a.status === APPOINTMENT_STATUS.WAITING).length,
          calledCount: appointments.filter((a) => a.status === APPOINTMENT_STATUS.CALLED).length,
          isOpen: await isSessionOpen(req.doctor.id, date, sch.session),
        });
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async openSession(req, res, next) {
    try {
      const { date, session } = req.body;
      requireDateSession(date, session);
      if (isPastDate(date)) {
        throw new HttpError(400, "Tidak dapat membuka sesi tanggal yang sudah lewat");
      }

      const schedule = await Schedule.findOne({
        where: {
          doctorId: req.doctor.id,
          dayOfWeek: dayOfWeekFromDate(date),
          session,
        },
      });
      if (!schedule) {
        throw new HttpError(400, "Anda tidak memiliki jadwal pada hari atau sesi tersebut");
      }

      const booked = await Appointment.findAll({
        where: {
          doctorId: req.doctor.id,
          date,
          session,
          status: APPOINTMENT_STATUS.BOOKED,
        },
      });

      await sequelize.transaction(async (t) => {
        await Appointment.update(
          { status: APPOINTMENT_STATUS.WAITING },
          {
            where: {
              doctorId: req.doctor.id,
              date,
              session,
              status: APPOINTMENT_STATUS.BOOKED,
            },
            transaction: t,
          }
        );
      });

      markSessionOpen(req.doctor.id, date, session);
      const payload = await emitQueueUpdated(req.doctor.id, date, session);
      await notifySessionOpened(booked || []);
      const board = await buildQueuePayload(req.doctor.id, date, session, {
        includeAppointmentId: true,
      });
      res.json({ ...board, updatedAt: payload.updatedAt });
    } catch (err) {
      next(err);
    }
  }

  static async doctorBoard(req, res, next) {
    try {
      const { date, session } = req.query;
      requireDateSession(date, session);
      const payload = await buildQueuePayload(req.doctor.id, date, session, {
        includeAppointmentId: true,
      });
      res.json(payload);
    } catch (err) {
      next(err);
    }
  }

  static async callNext(req, res, next) {
    try {
      const { date, session } = req.body;
      requireDateSession(date, session);

      const called = await sequelize.transaction(async (t) => {
        const busy = await Appointment.findOne({
          where: {
            doctorId: req.doctor.id,
            date,
            session,
            status: BUSY_STATUSES,
          },
          transaction: t,
        });
        if (busy) {
          throw new HttpError(
            409,
            "Masih ada pasien yang sedang dipanggil atau berkonsultasi"
          );
        }

        const nextPatient = await Appointment.findOne({
          where: {
            doctorId: req.doctor.id,
            date,
            session,
            status: APPOINTMENT_STATUS.WAITING,
          },
          order: [["queueNumber", "ASC"]],
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (!nextPatient) {
          throw new HttpError(409, "Tidak ada pasien dalam antrean");
        }

        await nextPatient.update(
          { status: APPOINTMENT_STATUS.CALLED },
          { transaction: t }
        );
        return nextPatient;
      });

      const calledAt = new Date().toISOString();
      emitQueueCalled({
        doctorId: req.doctor.id,
        date,
        session,
        queueNumber: called.queueNumber,
        appointmentId: called.id,
        calledAt,
      });
      await emitQueueUpdated(req.doctor.id, date, session);
      await notifyQueueCalled(called);

      res.json({
        appointmentId: called.id,
        queueNumber: called.queueNumber,
        status: APPOINTMENT_STATUS.CALLED,
        calledAt,
      });
    } catch (err) {
      next(err);
    }
  }

  static async skip(req, res, next) {
    try {
      const { appointmentId } = req.body;
      if (!appointmentId) throw new HttpError(400, "appointmentId wajib diisi");

      const appointment = await Appointment.findByPk(appointmentId);
      if (!appointment) throw new HttpError(404, "Janji temu tidak ditemukan");
      if (appointment.doctorId !== req.doctor.id) {
        throw new HttpError(403, "Anda tidak memiliki akses");
      }

      const skippable = [APPOINTMENT_STATUS.WAITING, APPOINTMENT_STATUS.CALLED];
      if (!skippable.includes(appointment.status)) {
        throw new HttpError(409, "Pasien ini tidak dapat dilewati");
      }

      await appointment.update({ status: APPOINTMENT_STATUS.NO_SHOW });
      await emitQueueUpdated(
        appointment.doctorId,
        appointment.date,
        appointment.session
      );
      await notifyQueueSkipped(appointment);

      res.json({
        appointmentId: appointment.id,
        queueNumber: appointment.queueNumber,
        status: APPOINTMENT_STATUS.NO_SHOW,
      });
    } catch (err) {
      next(err);
    }
  }

  static async startConsult(req, res, next) {
    try {
      const { appointmentId } = req.body;
      if (!appointmentId) throw new HttpError(400, "appointmentId wajib diisi");

      const appointment = await Appointment.findByPk(appointmentId);
      if (!appointment) throw new HttpError(404, "Janji temu tidak ditemukan");
      if (appointment.doctorId !== req.doctor.id) {
        throw new HttpError(403, "Anda tidak memiliki akses");
      }
      if (appointment.status !== APPOINTMENT_STATUS.CALLED) {
        throw new HttpError(409, "Konsultasi hanya dapat dimulai dari status called");
      }

      await appointment.update({ status: APPOINTMENT_STATUS.IN_CONSULTATION });
      await emitQueueUpdated(
        appointment.doctorId,
        appointment.date,
        appointment.session
      );

      res.json({
        appointmentId: appointment.id,
        queueNumber: appointment.queueNumber,
        status: APPOINTMENT_STATUS.IN_CONSULTATION,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = QueueController;
