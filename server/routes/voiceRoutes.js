const express = require("express");
const { generateVoiceHandler } = require("../controllers/voiceController");
const { checkElevenLabs } = require("../controllers/voiceCheckController");

const router = express.Router();

router.post("/generate", generateVoiceHandler);
router.get('/check', checkElevenLabs);

module.exports = router;
