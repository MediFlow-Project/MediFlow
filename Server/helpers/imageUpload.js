const multer = require("multer");
const HttpError = require("./HttpError");

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function isAllowedImage(mimetype) {
  return ALLOWED_IMAGE_TYPES.includes(mimetype);
}

function imageFileFilter(req, file, cb) {
  if (!isAllowedImage(file.mimetype)) {
    cb(new HttpError(400, "File harus berupa gambar JPG, PNG, WEBP, atau GIF"));
    return;
  }
  cb(null, true);
}

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: imageFileFilter,
});

module.exports = {
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_TYPES,
  isAllowedImage,
  imageFileFilter,
  imageUpload,
};
