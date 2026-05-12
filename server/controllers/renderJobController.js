const { v4: uuidv4 } = require("uuid");
const { getRenderJob, createRenderJob, updateRenderJob } = require("../services/renderJobService");
const { renderVideo } = require("../services/renderService");

const getRenderStatus = (req, res) => {
  try {
    const { jobId } = req.params;
    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    const job = getRenderJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Render job not found" });
    }

    return res.json(job);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const startRender = async (req, res, next) => {
  try {
    const { media, audio, format } = req.body;

    if (!Array.isArray(media) || media.length === 0) {
      return res.status(400).json({ error: "media must be a non-empty array" });
    }
    if (!audio) {
      return res.status(400).json({ error: "audio is required" });
    }

    const jobId = uuidv4();
    const job = createRenderJob(jobId, { media, audio, format });

    // Start async render in background
    (async () => {
      try {
        updateRenderJob(jobId, { status: "processing", progress: 50 });
        const result = await renderVideo({ media, audio, format });
        updateRenderJob(jobId, {
          status: "completed",
          progress: 100,
          outputUrl: result.outputUrl
        });
      } catch (err) {
        updateRenderJob(jobId, {
          status: "failed",
          progress: 0,
          error: err.message
        });
      }
    })();

    return res.json({ jobId, status: job.status });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getRenderStatus, startRender };
