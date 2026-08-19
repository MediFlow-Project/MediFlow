"use strict";

const bcrypt = require("bcryptjs");
const { User, Specialty, Doctor, Schedule } = require("../models");

const DEMO_PASSWORD = "password123";

module.exports = {
  async up() {
    const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

    const [umum, gigi, anak] = await Promise.all([
      Specialty.create({
        name: "Umum",
        description: "Poli penyakit dalam dan keluhan umum.",
      }),
      Specialty.create({
        name: "Gigi",
        description: "Poli kesehatan gigi dan mulut.",
      }),
      Specialty.create({
        name: "Anak",
        description: "Poli tumbuh kembang dan kesehatan anak.",
      }),
    ]);

    const admin = await User.create({
      name: "Admin MediFlow",
      email: "admin@mediflow.test",
      passwordHash,
      phone: "081100000001",
      role: "admin",
    });

    const userUmum = await User.create({
      name: "dr. Budi Santoso",
      email: "dokter.umum@mediflow.test",
      passwordHash,
      phone: "081100000002",
      role: "doctor",
    });
    const userGigi = await User.create({
      name: "dr. Sari Putri",
      email: "dokter.gigi@mediflow.test",
      passwordHash,
      phone: "081100000003",
      role: "doctor",
    });
    const userAnak = await User.create({
      name: "dr. Andi Wijaya",
      email: "dokter.anak@mediflow.test",
      passwordHash,
      phone: "081100000004",
      role: "doctor",
    });

    const pasien = await User.create({
      name: "Andi Saputra",
      email: "pasien@mediflow.test",
      passwordHash,
      phone: "081234567890",
      role: "patient",
    });

    const doctorUmum = await Doctor.create({
      userId: userUmum.id,
      specialtyId: umum.id,
      consultationFee: 100000,
      bio: "Dokter umum RS MediFlow dengan pengalaman 10 tahun.",
    });
    const doctorGigi = await Doctor.create({
      userId: userGigi.id,
      specialtyId: gigi.id,
      consultationFee: 150000,
      bio: "Dokter gigi RS MediFlow, fokus perawatan gigi berlubang dan scaling.",
    });
    const doctorAnak = await Doctor.create({
      userId: userAnak.id,
      specialtyId: anak.id,
      consultationFee: 125000,
      bio: "Dokter anak RS MediFlow, menangani tumbuh kembang dan imunisasi.",
    });

    const weekday = [1, 2, 3, 4, 5, 6];
    const morning = {
      session: "morning",
      startTime: "08:00",
      endTime: "12:00",
      quota: 10,
    };
    const afternoon = {
      session: "afternoon",
      startTime: "13:00",
      endTime: "17:00",
      quota: 8,
    };

    const schedules = [];
    for (const dayOfWeek of weekday) {
      schedules.push({ doctorId: doctorUmum.id, dayOfWeek, ...morning });
      schedules.push({ doctorId: doctorUmum.id, dayOfWeek, ...afternoon });
      schedules.push({ doctorId: doctorGigi.id, dayOfWeek, ...morning });
      if (dayOfWeek <= 5) {
        schedules.push({ doctorId: doctorGigi.id, dayOfWeek, ...afternoon });
      }
      schedules.push({ doctorId: doctorAnak.id, dayOfWeek, ...morning });
    }

    await Schedule.bulkCreate(schedules);

    void admin;
    void pasien;
  },

  async down() {
    await Schedule.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await Doctor.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await Specialty.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
    await User.destroy({ where: {}, truncate: true, cascade: true, restartIdentity: true });
  },
};
