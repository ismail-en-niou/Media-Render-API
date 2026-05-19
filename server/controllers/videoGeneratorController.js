const { generateVoice } = require("../services/voiceService");
const { renderVideo } = require("../services/renderService");
const { createVideo } = require("../services/videoService");
const { getRenderJob, createRenderJob, updateRenderJob } = require("../services/renderJobService");
const { toPublicPath } = require("../utils/paths");
const { v4: uuidv4 } = require("uuid");

const parseJsonField = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === "object") {
    return value;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (err) {
      return null;
    }
  }
  return null;
};

const normalizeClips = ({ rawClips, bodyMedia, uploadedMedia }) => {
  let clips = [];
  if (Array.isArray(rawClips)) {
    clips = rawClips;
  } else if (Array.isArray(bodyMedia)) {
    clips = bodyMedia;
  }

  const normalized = clips
    .map((clip) => {
      if (!clip) {
        return null;
      }
      if (typeof clip === "string") {
        return { src: clip };
      }
      if (typeof clip === "object") {
        return { ...clip };
      }
      return null;
    })
    .filter(Boolean);

  if (uploadedMedia.length > 0) {
    if (normalized.length === 0) {
      return uploadedMedia.map((src) => ({ src }));
    }
    return normalized
      .map((clip, index) => {
        if (!clip.src && uploadedMedia[index]) {
          return { ...clip, src: uploadedMedia[index] };
        }
        return clip;
      })
      .filter((clip) => Boolean(clip.src));
  }

  return normalized;
};

const generateVideoWithElevenLabs = async (req, res, next) => {
  try {
    const { text, format, extendMode, defaultEffect } = req.body;
    const resolvedExtendMode = extendMode || "loop";
    const rawClips = parseJsonField(req.body.clips);
    const bodyMedia = parseJsonField(req.body.media) || [];
    const textStyle = parseJsonField(req.body.textStyle);
    const uploadedMedia = (req.files || []).map((file) => toPublicPath("uploads", file.filename));
    const clips = normalizeClips({ rawClips, bodyMedia, uploadedMedia });

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    if (!Array.isArray(clips)) {
      return res.status(400).json({ error: "clips must be an array when provided" });
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
        clips,
        audio: voiceResult.audioUrl,
        wordTimings: voiceResult.wordTimings,
        format: format || "16:9",
        extendMode: resolvedExtendMode,
        defaultEffect,
        textStyle
      });
    } catch (err) {
      return res.status(500).json({
        error: `Video render failed: ${err.message}`
      });
    }

    // Step 3: Save to database
    await createVideo({
      media: clips.map((clip) => clip.src).filter(Boolean),
      audio: voiceResult.audioUrl,
      output: renderResult.outputUrl,
      status: "completed"
    }).catch(() => null);

    return res.json({
      success: true,
      text,
      audioUrl: voiceResult.audioUrl,
      outputUrl: renderResult.outputUrl,
      format: renderResult.format,
      warnings: renderResult.warnings || []
    });
  } catch (err) {
    return next(err);
  }
};

const startVideoGenerationJob = async (req, res, next) => {
  try {
    const { text, format, extendMode, defaultEffect } = req.body;
    const resolvedExtendMode = extendMode || "loop";
    const rawClips = parseJsonField(req.body.clips);
    const bodyMedia = parseJsonField(req.body.media) || [];
    const textStyle = parseJsonField(req.body.textStyle);
    const uploadedMedia = (req.files || []).map((file) => toPublicPath("uploads", file.filename));
    const clips = normalizeClips({ rawClips, bodyMedia, uploadedMedia });

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    if (!Array.isArray(clips)) {
      return res.status(400).json({ error: "clips must be an array when provided" });
    }

    const jobId = uuidv4();
    const job = createRenderJob(jobId, {
      type: "video-generate",
      text,
      media: clips.map((clip) => clip.src).filter(Boolean),
      audio: null,
      format: format || "16:9",
      progress: 5,
      message: "Queued"
    });

    (async () => {
      let voiceResult = null;
      try {
        updateRenderJob(jobId, {
          status: "processing",
          progress: 15,
          message: "Generating voiceover"
        });

        voiceResult = await generateVoice(text);
        updateRenderJob(jobId, {
          audio: voiceResult.audioUrl,
          audioUrl: voiceResult.audioUrl,
          progress: 40,
          message: "Rendering video"
        });

        const renderResult = await renderVideo({
          clips,
          audio: voiceResult.audioUrl,
          wordTimings: voiceResult.wordTimings,
          format: format || "16:9",
          extendMode: resolvedExtendMode,
          defaultEffect,
          textStyle
        });

        await createVideo({
          media: clips.map((clip) => clip.src).filter(Boolean),
          audio: voiceResult.audioUrl,
          output: renderResult.outputUrl,
          status: "completed"
        }).catch(() => null);

        updateRenderJob(jobId, {
          status: "completed",
          progress: 100,
          message: "Completed",
          success: true,
          outputUrl: renderResult.outputUrl,
          warnings: renderResult.warnings || []
        });
      } catch (err) {
        await createVideo({
          media: clips.map((clip) => clip.src).filter(Boolean),
          audio: voiceResult?.audioUrl || null,
          output: null,
          status: "failed"
        }).catch(() => null);

        updateRenderJob(jobId, {
          status: "failed",
          progress: 100,
          message: "Failed",
          error: err.message || "Video generation failed"
        });
      }
    })();

    return res.status(202).json({
      jobId,
      status: job.status,
      progress: job.progress,
      message: job.message
    });
  } catch (err) {
    return next(err);
  }
};

const getVideoGenerationJob = (req, res) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    const job = getRenderJob(jobId);
    if (!job || job.type !== "video-generate") {
      return res.status(404).json({ error: "Video generation job not found" });
    }

    return res.json(job);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  generateVideoWithElevenLabs,
  startVideoGenerationJob,
  getVideoGenerationJob
};
