function serializePrescriptionItems(consultation) {
  const items = consultation?.PrescriptionItems || [];
  return items.map((item) => {
    const price = Number(item.Medicine?.price ?? 0);
    const quantity = Number(item.quantity) || 0;
    return {
      id: item.id,
      medicineId: item.medicineId,
      name: item.Medicine?.name || null,
      imgUrl: item.Medicine?.imgUrl || null,
      price,
      quantity,
      dosage: item.dosage,
      subtotal: price * quantity,
    };
  });
}

function visitInclude() {
  const { Consultation, PrescriptionItem, Medicine, Invoice } = require("../models");
  return [
    {
      model: Consultation,
      include: [
        {
          model: PrescriptionItem,
          include: [{ model: Medicine, attributes: ["id", "name", "price", "imgUrl"] }],
        },
      ],
    },
    { model: Invoice },
  ];
}

function serializeVisit(appointment) {
  const consultation = appointment?.Consultation || null;
  const invoice = appointment?.Invoice || null;
  const items = serializePrescriptionItems(consultation);
  const consultationFee = Number(appointment?.Doctor?.consultationFee ?? 0);
  const medicineTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    consultation: consultation
      ? {
          id: consultation.id,
          complaint: consultation.complaint,
          diagnosis: consultation.diagnosis,
          notes: consultation.notes,
          items,
        }
      : null,
    invoice: invoice
      ? {
          id: invoice.id,
          amount: invoice.amount,
          status: invoice.status,
          consultationFee,
          medicineTotal,
        }
      : null,
  };
}

function serializeInvoiceDetail(invoice, appointment) {
  const consultation = appointment?.Consultation || null;
  const items = serializePrescriptionItems(consultation);
  const consultationFee = Number(appointment?.Doctor?.consultationFee ?? 0);
  const medicineTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const { toDateOnly } = require("./date");

  return {
    id: invoice.id,
    appointmentId: invoice.appointmentId,
    amount: invoice.amount,
    status: invoice.status,
    midtransOrderId: invoice.midtransOrderId,
    consultationFee,
    medicineTotal,
    items,
    consultation: consultation
      ? {
          complaint: consultation.complaint,
          diagnosis: consultation.diagnosis,
          notes: consultation.notes,
        }
      : null,
    date: appointment ? toDateOnly(appointment.date) : null,
    session: appointment?.session || null,
    doctor: appointment?.Doctor
      ? {
          id: appointment.Doctor.id,
          name: appointment.Doctor.User?.name,
          imgUrl: appointment.Doctor.imgUrl || null,
          specialty: appointment.Doctor.Specialty,
        }
      : null,
    patient: appointment?.Patient
      ? {
          id: appointment.Patient.id,
          name: appointment.Patient.name,
        }
      : null,
  };
}

module.exports = {
  serializePrescriptionItems,
  serializeVisit,
  serializeInvoiceDetail,
  visitInclude,
};
