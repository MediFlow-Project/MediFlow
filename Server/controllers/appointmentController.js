const { Appointment, Doctor, User, Specialty, Schedule } = require("../models");
const { sequelize } = require("../models");
const HttpError = require("../helpers/HttpError");
const {
  SESSIONS,
  APPOINTMENT_STATUS,
  ROLES,
} = require("../helpers/constants");
const {
  toDateOnly,
  isPastDate,
  isValidDateOnly,
  dayOfWeekFromDate,
} = require("../helpers/date");
const {
  countUsedQuota,
  hasActiveDoubleBook,
  isSessionOpen,
} = require("../helpers/quota");
const { emitQueueUpdated } = require("../sockets/emit");
const { serializeVisit, visitInclude } = require("../helpers/visitDetails");
const {
  notifyBookingCreated,
  notifyAppointmentCancelled,
} = require("../helpers/notify");

function serializeAppointment(appointment) {
  const doctor = appointment.Doctor;
  const visit = serializeVisit(appointment);
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    date: toDateOnly(appointment.date),
    session: appointment.session,
    queueNumber: appointment.queueNumber,
    status: appointment.status,
    doctor: doctor
      ? {
          id: doctor.id,
          name: doctor.User?.name,
          consultationFee: doctor.consultationFee,
          bio: doctor.bio,
          imgUrl: doctor.imgUrl,
          specialty: doctor.Specialty
            ? { id: doctor.Specialty.id, name: doctor.Specialty.name }
            : null,
        }
      : undefined,
    patient: appointment.Patient
      ? {
          id: appointment.Patient.id,
          name: appointment.Patient.name,
        }
      : undefined,
    invoice: visit.invoice,
    consultation: visit.consultation,
  };
}

const appointmentInclude = [
  {
    model: Doctor,
    include: [
      { model: User, attributes: ["id", "name"] },
      { model: Specialty, attributes: ["id", "name"] },
    ],
  },
  { model: User, as: "Patient", attributes: ["id", "name"] },
  ...visitInclude(),
];

async function assertCanViewAppointment(req, appointment) {
  if (req.user.role === ROLES.ADMIN) return;
  if (req.user.role === ROLES.PATIENT && appointment.patientId === req.user.id) return;
  if (req.user.role === ROLES.DOCTOR && appointment.Doctor?.userId === req.user.id) return;
  throw new HttpError(403, "Anda tidak memiliki akses");
}

class AppointmentController {
  static async create(req, res, next) {
    try {
      const { doctorId, date, session } = req.body;
      if (!doctorId || !date || !session) {
        throw new HttpError(400, "doctorId, date, dan session wajib diisi");
      }
      if (!isValidDateOnly(date)) {
        throw new HttpError(400, "Format tanggal harus YYYY-MM-DD");
      }
      if (!SESSIONS.includes(session)) {
        throw new HttpError(400, "Session harus morning atau afternoon");
      }
      if (isPastDate(date)) {
        throw new HttpError(400, "Tidak dapat booking untuk tanggal yang sudah lewat");
      }

      const appointment = await sequelize.transaction(async (t) => {
        const doctor = await Doctor.findByPk(doctorId, { transaction: t });
        if (!doctor) throw new HttpError(404, "Dokter tidak ditemukan");

        const schedule = await Schedule.findOne({
          where: {
            doctorId,
            dayOfWeek: dayOfWeekFromDate(date),
            session,
          },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (!schedule) {
          throw new HttpError(400, "Dokter tidak praktek pada hari atau sesi tersebut");
        }

        if (await hasActiveDoubleBook(req.user.id, doctorId, date, session, t)) {
          throw new HttpError(
            409,
            "Anda sudah memiliki janji dengan dokter ini pada tanggal dan sesi tersebut"
          );
        }

        const used = await countUsedQuota(doctorId, date, session, t);
        if (used >= schedule.quota) {
          throw new HttpError(409, "Kuota sesi ini sudah penuh");
        }

        const maxNumber = await Appointment.max("queueNumber", {
          where: { doctorId, date, session },
          transaction: t,
        });

        const sessionAlreadyOpen = await isSessionOpen(doctorId, date, session, t);
        const status = sessionAlreadyOpen
          ? APPOINTMENT_STATUS.WAITING
          : APPOINTMENT_STATUS.BOOKED;

        return Appointment.create(
          {
            patientId: req.user.id,
            doctorId,
            date,
            session,
            queueNumber: (maxNumber || 0) + 1,
            status,
          },
          { transaction: t }
        );
      });

      const created = await Appointment.findByPk(appointment.id, {
        include: appointmentInclude,
      });

      if (created.status !== APPOINTMENT_STATUS.BOOKED) {
        await emitQueueUpdated(created.doctorId, created.date, created.session);
      }
      await notifyBookingCreated(created);

      res.status(201).json(serializeAppointment(created));
    } catch (err) {
      next(err);
    }
  }

  static async list(req, res, next) {
    try {
      const where = {};
      if (req.user.role === ROLES.PATIENT) {
        where.patientId = req.user.id;
      } else if (req.user.role === ROLES.DOCTOR) {
        const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
        if (!doctor) throw new HttpError(403, "Profil dokter tidak ditemukan");
        where.doctorId = doctor.id;
      }

      const appointments = await Appointment.findAll({
        where,
        include: appointmentInclude,
        order: [
          ["date", "DESC"],
          ["queueNumber", "ASC"],
        ],
      });

      res.json(appointments.map(serializeAppointment));
    } catch (err) {
      next(err);
    }
  }

  static async detail(req, res, next) {
    try {
      const appointment = await Appointment.findByPk(req.params.id, {
        include: appointmentInclude,
      });
      if (!appointment) throw new HttpError(404, "Janji temu tidak ditemukan");
      await assertCanViewAppointment(req, appointment);
      res.json(serializeAppointment(appointment));
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req, res, next) {
    try {
      const appointment = await Appointment.findByPk(req.params.id, {
        include: appointmentInclude,
      });
      if (!appointment) throw new HttpError(404, "Janji temu tidak ditemukan");
      if (appointment.patientId !== req.user.id && req.user.role !== ROLES.ADMIN) {
        throw new HttpError(403, "Anda tidak memiliki akses");
      }

      const previousStatus = appointment.status;
      const cancellable = [
        APPOINTMENT_STATUS.BOOKED,
        APPOINTMENT_STATUS.WAITING,
      ];
      if (!cancellable.includes(previousStatus)) {
        throw new HttpError(409, "Janji tidak dapat dibatalkan karena sudah dipanggil");
      }

      await appointment.update({ status: APPOINTMENT_STATUS.CANCELLED });

      if (
        previousStatus === APPOINTMENT_STATUS.WAITING ||
        (await isSessionOpen(appointment.doctorId, appointment.date, appointment.session))
      ) {
        await emitQueueUpdated(appointment.doctorId, appointment.date, appointment.session);
      }

      const updated = await Appointment.findByPk(appointment.id, {
        include: appointmentInclude,
      });
      await notifyAppointmentCancelled(updated, req.user);
      res.json(serializeAppointment(updated));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AppointmentController;
