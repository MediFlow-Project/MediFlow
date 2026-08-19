const { recommendWithFallback } = require("../helpers/chatbotLlm");
const {
  getAvailableDoctors,
  toPublicRecommendation,
} = require("../helpers/doctorAvailability");

const DISCLAIMER =
  "Ini bukan pengganti opini medis. Chatbot AI tidak mendiagnosis, tidak meresepkan obat, dan bukan layanan gawat darurat.";

const EMPTY_NO_DOCTORS =
  "Saat ini belum ada dokter dengan jadwal yang bisa direkomendasikan. Silakan lihat daftar spesialisasi.";

const EMPTY_NO_MATCH =
  "Belum ada dokter yang cocok dengan keluhan dan jadwal tersedia. Silakan lihat daftar spesialisasi.";

function emptyResponse(reply) {
  return {
    disclaimer: DISCLAIMER,
    reply,
    recommendations: [],
  };
}

async function recommend(req, res) {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message) {
      return res.status(400).json({ error: "Keluhan wajib diisi" });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: "Keluhan terlalu panjang" });
    }

    const availableDoctors = await getAvailableDoctors();
    if (!availableDoctors.length) {
      return res.status(200).json(emptyResponse(EMPTY_NO_DOCTORS));
    }

    const ai = await recommendWithFallback(message, availableDoctors);
    const recommendations = Array.isArray(ai.recommendations)
      ? ai.recommendations
          .map((item) => toPublicRecommendation(item, availableDoctors))
          .filter(Boolean)
          .slice(0, 3)
      : [];

    const reply = recommendations.length
      ? ai.reply
      : EMPTY_NO_MATCH;

    res.status(200).json({
      disclaimer: DISCLAIMER,
      reply,
      recommendations,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
}

module.exports = { recommend };
