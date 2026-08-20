jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}));

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { recommendWithGemini } = require("../helpers/gemini");

describe("recommendWithGemini", () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = "gemini-test";
  });

  it("throws without api key", async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(recommendWithGemini("sakit", [])).rejects.toMatchObject({ status: 500 });
  });

  it("returns parsed json", async () => {
    const generateContent = jest.fn().mockResolvedValue({
      response: { text: () => '{"reply":"ke poli gigi","recommendations":[]}' },
    });
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => ({ generateContent }),
    }));
    const result = await recommendWithGemini("gigi", [{ doctorId: 1 }]);
    expect(result.reply).toBe("ke poli gigi");
  });

  it("throws on invalid json", async () => {
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockResolvedValue({ response: { text: () => "bukan json" } }),
      }),
    }));
    await expect(recommendWithGemini("x", [])).rejects.toMatchObject({ status: 500 });
  });

  it("throws when reply missing", async () => {
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockResolvedValue({ response: { text: () => '{"recommendations":[]}' } }),
      }),
    }));
    await expect(recommendWithGemini("x", [])).rejects.toMatchObject({ status: 500 });
  });
});
