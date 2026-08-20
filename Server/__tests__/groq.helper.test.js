jest.mock("groq-sdk", () => {
  const create = jest.fn();
  function Groq() {
    return { chat: { completions: { create } } };
  }
  Groq._create = create;
  return Groq;
});

const Groq = require("groq-sdk");
const { recommendWithGroq } = require("../helpers/groq");

describe("helpers/groq", () => {
  const originalKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.GROQ_MODEL;

  afterEach(() => {
    process.env.GROQ_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.GROQ_MODEL;
    else process.env.GROQ_MODEL = originalModel;
    Groq._create.mockReset();
  });

  test("menolak jika API key kosong", async () => {
    delete process.env.GROQ_API_KEY;
    await expect(recommendWithGroq("keluhan", [])).rejects.toMatchObject({
      status: 500,
      message: "Konfigurasi Groq belum tersedia",
    });
  });

  test("mengembalikan JSON dari completion", async () => {
    process.env.GROQ_MODEL = "llama-test";
    Groq._create.mockResolvedValue({
      choices: [{ message: { content: '{"reply":"Coba poli gigi"}' } }],
    });
    const result = await recommendWithGroq("nyeri", []);
    expect(result.reply).toBe("Coba poli gigi");
  });

  test("gagal jika content kosong atau tidak valid", async () => {
    Groq._create.mockResolvedValue({ choices: [{ message: {} }] });
    await expect(recommendWithGroq("keluhan", [])).rejects.toMatchObject({
      status: 500,
      message: "Gagal memproses jawaban asisten AI",
    });
  });
});
