const fs = require("fs");
const path = require("path");
const { resolvePublicPath, UPLOADS_DIR, AUDIO_DIR, RENDERS_DIR } = require("../utils/paths");

const downloadFile = (req, res, next) => {
  try {
    const { filePath } = req.params;
    if (!filePath) {
      return res.status(400).json({ error: "filePath is required" });
    }

    const absolutePath = resolvePublicPath(filePath);
    if (!absolutePath) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    const allowedDirs = [UPLOADS_DIR, AUDIO_DIR, RENDERS_DIR];
    const isAllowed = allowedDirs.some((dir) => absolutePath.startsWith(dir));
    if (!isAllowed) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const filename = path.basename(absolutePath);
    res.download(absolutePath, filename, (err) => {
      if (err && !res.headersSent) {
        return next(err);
      }
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { downloadFile };
