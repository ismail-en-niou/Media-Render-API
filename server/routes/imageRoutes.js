const express = require("express");
const { generateImageHandler } = require("../controllers/imageController");

const router = express.Router();

router.post("/generate", generateImageHandler);

module.exports = router;