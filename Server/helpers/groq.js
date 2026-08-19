require("dotenv").config();
const Groq = require("groq-sdk");
const HttpError = require("./HttpError");
const {
  SYSTEM_INSTRUCTION,
  buildPrompt,
  parseModelJson,
} = require("./gemini");

async function recommendWithGroq(userMessage, availableDoctors) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, "Konfigurasi Groq belum tersedia");
  }

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: buildPrompt(userMessage, availableDoctors) },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  const parsed = parseModelJson(text);
  if (!parsed || typeof parsed.reply !== "string") {
    throw new HttpError(500, "Gagal memproses jawaban asisten AI");
  }

  return parsed;
}

module.exports = { recommendWithGroq };
