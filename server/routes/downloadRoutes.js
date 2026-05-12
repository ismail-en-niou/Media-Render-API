const express = require("express");
const { downloadFile } = require("../controllers/downloadController");

const router = express.Router();

router.get("/:filePath(*)", downloadFile);

module.exports = router;
