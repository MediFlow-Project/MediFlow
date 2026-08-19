"use strict";

const fs = require("fs");
const path = require("path");

function loadSeedData(fileName) {
  const filePath = path.join(__dirname, fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function withTimestamps(rows, now = new Date()) {
  return rows.map((row) => ({ ...row, createdAt: now, updatedAt: now }));
}

module.exports = { loadSeedData, withTimestamps };
