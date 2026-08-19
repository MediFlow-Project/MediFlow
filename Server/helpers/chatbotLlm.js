const { recommendWithGemini } = require("./gemini");
const { recommendWithGroq } = require("./groq");

async function recommendWithFallback(userMessage, availableDoctors) {
  try {
    return await recommendWithGemini(userMessage, availableDoctors);
  } catch (geminiError) {
    try {
      return await recommendWithGroq(userMessage, availableDoctors);
    } catch {
      const error = new Error(
        geminiError.message === "Konfigurasi Gemini belum tersedia" &&
          !process.env.GROQ_API_KEY
          ? "Konfigurasi chatbot belum tersedia"
          : "Asisten AI sedang tidak tersedia"
      );
      error.status = 500;
      throw error;
    }
  }
}

module.exports = { recommendWithFallback };
