const path = require("path");
const { toPublicPath } = require("../utils/paths");

const uploadMedia = (req, res) => {
  const files = req.files || [];
  const fileUrls = files.map((file) => {
    const filename = file.filename || path.basename(file.path || "");
    return toPublicPath("uploads", filename);
  });

  res.json({ success: true, files: fileUrls });
};

module.exports = { uploadMedia };
