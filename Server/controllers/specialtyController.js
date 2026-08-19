const { Specialty, Doctor, User } = require("../models");
const HttpError = require("../helpers/HttpError");

class SpecialtyController {
  static async list(req, res, next) {
    try {
      const specialties = await Specialty.findAll({
        include: [{ model: Doctor, attributes: ["id"] }],
        order: [["name", "ASC"]],
      });

      res.json(
        specialties.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          doctorCount: s.Doctors?.length || 0,
        }))
      );
    } catch (err) {
      next(err);
    }
  }

  static async detail(req, res, next) {
    try {
      const specialty = await Specialty.findByPk(req.params.id, {
        include: [
          {
            model: Doctor,
            include: [{ model: User, attributes: ["id", "name"] }],
          },
        ],
      });
      if (!specialty) throw new HttpError(404, "Spesialisasi tidak ditemukan");

      res.json({
        id: specialty.id,
        name: specialty.name,
        description: specialty.description,
        doctors: (specialty.Doctors || []).map((d) => ({
          id: d.id,
          name: d.User?.name,
          consultationFee: d.consultationFee,
          bio: d.bio,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SpecialtyController;
