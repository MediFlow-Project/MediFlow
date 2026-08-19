const { Op } = require("sequelize");
const { Appointment } = require("../models");
const {
  ACTIVE_FOR_QUOTA,
  ACTIVE_FOR_DOUBLE_BOOK,
  SESSION_STARTED_STATUSES,
} = require("./constants");
const { toDateOnly } = require("./date");

async function countUsedQuota(doctorId, date, session, transaction) {
  return Appointment.count({
    where: {
      doctorId,
      date: toDateOnly(date),
      session,
      status: { [Op.in]: ACTIVE_FOR_QUOTA },
    },
    transaction,
  });
}

async function remainingQuota(doctorId, date, session, quota, transaction) {
  const used = await countUsedQuota(doctorId, date, session, transaction);
  return Math.max(0, quota - used);
}

async function hasActiveDoubleBook(patientId, doctorId, date, session, transaction) {
  const existing = await Appointment.findOne({
    where: {
      patientId,
      doctorId,
      date: toDateOnly(date),
      session,
      status: { [Op.in]: ACTIVE_FOR_DOUBLE_BOOK },
    },
    transaction,
  });
  return Boolean(existing);
}

async function isSessionOpen(doctorId, date, session, transaction) {
  const count = await Appointment.count({
    where: {
      doctorId,
      date: toDateOnly(date),
      session,
      status: { [Op.in]: SESSION_STARTED_STATUSES },
    },
    transaction,
  });
  if (count > 0) return true;
  return openedSessions.has(sessionKey(doctorId, date, session));
}

const openedSessions = new Set();

function sessionKey(doctorId, date, session) {
  return `${doctorId}:${toDateOnly(date)}:${session}`;
}

function markSessionOpen(doctorId, date, session) {
  openedSessions.add(sessionKey(doctorId, date, session));
}

module.exports = {
  countUsedQuota,
  remainingQuota,
  hasActiveDoubleBook,
  isSessionOpen,
  markSessionOpen,
};
