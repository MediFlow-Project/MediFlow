const jwt = require("jsonwebtoken");

function getSecret() {
  if (process.env.SECRET_KEY) return process.env.SECRET_KEY;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SECRET_KEY wajib diisi");
  }
  return "mediflow-dev-secret";
}

function signToken(payload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };
