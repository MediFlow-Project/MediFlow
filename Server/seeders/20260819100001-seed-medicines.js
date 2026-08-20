"use strict";

const { loadSeedData, withTimestamps } = require("./data/loadJson");

module.exports = {
  async up(queryInterface) {
    const medicines = loadSeedData("medicines.json");
    await queryInterface.bulkInsert("Medicines", withTimestamps(medicines));
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Medicines", null, {});
  },
};
