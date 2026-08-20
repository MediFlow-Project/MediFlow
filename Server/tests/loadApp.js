jest.mock("../sockets/emit", () => ({
  emitQueueCompleted: jest.fn(async () => ({})),
  emitQueueUpdated: jest.fn(async (doctorId, date, session) => ({
    doctorId,
    date,
    session,
    updatedAt: new Date().toISOString(),
  })),
  emitQueueCalled: jest.fn(() => ({})),
  emitChatMessage: jest.fn(() => ({})),
  emitChatRead: jest.fn(() => ({})),
  emitChatTyping: jest.fn(() => ({})),
}));

jest.mock("../helpers/midtrans", () => {
  const actual = jest.requireActual("../helpers/midtrans");
  return {
    ...actual,
    createSnapToken: jest.fn(async (invoice) => ({
      orderId: invoice.midtransOrderId || `MEDIFLOW-${invoice.id}`,
      snapToken: "snap-test-token",
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    })),
  };
});

jest.mock("../helpers/chatbotLlm", () => ({
  recommendWithFallback: jest.fn(async () => ({
    reply: "Rekomendasi tes",
    recommendations: [],
  })),
}));

const app = require("../app");
const { recommendWithFallback } = require("../helpers/chatbotLlm");
const { createSnapToken } = require("../helpers/midtrans");
const emit = require("../sockets/emit");

module.exports = { app, recommendWithFallback, createSnapToken, emit };
