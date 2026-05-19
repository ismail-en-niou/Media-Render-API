const fs = require("fs");
const path = require("path");
const { RENDERS_DIR } = require("../utils/paths");

// In-memory store for active render jobs (for MVP; use a DB in production)
const renderJobs = new Map();

const createRenderJob = (jobId, data = {}) => {
  const { media = [], audio = null, format = null, ...extra } = data;

  renderJobs.set(jobId, {
    jobId,
    media,
    audio,
    format,
    status: "pending",
    progress: 0,
    outputUrl: null,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...extra
  });
  return renderJobs.get(jobId);
};

const updateRenderJob = (jobId, updates) => {
  if (!renderJobs.has(jobId)) {
    throw new Error("Job not found");
  }
  const job = renderJobs.get(jobId);
  Object.assign(job, updates, { updatedAt: new Date() });
  return job;
};

const getRenderJob = (jobId) => {
  if (!renderJobs.has(jobId)) {
    return null;
  }
  return renderJobs.get(jobId);
};

const listRenderJobs = () => {
  return Array.from(renderJobs.values());
};

const deleteRenderJob = (jobId) => {
  return renderJobs.delete(jobId);
};

const cleanupOldJobs = () => {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  for (const [jobId, job] of renderJobs.entries()) {
    const isFinished = job.status === "completed" || job.status === "failed";
    if (isFinished && job.updatedAt < thirtyMinutesAgo) {
      renderJobs.delete(jobId);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupOldJobs, 10 * 60 * 1000);

module.exports = {
  createRenderJob,
  updateRenderJob,
  getRenderJob,
  listRenderJobs,
  deleteRenderJob,
  cleanupOldJobs
};
