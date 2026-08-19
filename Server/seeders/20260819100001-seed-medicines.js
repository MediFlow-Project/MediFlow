"use strict";

const now = new Date();

const medicines = [
  { name: "Paracetamol 500 mg", price: 8000 },
  { name: "Amoxicillin 500 mg", price: 15000 },
  { name: "Ibuprofen 400 mg", price: 12000 },
  { name: "Cetirizine 10 mg", price: 9000 },
  { name: "Omeprazole 20 mg", price: 18000 },
  { name: "Salbutamol 2 mg", price: 11000 },
  { name: "Oralit", price: 5000 },
  { name: "Vitamin C 500 mg", price: 7000 },
  { name: "Metformin 500 mg", price: 14000 },
  { name: "Amlodipine 5 mg", price: 16000 },
].map((item) => ({
  ...item,
  createdAt: now,
  updatedAt: now,
}));

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("Medicines", medicines);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Medicines", null, {});
  },
};
