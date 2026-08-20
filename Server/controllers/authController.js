const crypto = require("crypto");
const { User, Doctor } = require("../models");
const { hashPassword, comparePassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");
const { verifyGoogleIdToken } = require("../helpers/googleAuth");
const HttpError = require("../helpers/HttpError");
const { ROLES } = require("../helpers/constants");

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password || !phone) {
        throw new HttpError(400, "Nama, email, password, dan nomor HP wajib diisi");
      }
      if (String(password).length < 6) {
        throw new HttpError(400, "Password minimal 6 karakter");
      }

      const user = await User.create({
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        passwordHash: hashPassword(password),
        phone: String(phone).trim(),
        role: ROLES.PATIENT,
      });

      res.status(201).json(user.toSafeJSON());
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new HttpError(400, "Email dan password wajib diisi");
      }

      const user = await User.findOne({
        where: { email: String(email).trim().toLowerCase() },
      });
      if (!user || !comparePassword(password, user.passwordHash)) {
        throw new HttpError(401, "Email atau password salah");
      }

      const accessToken = signToken({ userId: user.id, role: user.role });
      res.json({
        accessToken,
        user: publicUser(user),
      });
    } catch (err) {
      next(err);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        throw new HttpError(400, "Token Google wajib diisi");
      }

      const profile = await verifyGoogleIdToken(idToken);
      let user = await User.findOne({
        where: { email: profile.email },
      });

      if (!user) {
        user = await User.create({
          name: profile.name,
          email: profile.email,
          passwordHash: hashPassword(crypto.randomBytes(32).toString("hex")),
          phone: null,
          role: ROLES.PATIENT,
        });
      }

      const accessToken = signToken({ userId: user.id, role: user.role });
      res.json({
        accessToken,
        user: publicUser(user),
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{ model: Doctor }],
      });
      if (!user) throw new HttpError(401, "Silakan login terlebih dahulu");

      const payload = user.toSafeJSON();
      if (user.Doctor) {
        payload.doctor = {
          id: user.Doctor.id,
          specialtyId: user.Doctor.specialtyId,
          consultationFee: user.Doctor.consultationFee,
          bio: user.Doctor.bio,
        };
      }
      res.json(payload);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
