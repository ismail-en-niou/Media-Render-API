const express = require("express");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { UPLOADS_DIR } = require("../utils/paths");
const { uploadMedia } = require("../controllers/uploadController");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype && (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/"))) {
    cb(null, true);
  } else {
    cb(new Error("Only image or video files are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 200 }
});

const router = express.Router();

router.post("/", upload.array("files", 10), uploadMedia);

module.exports = router;
