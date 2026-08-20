const { recommendWithFallback } = require("../helpers/chatbotLlm");
const {
  getAvailableDoctors,
  toPublicRecommendation,
} = require("../helpers/doctorAvailability");
const HttpError = require("../helpers/HttpError");

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

class ChatbotController {
  static async recommend(req, res, next) {
    try {
      const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
      if (!message) throw new HttpError(400, "Keluhan wajib diisi");
      if (message.length > 1000) throw new HttpError(400, "Keluhan terlalu panjang");

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

      res.status(200).json({
        disclaimer: DISCLAIMER,
        reply: recommendations.length ? ai.reply : EMPTY_NO_MATCH,
        recommendations,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ChatbotController;
