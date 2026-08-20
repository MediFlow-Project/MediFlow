jest.mock("imagekit");

const ImageKit = require("imagekit");
const HttpError = require("../helpers/HttpError");
const {
  FOLDERS,
  folderPathFor,
  getImageKit,
  uploadToImageKit,
} = require("../helpers/imagekit");
const {
  isAllowedImage,
  imageFileFilter,
  MAX_IMAGE_BYTES,
} = require("../helpers/imageUpload");
const UploadController = require("../controllers/uploadController");
const { resolveRequestImgUrl } = require("../helpers/requestImage");
const { mockRes, mockNext } = require("./utils");

describe("imageUpload helper", () => {
  it("accepts allowed mime types", () => {
    expect(isAllowedImage("image/jpeg")).toBe(true);
    expect(isAllowedImage("image/png")).toBe(true);
    expect(isAllowedImage("application/pdf")).toBe(false);
    expect(MAX_IMAGE_BYTES).toBeGreaterThan(0);
  });

  it("filters invalid files", () => {
    const cb = jest.fn();
    imageFileFilter({}, { mimetype: "application/pdf" }, cb);
    expect(cb.mock.calls[0][0]).toBeInstanceOf(HttpError);
    imageFileFilter({}, { mimetype: "image/png" }, cb);
    expect(cb).toHaveBeenLastCalledWith(null, true);
  });
});

describe("imagekit helper", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.IMAGEKIT_PUBLIC_KEY = originalEnv.IMAGEKIT_PUBLIC_KEY;
    process.env.IMAGEKIT_PRIVATE_KEY = originalEnv.IMAGEKIT_PRIVATE_KEY;
    process.env.IMAGEKIT_URL_ENDPOINT = originalEnv.IMAGEKIT_URL_ENDPOINT;
    ImageKit.mockReset();
  });

  it("maps folders and falls back", () => {
    expect(folderPathFor("doctors")).toBe(FOLDERS.doctors);
    expect(folderPathFor("unknown")).toBe("/mediflow");
  });

  it("requires credentials", () => {
    delete process.env.IMAGEKIT_PUBLIC_KEY;
    delete process.env.IMAGEKIT_PRIVATE_KEY;
    delete process.env.IMAGEKIT_URL_ENDPOINT;
    expect(() => getImageKit()).toThrow(HttpError);
  });

  it("rethrows config errors from upload", async () => {
    delete process.env.IMAGEKIT_PUBLIC_KEY;
    delete process.env.IMAGEKIT_PRIVATE_KEY;
    delete process.env.IMAGEKIT_URL_ENDPOINT;
    await expect(
      uploadToImageKit({ buffer: Buffer.from("abc"), fileName: "a.jpg" })
    ).rejects.toMatchObject({ status: 500 });
  });

  it("uploads a buffer", async () => {
    process.env.IMAGEKIT_PUBLIC_KEY = "pk";
    process.env.IMAGEKIT_PRIVATE_KEY = "sk";
    process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
    const upload = jest.fn().mockResolvedValue({ url: "https://ik.imagekit.io/demo/a.jpg", fileId: "1" });
    ImageKit.mockImplementation(() => ({ upload }));
    const result = await uploadToImageKit({
      buffer: "not-a-buffer",
      folder: "/mediflow/doctors",
    });
    expect(result.url).toContain("ik.imagekit.io");
    expect(upload).toHaveBeenCalled();
  });

  it("wraps missing url and sdk errors", async () => {
    process.env.IMAGEKIT_PUBLIC_KEY = "pk";
    process.env.IMAGEKIT_PRIVATE_KEY = "sk";
    process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
    ImageKit.mockImplementation(() => ({
      upload: jest.fn().mockResolvedValue({}),
    }));
    await expect(
      uploadToImageKit({ buffer: Buffer.from("abc"), fileName: "a.jpg" })
    ).rejects.toMatchObject({ status: 502 });

    ImageKit.mockImplementation(() => ({
      upload: jest.fn().mockRejectedValue(new Error("network")),
    }));
    await expect(
      uploadToImageKit({ buffer: Buffer.from("abc"), fileName: "a.jpg" })
    ).rejects.toMatchObject({ status: 502 });
  });
});

describe("UploadController", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.IMAGEKIT_PUBLIC_KEY = originalEnv.IMAGEKIT_PUBLIC_KEY;
    process.env.IMAGEKIT_PRIVATE_KEY = originalEnv.IMAGEKIT_PRIVATE_KEY;
    process.env.IMAGEKIT_URL_ENDPOINT = originalEnv.IMAGEKIT_URL_ENDPOINT;
    ImageKit.mockReset();
  });

  it("requires a file", async () => {
    const next = mockNext();
    await UploadController.create({ file: null, body: {} }, mockRes(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 400 });
  });

  it("uploads and returns url", async () => {
    process.env.IMAGEKIT_PUBLIC_KEY = "pk";
    process.env.IMAGEKIT_PRIVATE_KEY = "sk";
    process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
    ImageKit.mockImplementation(() => ({
      upload: jest.fn().mockResolvedValue({ url: "https://ik.imagekit.io/demo/doc.jpg" }),
    }));
    const res = mockRes();
    await UploadController.create(
      {
        file: { buffer: Buffer.from("abc"), originalname: "doc.jpg" },
        body: { folder: "doctors" },
      },
      res,
      mockNext()
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ url: "https://ik.imagekit.io/demo/doc.jpg" });
  });

  it("uses default folder and filename", async () => {
    process.env.IMAGEKIT_PUBLIC_KEY = "pk";
    process.env.IMAGEKIT_PRIVATE_KEY = "sk";
    process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
    ImageKit.mockImplementation(() => ({
      upload: jest.fn().mockResolvedValue({ url: "https://ik.imagekit.io/demo/x.jpg" }),
    }));
    const res = mockRes();
    await UploadController.create(
      { file: { buffer: Buffer.from("abc") }, body: {} },
      res,
      mockNext()
    );
    expect(res.json.mock.calls[0][0].url).toBeTruthy();
  });

  it("forwards upload errors", async () => {
    process.env.IMAGEKIT_PUBLIC_KEY = "pk";
    process.env.IMAGEKIT_PRIVATE_KEY = "sk";
    process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
    ImageKit.mockImplementation(() => ({
      upload: jest.fn().mockRejectedValue(new Error("network")),
    }));
    const next = mockNext();
    await UploadController.create(
      { file: { buffer: Buffer.from("abc"), originalname: "a.jpg" }, body: { folder: "doctors" } },
      mockRes(),
      next
    );
    expect(next.mock.calls[0][0]).toMatchObject({ status: 502 });
  });
});

describe("resolveRequestImgUrl", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.IMAGEKIT_PUBLIC_KEY = originalEnv.IMAGEKIT_PUBLIC_KEY;
    process.env.IMAGEKIT_PRIVATE_KEY = originalEnv.IMAGEKIT_PRIVATE_KEY;
    process.env.IMAGEKIT_URL_ENDPOINT = originalEnv.IMAGEKIT_URL_ENDPOINT;
    ImageKit.mockReset();
  });

  it("uploads when a file is attached", async () => {
    process.env.IMAGEKIT_PUBLIC_KEY = "pk";
    process.env.IMAGEKIT_PRIVATE_KEY = "sk";
    process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
    ImageKit.mockImplementation(() => ({
      upload: jest.fn().mockResolvedValue({ url: "https://ik.imagekit.io/demo/new.jpg" }),
    }));
    const url = await resolveRequestImgUrl(
      {
        file: { buffer: Buffer.from("abc"), originalname: "dokter.jpg" },
        body: { imgUrl: "https://old.test/a.png" },
      },
      "doctors",
      "https://old.test/a.png"
    );
    expect(url).toBe("https://ik.imagekit.io/demo/new.jpg");
  });

  it("uses default filename when originalname is missing", async () => {
    process.env.IMAGEKIT_PUBLIC_KEY = "pk";
    process.env.IMAGEKIT_PRIVATE_KEY = "sk";
    process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
    ImageKit.mockImplementation(() => ({
      upload: jest.fn().mockResolvedValue({ url: "https://ik.imagekit.io/demo/x.jpg" }),
    }));
    const url = await resolveRequestImgUrl(
      { file: { buffer: Buffer.from("abc") }, body: {} },
      "medicines",
      null
    );
    expect(url).toContain("ik.imagekit.io");
  });

  it("reads imgUrl from the body when no file is sent", async () => {
    await expect(
      resolveRequestImgUrl({ body: { imgUrl: "https://x.test/a.png" } }, "doctors", "old.png")
    ).resolves.toBe("https://x.test/a.png");
    await expect(resolveRequestImgUrl({ body: { imgUrl: "" } }, "doctors", "old.png")).resolves.toBeNull();
    await expect(resolveRequestImgUrl({ body: { imgUrl: null } }, "doctors", "old.png")).resolves.toBeNull();
  });

  it("keeps the previous url when imgUrl is omitted", async () => {
    await expect(resolveRequestImgUrl({ body: {} }, "doctors", "old.png")).resolves.toBe("old.png");
    await expect(resolveRequestImgUrl({}, "specialties", "keep.png")).resolves.toBe("keep.png");
  });
});
