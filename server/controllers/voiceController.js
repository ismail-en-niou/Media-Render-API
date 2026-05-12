const { generateVoice } = require("../services/voiceService");

const generateVoiceHandler = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    const result = await generateVoice(text);
    return res.json({ audioUrl: result.audioUrl });
  } catch (err) {
    return next(err);
  }
};

module.exports = { generateVoiceHandler };
