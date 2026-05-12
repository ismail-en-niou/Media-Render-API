const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema(
  {
    media: { type: [String], default: [] },
    audio: { type: String, default: null },
    output: { type: String, default: null },
    status: { type: String, default: "pending" }
  },
  { timestamps: true }
);

const Video = mongoose.models.Video || mongoose.model("Video", VideoSchema);

const createVideo = async (payload) => Video.create(payload);

module.exports = { createVideo };
