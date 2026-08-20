const { optionalImgUrl } = require("./optionalImgUrl");
const { folderPathFor, uploadToImageKit } = require("./imagekit");

async function resolveRequestImgUrl(req, folderKey, previous) {
  if (req.file) {
    const uploaded = await uploadToImageKit({
      buffer: req.file.buffer,
      fileName: req.file.originalname || `foto-${Date.now()}.jpg`,
      folder: folderPathFor(folderKey),
    });
    return uploaded.url;
  }
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, "imgUrl")) {
    return optionalImgUrl(req.body.imgUrl);
  }
  return previous;
}

module.exports = { resolveRequestImgUrl };
