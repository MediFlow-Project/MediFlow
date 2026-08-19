const jwt = require("jsonwebtoken");

function getSecret() {
  return process.env.SECRET_KEY || "mediflow-dev-secret";
}

function signToken(payload) {
  return jwt.sign(payload, getSecret());
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };
