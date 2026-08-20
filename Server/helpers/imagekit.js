const ImageKit = require("imagekit");
const HttpError = require("./HttpError");

const FOLDERS = {
  doctors: "/mediflow/doctors",
  specialties: "/mediflow/specialties",
  medicines: "/mediflow/medicines",
};

function folderPathFor(key) {
  return FOLDERS[key] || "/mediflow";
}

function getImageKit() {
  const publicKey = (process.env.IMAGEKIT_PUBLIC_KEY || "").trim();
  const privateKey = (process.env.IMAGEKIT_PRIVATE_KEY || "").trim();
  const urlEndpoint = (process.env.IMAGEKIT_URL_ENDPOINT || "").trim();
  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new HttpError(500, "ImageKit belum dikonfigurasi");
  }
  return new ImageKit({ publicKey, privateKey, urlEndpoint });
}

async function uploadToImageKit({ buffer, fileName, folder }) {
  try {
    const imagekit = getImageKit();
    const result = await imagekit.upload({
      file: Buffer.isBuffer(buffer) ? buffer.toString("base64") : buffer,
      fileName: fileName || `foto-${Date.now()}.jpg`,
      folder: folder || "/mediflow",
    });
    if (!result?.url) {
      throw new HttpError(502, "Gagal mengunggah foto ke ImageKit");
    }
    return { url: result.url, fileId: result.fileId || null };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, "Gagal mengunggah foto ke ImageKit");
  }
}

module.exports = {
  FOLDERS,
  folderPathFor,
  getImageKit,
  uploadToImageKit,
};
