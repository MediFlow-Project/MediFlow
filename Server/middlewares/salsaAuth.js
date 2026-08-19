require("dotenv").config();
const jwt = require("jsonwebtoken");

// Salsa — proteksi endpoint milik Salsa. Jangan mengganti auth register/login Raihan.

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Anda belum login" });
  }

  try {
    const payload = jwt.verify(header.slice(7), process.env.SECRET_KEY);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: "Token tidak valid" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Akses ditolak" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
