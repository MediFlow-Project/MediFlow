const { User } = require("../models");
const { verifyToken } = require("../helpers/jwt");
const HttpError = require("../helpers/HttpError");

async function authentication(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new HttpError(401, "Silakan login terlebih dahulu");
    }

    const token = header.slice(7).trim();
    if (!token) throw new HttpError(401, "Silakan login terlebih dahulu");

    const payload = verifyToken(token);
    const user = await User.findByPk(payload.userId);
    if (!user) throw new HttpError(401, "Silakan login terlebih dahulu");

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authentication;
