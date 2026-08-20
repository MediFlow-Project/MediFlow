const { maskPatientName } = require("../helpers/maskName");

describe("helpers/maskName", () => {
  test("menyamarkan nama belakang menjadi inisial", () => {
    expect(maskPatientName("Andi Pasien")).toBe("Andi P.");
    expect(maskPatientName("Budi")).toBe("Budi");
    expect(maskPatientName("")).toBe("Pasien");
  });
});
