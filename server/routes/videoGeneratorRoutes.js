const express = require("express");
const { generateVideoWithElevenLabs } = require("../controllers/videoGeneratorController");

const router = express.Router();

router.post("/", generateVideoWithElevenLabs);

module.exports = router;
