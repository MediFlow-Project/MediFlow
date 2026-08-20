"use strict";

const bcrypt = require("bcryptjs");
const { QueryTypes } = require("sequelize");
const { loadSeedData, withTimestamps } = require("./data/loadJson");

const DEMO_PASSWORD = "password123";

const SESSION_META = {
  morning: { startTime: "08:00", endTime: "12:00", quota: 10 },
  afternoon: { startTime: "13:00", endTime: "17:00", quota: 8 },
};

function mapBy(rows, key) {
  return Object.fromEntries(rows.map((row) => [row[key], row.id]));
}

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    const specialties = loadSeedData("specialties.json");
    const staff = loadSeedData("users.json");
    const doctors = loadSeedData("doctors.json");

    await queryInterface.bulkInsert("Specialties", withTimestamps(specialties, now));
    const specialtyRows = await queryInterface.sequelize.query(
      `SELECT id, name FROM "Specialties"`,
      { type: QueryTypes.SELECT }
    );
    const specialtyIdByName = mapBy(specialtyRows, "name");

    const users = [
      ...staff.map((user) => ({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        passwordHash,
      })),
      ...doctors.map((doctor) => ({
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        role: "doctor",
        passwordHash,
      })),
    ];
    await queryInterface.bulkInsert("Users", withTimestamps(users, now));
    const userRows = await queryInterface.sequelize.query(
      `SELECT id, email FROM "Users"`,
      { type: QueryTypes.SELECT }
    );
    const userIdByEmail = mapBy(userRows, "email");

    const doctorRows = doctors.map((doctor) => {
      const specialtyId = specialtyIdByName[doctor.specialty];
      const userId = userIdByEmail[doctor.email];
      if (!specialtyId) throw new Error(`Spesialisasi tidak ditemukan: ${doctor.specialty}`);
      if (!userId) throw new Error(`User dokter tidak ditemukan: ${doctor.email}`);
      return {
        userId,
        specialtyId,
        consultationFee: doctor.consultationFee,
        bio: doctor.bio,
        imgUrl: doctor.imgUrl || null,
      };
    });
    await queryInterface.bulkInsert("Doctors", withTimestamps(doctorRows, now));

    const insertedDoctors = await queryInterface.sequelize.query(
      `SELECT d.id, u.email FROM "Doctors" d INNER JOIN "Users" u ON u.id = d."userId"`,
      { type: QueryTypes.SELECT }
    );
    const doctorIdByEmail = mapBy(insertedDoctors, "email");

    const schedules = [];
    for (const doctor of doctors) {
      const doctorId = doctorIdByEmail[doctor.email];
      for (const block of doctor.schedule || []) {
        const meta = SESSION_META[block.session];
        if (!meta) throw new Error(`Sesi tidak valid: ${block.session}`);
        for (const dayOfWeek of block.days) {
          schedules.push({
            doctorId,
            dayOfWeek,
            session: block.session,
            startTime: meta.startTime,
            endTime: meta.endTime,
            quota: meta.quota,
          });
        }
      }
    }
    await queryInterface.bulkInsert("Schedules", withTimestamps(schedules, now));
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Schedules", null, {});
    await queryInterface.bulkDelete("Doctors", null, {});
    await queryInterface.bulkDelete("Users", null, {});
    await queryInterface.bulkDelete("Specialties", null, {});
  },
};
