const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
let ffprobePath = null;

try {
  ffprobePath = require("ffprobe-static").path;
} catch (err) {
  ffprobePath = null;
}

const useStaticFfmpeg = process.env.FFMPEG_STATIC === "1";

if (useStaticFfmpeg && ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath);
}

module.exports = { ffmpeg, ffmpegPath, ffprobePath };
