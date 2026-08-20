jest.mock("@google/generative-ai", () => {
  const generateContent = jest.fn();
  function GoogleGenerativeAI() {
    return {
      getGenerativeModel: jest.fn(() => ({ generateContent })),
    };
  }
  GoogleGenerativeAI._generateContent = generateContent;
  return { GoogleGenerativeAI };
});

const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  buildPrompt,
  parseModelJson,
  recommendWithGemini,
} = require("../helpers/gemini");

describe("helpers/gemini", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = originalModel;
    GoogleGenerativeAI._generateContent.mockReset();
  });

  test("buildPrompt menyertakan keluhan dan daftar dokter", () => {
    const prompt = buildPrompt("sakit gigi", [{ doctorId: 1 }]);
    expect(prompt).toContain("sakit gigi");
    expect(prompt).toContain("\"doctorId\":1");
  });

  test("parseModelJson menangani teks kosong, fence, dan JSON rusak", () => {
    expect(parseModelJson("")).toBeNull();
    expect(parseModelJson(null)).toBeNull();
    expect(parseModelJson('{"reply":"ok"}')).toEqual({ reply: "ok" });
    expect(parseModelJson('```json\n{"reply":"ok"}\n```')).toEqual({ reply: "ok" });
    expect(parseModelJson('```\n{"reply":"ok"}\n```')).toEqual({ reply: "ok" });
    expect(parseModelJson('catatan {"reply":"ok"} akhir')).toEqual({ reply: "ok" });
    expect(parseModelJson("bukan json")).toBeNull();
    expect(parseModelJson("{bukan json")).toBeNull();
    expect(parseModelJson("{not json}")).toBeNull();
  });

  test("recommendWithGemini menolak jika API key kosong", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(recommendWithGemini("keluhan", [])).rejects.toMatchObject({
      status: 500,
      message: "Konfigurasi Gemini belum tersedia",
    });
  });

  test("recommendWithGemini mengembalikan JSON model", async () => {
    process.env.GEMINI_MODEL = "gemini-test";
    GoogleGenerativeAI._generateContent.mockResolvedValue({
      response: {
        text: () => '{"reply":"Ke poli gigi","recommendations":[]}',
      },
    });
    const result = await recommendWithGemini("nyeri gigi", [{ doctorId: 1 }]);
    expect(result.reply).toBe("Ke poli gigi");
  });

  test("recommendWithGemini gagal jika reply tidak valid", async () => {
    GoogleGenerativeAI._generateContent.mockResolvedValue({
      response: { text: () => '{"recommendations":[]}' },
    });
    await expect(recommendWithGemini("keluhan", [])).rejects.toMatchObject({
      status: 500,
      message: "Gagal memproses jawaban asisten AI",
    });
  });
});
