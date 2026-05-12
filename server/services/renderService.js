const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { ffmpeg } = require("../utils/ffmpeg");
const {
  UPLOADS_DIR,
  AUDIO_DIR,
  RENDERS_DIR,
  TMP_DIR,
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

const FALLBACK_BLACK_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnqYJgAAAAASUVORK5CYII=";

const ensureFallbackImage = () => {
  const fallbackPath = path.join(TMP_DIR, "fallback-black.png");
  if (!fs.existsSync(fallbackPath)) {
    fs.writeFileSync(fallbackPath, Buffer.from(FALLBACK_BLACK_PNG_BASE64, "base64"));
  }
  return fallbackPath;
};

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

  let mediaPaths = media.map(resolveMediaPath);
  const audioPath = resolveMediaPath(audio);

  const outputName = `render-${uuidv4()}.mp4`;
  const outputPath = path.join(RENDERS_DIR, outputName);

  const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`;
  const filterParts = [];
  const command = ffmpeg();

  // If no media is provided, use a tiny local black image and loop it for the audio duration.
  if (mediaPaths.length === 0) {
    mediaPaths = [ensureFallbackImage()];
  }

  mediaPaths.forEach((mediaPath, index) => {
    const ext = path.extname(mediaPath).toLowerCase();
    const isFallback = mediaPath.endsWith("fallback-black.png");
    if (IMAGE_EXTS.has(ext)) {
      const inputOptions = isFallback ? ["-loop 1"] : ["-loop 1", `-t ${IMAGE_DURATION_SECONDS}`];
      command.input(mediaPath).inputOptions(inputOptions);
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
