const HttpError = require("../helpers/HttpError");
const { folderPathFor, uploadToImageKit } = require("../helpers/imagekit");

class UploadController {
  static async create(req, res, next) {
    try {
      if (!req.file) throw new HttpError(400, "Foto wajib dipilih");
      const uploaded = await uploadToImageKit({
        buffer: req.file.buffer,
        fileName: req.file.originalname || `foto-${Date.now()}.jpg`,
        folder: folderPathFor(String(req.body.folder || "")),
      });
      res.status(201).json({ url: uploaded.url });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UploadController;
