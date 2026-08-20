const db = require("../../models");
const { hashPassword } = require("../../helpers/bcrypt");
const { signToken } = require("../../helpers/jwt");
const { todayDateOnly } = require("../../helpers/date");

function tokenFor(user) {
  return signToken({ userId: user.id, role: user.role });
}

async function seedSalsaFixture() {
  const passwordHash = hashPassword("password123");
  const date = todayDateOnly();

  const specialty = await db.Specialty.create({
    name: "Gigi",
    description: "Poli gigi",
  });

  const admin = await db.User.create({
    name: "Admin Tes",
    email: "admin@test.com",
    passwordHash,
    phone: "081111111111",
    role: "admin",
  });
  const doctorUser = await db.User.create({
    name: "dr. Sari Gigi",
    email: "dokter@test.com",
    passwordHash,
    phone: "081222222222",
    role: "doctor",
  });
  const otherDoctorUser = await db.User.create({
    name: "dr. Budi Umum",
    email: "dokter2@test.com",
    passwordHash,
    phone: "081333333333",
    role: "doctor",
  });
  const patient = await db.User.create({
    name: "Andi Pasien",
    email: "pasien@test.com",
    passwordHash,
    phone: "081444444444",
    role: "patient",
  });
  const otherPatient = await db.User.create({
    name: "Budi Pasien",
    email: "pasien2@test.com",
    passwordHash,
    phone: "081555555555",
    role: "patient",
  });

  const doctor = await db.Doctor.create({
    userId: doctorUser.id,
    specialtyId: specialty.id,
    consultationFee: 150000,
    bio: "Dokter gigi",
  });
  const otherDoctor = await db.Doctor.create({
    userId: otherDoctorUser.id,
    specialtyId: specialty.id,
    consultationFee: 100000,
    bio: "Dokter umum",
  });

  async function seedWeekSchedules(doctorId) {
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 1) {
      await db.Schedule.create({
        doctorId,
        dayOfWeek,
        session: "morning",
        startTime: "08:00",
        endTime: "12:00",
        quota: 10,
      });
      await db.Schedule.create({
        doctorId,
        dayOfWeek,
        session: "afternoon",
        startTime: "13:00",
        endTime: "17:00",
        quota: 10,
      });
    }
  }

  await seedWeekSchedules(doctor.id);
  await seedWeekSchedules(otherDoctor.id);

  const medicine = await db.Medicine.create({
    name: "Paracetamol 500 mg",
    price: 8000,
  });

  const booked = await db.Appointment.create({
    patientId: patient.id,
    doctorId: doctor.id,
    date,
    session: "morning",
    queueNumber: 1,
    status: "booked",
  });
  const inConsultation = await db.Appointment.create({
    patientId: otherPatient.id,
    doctorId: doctor.id,
    date,
    session: "morning",
    queueNumber: 2,
    status: "in_consultation",
  });
  const completed = await db.Appointment.create({
    patientId: patient.id,
    doctorId: doctor.id,
    date,
    session: "afternoon",
    queueNumber: 1,
    status: "completed",
  });
  const completedPaid = await db.Appointment.create({
    patientId: otherPatient.id,
    doctorId: doctor.id,
    date,
    session: "afternoon",
    queueNumber: 2,
    status: "completed",
  });
  const otherDoctorBooked = await db.Appointment.create({
    patientId: patient.id,
    doctorId: otherDoctor.id,
    date,
    session: "morning",
    queueNumber: 1,
    status: "booked",
  });

  const unpaidInvoice = await db.Invoice.create({
    appointmentId: completed.id,
    amount: 158000,
    status: "unpaid",
  });
  const paidInvoice = await db.Invoice.create({
    appointmentId: completedPaid.id,
    amount: 150000,
    status: "paid",
    midtransOrderId: "MEDIFLOW-PAID",
  });

  return {
    date,
    specialty,
    admin,
    doctorUser,
    otherDoctorUser,
    patient,
    otherPatient,
    doctor,
    otherDoctor,
    medicine,
    booked,
    inConsultation,
    completed,
    completedPaid,
    otherDoctorBooked,
    unpaidInvoice,
    paidInvoice,
    tokens: {
      admin: tokenFor(admin),
      doctor: tokenFor(doctorUser),
      otherDoctor: tokenFor(otherDoctorUser),
      patient: tokenFor(patient),
      otherPatient: tokenFor(otherPatient),
    },
  };
}

module.exports = { seedSalsaFixture, tokenFor };
