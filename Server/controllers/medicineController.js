const { Medicine } = require("../models");

function parsePrice(value) {
  if (value === undefined || value === null || value === "") return NaN;
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return NaN;
}

function validatePayload(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = parsePrice(body.price);

  if (!name) {
    return { error: "Nama obat wajib diisi" };
  }
  if (!Number.isInteger(price) || price < 0) {
    return { error: "Harga obat tidak valid" };
  }

  return { name, price };
}

function sendError(res, error) {
  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: error.errors[0]?.message || "Data obat tidak valid",
    });
  }
  return res.status(500).json({ error: "Terjadi kesalahan pada server" });
}

async function list(req, res) {
  try {
    const medicines = await Medicine.findAll({ order: [["id", "ASC"]] });
    res.status(200).json(medicines);
  } catch (error) {
    sendError(res, error);
  }
}

async function detail(req, res) {
  try {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) {
      return res.status(404).json({ error: "Obat tidak ditemukan" });
    }
    res.status(200).json(medicine);
  } catch (error) {
    sendError(res, error);
  }
}

async function create(req, res) {
  try {
    const payload = validatePayload(req.body);
    if (payload.error) {
      return res.status(400).json({ error: payload.error });
    }

    const medicine = await Medicine.create(payload);
    res.status(201).json(medicine);
  } catch (error) {
    sendError(res, error);
  }
}

async function update(req, res) {
  try {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) {
      return res.status(404).json({ error: "Obat tidak ditemukan" });
    }

    const payload = validatePayload(req.body);
    if (payload.error) {
      return res.status(400).json({ error: payload.error });
    }

    await medicine.update(payload);
    res.status(200).json(medicine);
  } catch (error) {
    sendError(res, error);
  }
}

async function destroy(req, res) {
  try {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) {
      return res.status(404).json({ error: "Obat tidak ditemukan" });
    }

    await medicine.destroy();
    res.status(200).json({ message: "Obat berhasil dihapus" });
  } catch (error) {
    sendError(res, error);
  }
}

module.exports = { list, detail, create, update, destroy };
