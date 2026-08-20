function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "HttpError") {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Silakan login terlebih dahulu" });
  }

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({ error: err.errors[0]?.message || "Data tidak valid" });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    const fields = err.errors?.map((e) => e.path) || [];
    if (fields.includes("email")) {
      return res.status(409).json({ error: "Email sudah terdaftar" });
    }
    if (fields.includes("patientId") || err.index === "appointments_active_unique") {
      return res.status(409).json({
        error: "Anda sudah memiliki janji dengan dokter ini pada tanggal dan sesi tersebut",
      });
    }
    return res.status(409).json({ error: "Data bentrok dengan data yang sudah ada" });
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({ error: "Data terkait tidak ditemukan" });
  }

  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Ukuran foto maksimal 5 MB" : "Gagal mengunggah foto";
    return res.status(400).json({ error: message });
  }

  if (err.type === "entity.parse.failed" || (err instanceof SyntaxError && err.status === 400)) {
    return res.status(400).json({ error: "Data tidak valid" });
  }

  return res.status(500).json({ error: "Terjadi kesalahan pada server" });
}

module.exports = errorHandler;
