require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const HttpError = require("./HttpError");

const SYSTEM_INSTRUCTION = `Kamu asisten RS MediFlow. Bantu pasien memilih poli/dokter berdasarkan keluhan.
Kamu BUKAN dokter. Jangan mendiagnosis. Jangan menyarankan obat. Jangan memberi instruksi gawat darurat; jika terkesan darurat, sarankan ke IGD secara umum saja.
Hanya rekomendasikan doctorId yang ADA di daftar konteks. Jangan mengarang dokter, ID, atau jadwal.
Balas HANYA JSON valid, tanpa markdown:
{"reply":"string","recommendations":[{"doctorId":1,"reason":"string singkat non-diagnostik","nextSession":{"date":"YYYY-MM-DD","session":"morning atau afternoon"}}]}
Maksimal 1-3 dokter. Jika tidak ada yang cocok, recommendations harus [].`;

function buildPrompt(userMessage, availableDoctors) {
  return `Daftar dokter yang sesinya masih ada kuota:
${JSON.stringify(availableDoctors)}

Keluhan pasien:
${userMessage}`;
}

function parseModelJson(text) {
  if (!text) return null;
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function invalidAiResult() {
  return new HttpError(500, "Gagal memproses jawaban asisten AI");
}

async function recommendWithGemini(userMessage, availableDoctors) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, "Konfigurasi Gemini belum tersedia");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const result = await model.generateContent(buildPrompt(userMessage, availableDoctors));
  const parsed = parseModelJson(result.response.text());
  if (!parsed || typeof parsed.reply !== "string") {
    throw invalidAiResult();
  }

  return parsed;
}

module.exports = {
  SYSTEM_INSTRUCTION,
  buildPrompt,
  parseModelJson,
  recommendWithGemini,
};
