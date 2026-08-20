jest.mock("../helpers/gemini", () => ({
  recommendWithGemini: jest.fn(),
}));
jest.mock("../helpers/groq", () => ({
  recommendWithGroq: jest.fn(),
}));

const { recommendWithGemini } = require("../helpers/gemini");
const { recommendWithGroq } = require("../helpers/groq");
const { recommendWithFallback } = require("../helpers/chatbotLlm");

describe("helpers/chatbotLlm", () => {
  const originalGroq = process.env.GROQ_API_KEY;

  afterEach(() => {
    process.env.GROQ_API_KEY = originalGroq;
    recommendWithGemini.mockReset();
    recommendWithGroq.mockReset();
  });

  test("mengembalikan hasil Gemini jika berhasil", async () => {
    recommendWithGemini.mockResolvedValue({ reply: "dari gemini" });
    const result = await recommendWithFallback("keluhan", []);
    expect(result).toEqual({ reply: "dari gemini" });
    expect(recommendWithGroq).not.toHaveBeenCalled();
  });

  test("fallback ke Groq jika Gemini gagal", async () => {
    recommendWithGemini.mockRejectedValue(new Error("gemini down"));
    recommendWithGroq.mockResolvedValue({ reply: "dari groq" });
    const result = await recommendWithFallback("keluhan", []);
    expect(result).toEqual({ reply: "dari groq" });
  });

  test("error konfigurasi jika kedua provider belum di-set", async () => {
    delete process.env.GROQ_API_KEY;
    recommendWithGemini.mockRejectedValue(
      new Error("Konfigurasi Gemini belum tersedia")
    );
    recommendWithGroq.mockRejectedValue(new Error("groq missing"));
    await expect(recommendWithFallback("keluhan", [])).rejects.toMatchObject({
      status: 500,
      message: "Konfigurasi chatbot belum tersedia",
    });
  });

  test("error umum jika kedua provider gagal", async () => {
    recommendWithGemini.mockRejectedValue(new Error("timeout"));
    recommendWithGroq.mockRejectedValue(new Error("timeout"));
    await expect(recommendWithFallback("keluhan", [])).rejects.toMatchObject({
      status: 500,
      message: "Asisten AI sedang tidak tersedia",
    });
  });
});
