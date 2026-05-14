const { renderVideo, FORMAT_SIZES } = require("../services/renderService");
const { createVideo } = require("../services/videoService");

const renderHandler = async (req, res, next) => {
  let resolvedMedia = [];
  let resolvedClips = [];

  try {
    const { media, clips, audio, format, extendMode, defaultEffect, textStyle } = req.body;
    resolvedMedia = Array.isArray(media) ? media : [];
    resolvedClips = Array.isArray(clips) ? clips : [];

    if (resolvedMedia.length === 0 && resolvedClips.length === 0) {
      return res.status(400).json({ error: "media or clips must be provided" });
    }
    if (!audio) {
      return res.status(400).json({ error: "audio is required" });
    }

    const output = await renderVideo({
      media: resolvedMedia,
      clips: resolvedClips,
      audio,
      format,
      extendMode,
      defaultEffect,
      textStyle
    });

    await createVideo({
      media: resolvedMedia,
      audio,
      output: output.outputUrl,
      status: "completed"
    }).catch(() => null);

    return res.json({
      outputUrl: output.outputUrl,
      format: output.format,
      sizes: FORMAT_SIZES,
      warnings: output.warnings || []
    });
  } catch (err) {
    await createVideo({
      media: resolvedMedia,
      audio: req.body?.audio || null,
      output: null,
      status: "failed"
    }).catch(() => null);

    return next(err);
  }
};

module.exports = { renderHandler };
