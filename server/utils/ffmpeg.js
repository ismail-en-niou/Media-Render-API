const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

module.exports = { ffmpeg, ffmpegPath };
