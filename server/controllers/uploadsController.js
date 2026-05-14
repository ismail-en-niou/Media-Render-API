const fs = require("fs");
const path = require("path");
const { UPLOADS_DIR, toPublicPath } = require("../utils/paths");

const listUploads = (_req, res, next) => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return res.json({ files: [] });
    }
    const entries = fs.readdirSync(UPLOADS_DIR);
    const files = entries
      .map((name) => {
        const filePath = path.join(UPLOADS_DIR, name);
        try {
          const stat = fs.statSync(filePath);
          if (!stat.isFile()) {
            return null;
          }
          const ext = path.extname(name).toLowerCase();
          const type = ext === ".mp4" || ext === ".mov" || ext === ".m4v" || ext === ".webm" || ext === ".avi" || ext === ".mkv"
            ? "video"
            : "image";
          return {
            name,
            url: toPublicPath("uploads", name),
            size: stat.size,
            updatedAt: stat.mtime.toISOString(),
            type
          };
        } catch (err) {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.json({ files });
  } catch (err) {
    return next(err);
  }
};

const deleteUpload = (req, res, next) => {
  try {
    const raw = req.params.filename;
    if (!raw) {
      return res.status(400).json({ error: "filename is required" });
    }
    const filename = path.basename(raw);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }
    fs.unlinkSync(filePath);
    return res.json({ success: true, name: filename });
  } catch (err) {
    return next(err);
  }
};

module.exports = { listUploads, deleteUpload };
