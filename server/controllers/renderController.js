const { renderVideo, FORMAT_SIZES } = require("../services/renderService");
const { createVideo } = require("../services/videoService");

const renderHandler = async (req, res, next) => {
  try {
    const { media, audio, format } = req.body;

    if (!Array.isArray(media) || media.length === 0) {
      return res.status(400).json({ error: "media must be a non-empty array" });
    }
    if (!audio) {
      return res.status(400).json({ error: "audio is required" });
    }

    const output = await renderVideo({ media, audio, format });

    await createVideo({
      media,
      audio,
      output: output.outputUrl,
      status: "completed"
    }).catch(() => null);

    return res.json({
      outputUrl: output.outputUrl,
      format: output.format,
      sizes: FORMAT_SIZES
    });
  } catch (err) {
    await createVideo({
      media: req.body?.media || [],
      audio: req.body?.audio || null,
      output: null,
      status: "failed"
    }).catch(() => null);

    return next(err);
  }
};

module.exports = { renderHandler };
