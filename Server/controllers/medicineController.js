const { Medicine } = require("../models");
const HttpError = require("../helpers/HttpError");

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
    throw new HttpError(400, "Nama obat wajib diisi");
  }
  if (!Number.isInteger(price) || price < 0) {
    throw new HttpError(400, "Harga obat tidak valid");
  }

  return { name, price };
}

async function list(req, res, next) {
  try {
    const medicines = await Medicine.findAll({ order: [["id", "ASC"]] });
    res.status(200).json(medicines);
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) throw new HttpError(404, "Obat tidak ditemukan");
    res.status(200).json(medicine);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const medicine = await Medicine.create(validatePayload(req.body));
    res.status(201).json(medicine);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) throw new HttpError(404, "Obat tidak ditemukan");
    await medicine.update(validatePayload(req.body));
    res.status(200).json(medicine);
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) throw new HttpError(404, "Obat tidak ditemukan");
    await medicine.destroy();
    res.status(200).json({ message: "Obat berhasil dihapus" });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, create, update, destroy };
