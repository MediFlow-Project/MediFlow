const { recommendWithGemini } = require("./gemini");
const { recommendWithGroq } = require("./groq");
const HttpError = require("./HttpError");

async function recommendWithFallback(userMessage, availableDoctors) {
  try {
    return await recommendWithGemini(userMessage, availableDoctors);
  } catch (geminiError) {
    try {
      return await recommendWithGroq(userMessage, availableDoctors);
    } catch {
      const missingBoth =
        geminiError.message === "Konfigurasi Gemini belum tersedia" &&
        !process.env.GROQ_API_KEY;
      throw new HttpError(
        500,
        missingBoth
          ? "Konfigurasi chatbot belum tersedia"
          : "Asisten AI sedang tidak tersedia"
      );
    }
  }
}

module.exports = { recommendWithFallback };
