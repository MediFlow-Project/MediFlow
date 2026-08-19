jest.mock("groq-sdk", () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } },
  }))
);

const Groq = require("groq-sdk");
const { recommendWithGroq } = require("../helpers/groq");

describe("recommendWithGroq", () => {
  it("throws without api key", async () => {
    const prev = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    await expect(recommendWithGroq("x", [])).rejects.toMatchObject({ status: 500 });
    process.env.GROQ_API_KEY = prev;
  });

  it("parses completion json", async () => {
    process.env.GROQ_API_KEY = "groq-test";
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: '{"reply":"ok","recommendations":[]}' } }],
    });
    Groq.mockImplementation(() => ({ chat: { completions: { create } } }));
    const result = await recommendWithGroq("keluhan", []);
    expect(result.reply).toBe("ok");
  });

  it("throws on empty content", async () => {
    process.env.GROQ_API_KEY = "groq-test";
    Groq.mockImplementation(() => ({
      chat: { completions: { create: jest.fn().mockResolvedValue({ choices: [{}] }) } },
    }));
    await expect(recommendWithGroq("x", [])).rejects.toMatchObject({ status: 500 });
  });
});
