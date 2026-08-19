const {
  Appointment,
  Consultation,
  PrescriptionItem,
  Invoice,
  Medicine,
  sequelize,
} = require("../models");
const HttpError = require("../helpers/HttpError");
const { APPOINTMENT_STATUS, INVOICE_STATUS } = require("../helpers/constants");
const { emitQueueCompleted, emitQueueUpdated } = require("../sockets/emit");

function parseQuantity(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return NaN;
}

function normalizeItems(rawItems) {
  if (rawItems === undefined || rawItems === null) return [];
  if (!Array.isArray(rawItems)) {
    throw new HttpError(400, "items harus berupa array");
  }

  return rawItems.map((item, index) => {
    const medicineId = Number(item?.medicineId);
    const quantity = parseQuantity(item?.quantity);
    const dosage = typeof item?.dosage === "string" ? item.dosage.trim() : "";

    if (!Number.isInteger(medicineId) || medicineId < 1) {
      throw new HttpError(400, `Obat pada item ke-${index + 1} tidak valid`);
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new HttpError(400, `Jumlah obat pada item ke-${index + 1} minimal 1`);
    }
    if (!dosage) {
      throw new HttpError(400, `Dosis pada item ke-${index + 1} wajib diisi`);
    }

    return { medicineId, quantity, dosage };
  });
}

class ConsultationController {
  static async complete(req, res, next) {
    try {
      const { appointmentId, complaint, diagnosis, notes, items: rawItems } = req.body;
      if (!appointmentId) throw new HttpError(400, "appointmentId wajib diisi");

      const complaintText = typeof complaint === "string" ? complaint.trim() : "";
      const diagnosisText = typeof diagnosis === "string" ? diagnosis.trim() : "";
      const notesText = typeof notes === "string" ? notes.trim() : "";
      if (!complaintText) throw new HttpError(400, "Keluhan wajib diisi");
      if (!diagnosisText) throw new HttpError(400, "Diagnosa wajib diisi");

      const items = normalizeItems(rawItems);

      const result = await sequelize.transaction(async (transaction) => {
        const appointment = await Appointment.findByPk(appointmentId, { transaction });
        if (!appointment) throw new HttpError(404, "Janji temu tidak ditemukan");
        if (appointment.doctorId !== req.doctor.id) {
          throw new HttpError(403, "Anda tidak memiliki akses");
        }
        if (appointment.status !== APPOINTMENT_STATUS.IN_CONSULTATION) {
          throw new HttpError(
            409,
            "Konsultasi hanya dapat diselesaikan dari status in_consultation"
          );
        }

        const existing = await Consultation.findOne({
          where: { appointmentId: appointment.id },
          transaction,
        });
        if (existing) {
          throw new HttpError(409, "Konsultasi untuk janji temu ini sudah selesai");
        }

        let medicineById = new Map();
        if (items.length) {
          const medicines = await Medicine.findAll({
            where: { id: items.map((item) => item.medicineId) },
            transaction,
          });
          medicineById = new Map(medicines.map((row) => [row.id, row]));
          for (const item of items) {
            if (!medicineById.has(item.medicineId)) {
              throw new HttpError(400, `Obat dengan id ${item.medicineId} tidak ditemukan`);
            }
          }
        }

        const consultation = await Consultation.create(
          {
            appointmentId: appointment.id,
            complaint: complaintText,
            diagnosis: diagnosisText,
            notes: notesText || null,
          },
          { transaction }
        );

        const prescriptionItems = [];
        let medicineTotal = 0;
        for (const item of items) {
          const medicine = medicineById.get(item.medicineId);
          medicineTotal += medicine.price * item.quantity;
          const created = await PrescriptionItem.create(
            {
              consultationId: consultation.id,
              medicineId: item.medicineId,
              quantity: item.quantity,
              dosage: item.dosage,
            },
            { transaction }
          );
          prescriptionItems.push(created);
        }

        const amount = Number(req.doctor.consultationFee) + medicineTotal;
        const invoice = await Invoice.create(
          {
            appointmentId: appointment.id,
            amount,
            status: INVOICE_STATUS.UNPAID,
          },
          { transaction }
        );

        await appointment.update(
          { status: APPOINTMENT_STATUS.COMPLETED },
          { transaction }
        );

        return { appointment, consultation, prescriptionItems, invoice };
      });

      await emitQueueCompleted({
        doctorId: result.appointment.doctorId,
        date: result.appointment.date,
        session: result.appointment.session,
        queueNumber: result.appointment.queueNumber,
        appointmentId: result.appointment.id,
      });
      await emitQueueUpdated(
        result.appointment.doctorId,
        result.appointment.date,
        result.appointment.session
      );

      res.status(201).json({
        appointmentId: result.appointment.id,
        queueNumber: result.appointment.queueNumber,
        status: APPOINTMENT_STATUS.COMPLETED,
        consultation: {
          id: result.consultation.id,
          complaint: result.consultation.complaint,
          diagnosis: result.consultation.diagnosis,
          notes: result.consultation.notes,
          items: result.prescriptionItems.map((item) => ({
            id: item.id,
            medicineId: item.medicineId,
            quantity: item.quantity,
            dosage: item.dosage,
          })),
        },
        invoice: {
          id: result.invoice.id,
          amount: result.invoice.amount,
          status: result.invoice.status,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ConsultationController;
