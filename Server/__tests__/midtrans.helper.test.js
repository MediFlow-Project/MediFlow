const {
  verifySignature,
  mapNotificationStatus,
} = require("../helpers/midtrans");
const { signedNotification } = require("../tests/helpers/midtransPayload");

describe("helpers/midtrans", () => {
  test("verifySignature menerima hash SHA512 yang sah", () => {
    const payload = signedNotification();
    expect(verifySignature(payload)).toBe(true);
  });

  test("verifySignature menolak payload tidak lengkap", () => {
    expect(verifySignature({ order_id: "x" })).toBe(false);
  });

  test("mapNotificationStatus memetakan status Midtrans", () => {
    expect(mapNotificationStatus({ transaction_status: "settlement" })).toBe("paid");
    expect(
      mapNotificationStatus({ transaction_status: "capture", fraud_status: "accept" })
    ).toBe("paid");
    expect(
      mapNotificationStatus({ transaction_status: "capture", fraud_status: "challenge" })
    ).toBe("pending");
    expect(mapNotificationStatus({ transaction_status: "expire" })).toBe("expire");
    expect(mapNotificationStatus({ transaction_status: "pending" })).toBe("pending");
    expect(mapNotificationStatus({ transaction_status: "deny" })).toBe("failed");
    expect(mapNotificationStatus({ transaction_status: "cancel" })).toBe("failed");
    expect(mapNotificationStatus({ transaction_status: "failure" })).toBe("failed");
    expect(
      mapNotificationStatus({ transaction_status: "capture", fraud_status: "deny" })
    ).toBe("failed");
    expect(mapNotificationStatus({ transaction_status: "capture" })).toBe("paid");
    expect(mapNotificationStatus({ transaction_status: "mystery" })).toBeNull();
  });

  test("verifySignature menolak jika server key kosong", () => {
    const key = process.env.MIDTRANS_SERVER_KEY;
    delete process.env.MIDTRANS_SERVER_KEY;
    expect(verifySignature(signedNotification())).toBe(false);
    process.env.MIDTRANS_SERVER_KEY = key;
  });
});
