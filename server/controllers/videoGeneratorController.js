const { generateVoice } = require("../services/voiceService");
const { renderVideo } = require("../services/renderService");
const { createVideo } = require("../services/videoService");
const { toPublicPath } = require("../utils/paths");

const generateVideoWithElevenLabs = async (req, res, next) => {
  try {
    const { text, format } = req.body;
    const bodyMedia = Array.isArray(req.body.media) ? req.body.media : [];
    const uploadedMedia = (req.files || []).map((file) => toPublicPath("uploads", file.filename));
    const media = uploadedMedia.length > 0 ? uploadedMedia : bodyMedia;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    if (!Array.isArray(media)) {
      return res.status(400).json({ error: "media must be an array when provided" });
    }

    // Step 1: Generate voice from text using ElevenLabs
    let voiceResult;
    try {
      voiceResult = await generateVoice(text);
    } catch (err) {
      return res.status(500).json({
        error: `Voice generation failed: ${err.message}`
      });
    }

    // Step 2: Render video with generated voice + media
    let renderResult;
    try {
      renderResult = await renderVideo({
        media,
        audio: voiceResult.audioUrl,
        format: format || "16:9"
      });
    } catch (err) {
      return res.status(500).json({
        error: `Video render failed: ${err.message}`
      });
    }

    // Step 3: Save to database
    await createVideo({
      media,
      audio: voiceResult.audioUrl,
      output: renderResult.outputUrl,
      status: "completed"
    }).catch(() => null);

    return res.json({
      success: true,
      text,
      audioUrl: voiceResult.audioUrl,
      outputUrl: renderResult.outputUrl,
      format: renderResult.format
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { generateVideoWithElevenLabs };
