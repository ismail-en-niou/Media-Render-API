const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { ffmpeg } = require("../utils/ffmpeg");
const {
  UPLOADS_DIR,
  AUDIO_DIR,
  RENDERS_DIR,
  resolvePublicPath,
  toPublicPath
} = require("../utils/paths");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXTS = new Set([".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"]);

const FORMAT_SIZES = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 }
};

const DEFAULT_FORMAT = "16:9";
const IMAGE_DURATION_SECONDS = Number(process.env.IMAGE_DURATION_SECONDS || 3);
const AUDIO_VOLUME = Number(process.env.AUDIO_VOLUME || 1.5);

const ensureAllowedPath = (absolutePath) => {
  const normalized = path.normalize(absolutePath);
  if (normalized.startsWith(UPLOADS_DIR) || normalized.startsWith(AUDIO_DIR)) {
    return;
  }
  throw new Error("Media path is not allowed.");
};

const resolveMediaPath = (publicPath) => {
  const absolute = resolvePublicPath(publicPath);
  if (!absolute) {
    throw new Error("Invalid media path.");
  }
  ensureAllowedPath(absolute);
  if (!fs.existsSync(absolute)) {
    throw new Error(`File not found: ${publicPath}`);
  }
  return absolute;
};

const renderVideo = ({ media, audio, format }) => {
  if (!Array.isArray(media)) {
    throw new Error("media must be an array");
  }
  if (!audio) {
    throw new Error("audio is required");
  }

  const size = FORMAT_SIZES[format] || FORMAT_SIZES[DEFAULT_FORMAT];
  const width = size.width;
  const height = size.height;

  const mediaPaths = media.map(resolveMediaPath);
  const audioPath = resolveMediaPath(audio);

  const outputName = `render-${uuidv4()}.mp4`;
  const outputPath = path.join(RENDERS_DIR, outputName);

  const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`;
  const filterParts = [];
  const command = ffmpeg();

  // If no media is provided, create a plain background video and attach the audio.
  if (mediaPaths.length === 0) {
    return new Promise((resolve, reject) => {
      command
        .input(`color=c=black:s=${width}x${height}:r=30`)
        .inputOptions(["-f lavfi"])
        .input(audioPath)
        .outputOptions([
          "-map 0:v",
          "-map 1:a",
          "-c:v libx264",
          "-c:a aac",
          `-af volume=${AUDIO_VOLUME}`,
          "-shortest",
          "-movflags +faststart"
        ])
        .on("end", () => {
          resolve({
            outputPath,
            outputUrl: toPublicPath("renders", outputName),
            format: format || DEFAULT_FORMAT
          });
        })
        .on("error", (err) => reject(err))
        .save(outputPath);
    });
  }

  mediaPaths.forEach((mediaPath, index) => {
    const ext = path.extname(mediaPath).toLowerCase();
    if (IMAGE_EXTS.has(ext)) {
      command.input(mediaPath).inputOptions(["-loop 1", `-t ${IMAGE_DURATION_SECONDS}`]);
    } else if (VIDEO_EXTS.has(ext)) {
      command.input(mediaPath);
    } else {
      throw new Error(`Unsupported media type: ${mediaPath}`);
    }
    filterParts.push(`[${index}:v]${scaleFilter}[v${index}]`);
  });

  command.input(audioPath);

  const concatInputs = mediaPaths.map((_item, index) => `[v${index}]`).join("");
  filterParts.push(`${concatInputs}concat=n=${mediaPaths.length}:v=1:a=0[vout]`);

  return new Promise((resolve, reject) => {
    command
      .complexFilter(filterParts.join(";"))
      .outputOptions([
        "-map [vout]",
        `-map ${mediaPaths.length}:a`,
        "-c:v libx264",
        "-c:a aac",
        `-af volume=${AUDIO_VOLUME}`,
        "-r 30",
        "-shortest",
        "-movflags +faststart"
      ])
      .on("end", () => {
        resolve({
          outputPath,
          outputUrl: toPublicPath("renders", outputName),
          format: format || DEFAULT_FORMAT
        });
      })
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
};

module.exports = { renderVideo, FORMAT_SIZES };
