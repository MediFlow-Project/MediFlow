const { Doctor } = require("../models");
const HttpError = require("../helpers/HttpError");
const { ROLES } = require("../helpers/constants");

function authorize(...roles) {
  return (req, res, next) => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        throw new HttpError(403, "Anda tidak memiliki akses");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

async function requireDoctor(req, res, next) {
  try {
    if (req.user.role !== ROLES.DOCTOR) {
      throw new HttpError(403, "Hanya dokter yang dapat mengakses");
    }
    const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
    if (!doctor) throw new HttpError(403, "Profil dokter tidak ditemukan");
    req.doctor = doctor;
    next();
  } catch (err) {
    next(err);
  }
}

const requireAdmin = authorize(ROLES.ADMIN);
const requirePatient = authorize(ROLES.PATIENT);

module.exports = {
  authorize,
  requireDoctor,
  requireAdmin,
  requirePatient,
};
