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
const OUTPUT_FPS = Number(process.env.OUTPUT_FPS || 30);
const RESOLVED_FPS = Number.isFinite(OUTPUT_FPS) ? OUTPUT_FPS : 30;
const MAX_CLIP_COUNT = Number(process.env.MAX_CLIP_COUNT || 200);
const RESOLVED_MAX_CLIP_COUNT = Number.isFinite(MAX_CLIP_COUNT) ? MAX_CLIP_COUNT : 200;
const MAX_WORD_FILTERS = Number(process.env.MAX_WORD_FILTERS || 140);
const RESOLVED_MAX_WORD_FILTERS = Number.isFinite(MAX_WORD_FILTERS) && MAX_WORD_FILTERS > 0
  ? MAX_WORD_FILTERS
  : 140;
const DRAW_TEXT_FONT = process.env.DRAW_TEXT_FONT || "";

const DEFAULT_TEXT_STYLE = {
  position: "bottom-center",
  color: "white",
  fontSize: 48,
  shadowColor: "black",
  shadowX: 2,
  shadowY: 2,
  margin: 48,
  x: null,
  y: null,
  fontFile: ""
};

const FALLBACK_BLACK_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnqYJgAAAAASUVORK5CYII=";

const ensureTmpDir = () => {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
};

const ensureFallbackImage = () => {
  ensureTmpDir();
  const fallbackPath = path.join(TMP_DIR, "fallback-black.png");
  if (!fs.existsSync(fallbackPath)) {
    fs.writeFileSync(fallbackPath, Buffer.from(FALLBACK_BLACK_PNG_BASE64, "base64"));
  }
  return fallbackPath;
};

const escapeFilterOption = (value) => {
  return String(value)
    .replace(/\\/g, "/")
    .replace(/:/g, "\\:")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/'/g, "\\'")
    .replace(/\s/g, "\\ ");
};

const toFilterPath = (filePath) => {
  const absolutePath = path.resolve(filePath);
  const relativePath = path.relative(process.cwd(), absolutePath) || absolutePath;
  return escapeFilterOption(relativePath);
};

const createDrawtextTextFile = (value, tempFiles) => {
  ensureTmpDir();
  const filePath = path.join(TMP_DIR, `drawtext-${uuidv4()}.txt`);
  fs.writeFileSync(filePath, String(value ?? ""), "utf8");
  if (Array.isArray(tempFiles)) {
    tempFiles.push(filePath);
  }
  return filePath;
};

const buildDrawtextTextOption = (value, tempFiles) => {
  if (Array.isArray(tempFiles)) {
    return `textfile=${toFilterPath(createDrawtextTextFile(value, tempFiles))}`;
  }
  return `text='${escapeDrawtext(value)}'`;
};

const cleanupTempFiles = (files) => {
  files.forEach((filePath) => {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      // Best-effort cleanup only; render output should not fail because of it.
    }
  });
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

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const clampDuration = (value, fallback) => {
  const num = toNumber(value);
  if (!Number.isFinite(num) || num <= 0) {
    return fallback;
  }
  return num;
};

const normalizeEffect = (value, defaultEffect) => {
  const raw = value ?? defaultEffect ?? "none";
  if (typeof raw !== "string") {
    return "none";
  }
  const normalized = raw.trim().toLowerCase();
  if (normalized === "zoom" || normalized === "zoom-in" || normalized === "in") {
    return "zoom-in";
  }
  if (normalized === "zoom-out" || normalized === "out") {
    return "zoom-out";
  }
  return "none";
};

const normalizeTextOverlay = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return { value };
  }
  if (typeof value === "object" && typeof value.value === "string") {
    return {
      value: value.value,
      start: toNumber(value.start),
      end: toNumber(value.end)
    };
  }
  return null;
};

const normalizeTextStyle = (style) => {
  const resolved = { ...DEFAULT_TEXT_STYLE };
  if (style && typeof style === "object") {
    if (typeof style.position === "string") {
      resolved.position = style.position;
    }
    if (typeof style.color === "string") {
      resolved.color = style.color;
    }
    if (Number.isFinite(Number(style.fontSize))) {
      resolved.fontSize = Number(style.fontSize);
    }
    if (typeof style.shadowColor === "string") {
      resolved.shadowColor = style.shadowColor;
    }
    if (Number.isFinite(Number(style.shadowX))) {
      resolved.shadowX = Number(style.shadowX);
    }
    if (Number.isFinite(Number(style.shadowY))) {
      resolved.shadowY = Number(style.shadowY);
    }
    if (Number.isFinite(Number(style.margin))) {
      resolved.margin = Number(style.margin);
    }
    if (Number.isFinite(Number(style.x))) {
      resolved.x = Number(style.x);
    }
    if (Number.isFinite(Number(style.y))) {
      resolved.y = Number(style.y);
    }
    if (typeof style.fontFile === "string") {
      resolved.fontFile = style.fontFile;
    }
  }
  if (!resolved.fontFile && DRAW_TEXT_FONT) {
    resolved.fontFile = DRAW_TEXT_FONT;
  }

  const allowedPositions = new Set([
    "bottom-center",
    "top-center",
    "center",
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "custom"
  ]);
  if (!allowedPositions.has(resolved.position)) {
    resolved.position = "bottom-center";
  }
  return resolved;
};

const resolveTextPosition = (style) => {
  const margin = Number.isFinite(style.margin) ? style.margin : 48;

  if (style.position === "custom") {
    const customX = Number.isFinite(style.x) ? style.x : 0;
    const customY = Number.isFinite(style.y) ? style.y : 0;
    return {
      x: customX,
      y: customY
    };
  }

  switch (style.position) {
    case "top-center":
      return { x: "(w-text_w)/2", y: margin };
    case "center":
      return { x: "(w-text_w)/2", y: "(h-text_h)/2" };
    case "top-left":
      return { x: margin, y: margin };
    case "top-right":
      return { x: `w-text_w-${margin}`, y: margin };
    case "bottom-left":
      return { x: margin, y: `h-${margin}-text_h` };
    case "bottom-right":
      return { x: `w-text_w-${margin}`, y: `h-${margin}-text_h` };
    case "bottom-center":
    default:
      return { x: "(w-text_w)/2", y: `h-${margin}-text_h` };
  }
};

let drawtextAvailable = null;

const resolveDrawtextAvailability = () => {
  if (drawtextAvailable !== null) {
    return Promise.resolve(drawtextAvailable);
  }

  return new Promise((resolve) => {
    ffmpeg.getAvailableFilters((err, filters) => {
      if (err) {
        drawtextAvailable = false;
      } else {
        drawtextAvailable = Boolean(filters && filters.drawtext);
      }
      resolve(drawtextAvailable);
    });
  });
};

const escapeDrawtext = (value) => {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n");
};

const buildDrawTextFilter = (textOverlay, textStyle, clipDuration, tempTextFiles) => {
  if (!textOverlay || !textOverlay.value) {
    return null;
  }

  const style = normalizeTextStyle(textStyle);
  const { x: xPos, y: yPos } = resolveTextPosition(style);
  const parts = [
    `drawtext=${buildDrawtextTextOption(textOverlay.value, tempTextFiles)}`,
    "expansion=none",
    `fontcolor=${style.color}`,
    `fontsize=${style.fontSize}`,
    `x=${xPos}`,
    `y=${yPos}`
  ];

  if (style.fontFile) {
    parts.push(`fontfile=${toFilterPath(style.fontFile)}`);
  }

  if (style.shadowColor) {
    parts.push(`shadowcolor=${style.shadowColor}`);
    parts.push(`shadowx=${style.shadowX}`);
    parts.push(`shadowy=${style.shadowY}`);
  }

  const start = toNumber(textOverlay.start);
  const end = toNumber(textOverlay.end);
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    parts.push(`enable='between(t,${start},${end})'`);
  } else if (Number.isFinite(start) && Number.isFinite(clipDuration) && clipDuration > start) {
    parts.push(`enable='between(t,${start},${clipDuration})'`);
  }

  return parts.join(":");
};

const buildWordLevelDrawTextFilters = (words, textStyle, clipStart = 0, tempTextFiles) => {
  if (!Array.isArray(words) || words.length === 0) {
    return [];
  }

  const style = normalizeTextStyle(textStyle);
  const { x: xPos, y: yPos } = resolveTextPosition(style);

  return words.map((word) => {
    const wordText = typeof word?.text === "string" ? word.text.trim() : "";
    const wordStart = toNumber(word?.start);
    const wordEnd = toNumber(word?.end);
    if (!wordText || !Number.isFinite(wordStart) || !Number.isFinite(wordEnd) || wordEnd <= wordStart) {
      return null;
    }

    const parts = [
      `drawtext=${buildDrawtextTextOption(wordText, tempTextFiles)}`,
      "expansion=none",
      `fontcolor=${style.color}`,
      `fontsize=${style.fontSize}`,
      `x=${xPos}`,
      `y=${yPos}`
    ];

    if (style.fontFile) {
      parts.push(`fontfile=${toFilterPath(style.fontFile)}`);
    }

    if (style.shadowColor) {
      parts.push(`shadowcolor=${style.shadowColor}`);
      parts.push(`shadowx=${style.shadowX}`);
      parts.push(`shadowy=${style.shadowY}`);
    }

    const absoluteStart = clipStart + wordStart;
    const absoluteEnd = clipStart + wordEnd;
    parts.push(`enable='between(t,${absoluteStart},${absoluteEnd})'`);

    return parts.join(":");
  }).filter(Boolean);
};

const normalizeWordTimings = (wordTimings) => {
  if (!Array.isArray(wordTimings)) {
    return [];
  }

  return wordTimings
    .map((word) => ({
      text: typeof word?.text === "string" ? word.text.trim() : "",
      start: toNumber(word?.start),
      end: toNumber(word?.end)
    }))
    .filter((word) => word.text && Number.isFinite(word.start) && Number.isFinite(word.end) && word.end > word.start)
    .sort((a, b) => a.start - b.start);
};

const buildZoomFilter = (direction, durationSeconds, fps, width, height) => {
  const safeDuration = Math.max(0.1, Number.isFinite(durationSeconds) ? durationSeconds : 3);
  const zoomDelta = 0.18;
  const normT = `(t/${safeDuration})`;
  const easeExpr = `(${normT}*${normT}*(3-2*${normT}))`;
  const factorExpr = direction === "zoom-out"
    ? `${1 + zoomDelta}-(${zoomDelta}*${easeExpr})`
    : `1+(${zoomDelta}*${easeExpr})`;

  // Dynamic scale+crop works for both images and videos and produces visible zoom motion.
  return `scale=w='${width}*(${factorExpr})':h='${height}*(${factorExpr})':eval=frame,crop=${width}:${height},fps=${fps}`;
};

const probeDuration = (absolutePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(absolutePath, (err, data) => {
      if (err) {
        return reject(err);
      }
      const formatDuration = toNumber(data?.format?.duration);
      if (Number.isFinite(formatDuration) && formatDuration > 0) {
        return resolve(formatDuration);
      }
      const streamDuration = (data?.streams || [])
        .map((stream) => toNumber(stream?.duration))
        .find((value) => Number.isFinite(value) && value > 0);
      return resolve(streamDuration || null);
    });
  });
};

const getClipDurationSeconds = async (clip) => {
  if (clip.type === "image") {
    return clip.duration;
  }
  if (clip.type === "video") {
    if (Number.isFinite(clip.duration)) {
      return clip.duration;
    }
    return probeDuration(clip.path);
  }
  return null;
};

const normalizeClipInput = (clip) => {
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
};

const normalizeClips = (clips, media) => {
  const source = Array.isArray(clips) && clips.length > 0 ? clips : Array.isArray(media) ? media : [];
  return source.map(normalizeClipInput).filter(Boolean);
};

const repeatClips = (clips, repeats, warnings) => {
  const maxCount = Math.max(1, RESOLVED_MAX_CLIP_COUNT);
  const result = [];
  for (let i = 0; i < repeats && result.length < maxCount; i += 1) {
    for (const clip of clips) {
      if (result.length >= maxCount) {
        break;
      }
      result.push({ ...clip });
    }
  }

  if (result.length < clips.length * repeats) {
    warnings.push("Clip count limit reached; output may be shorter than audio.");
  }

  return result;
};

const applyExtendMode = async ({ clips, audioPath, extendMode, warnings }) => {
  const mode = typeof extendMode === "string" ? extendMode.toLowerCase() : "none";
  if (mode === "none") {
    return clips;
  }

  let audioDuration = null;
  try {
    audioDuration = await probeDuration(audioPath);
  } catch (err) {
    warnings.push("Audio duration unavailable; skipping extend mode.");
    return clips;
  }

  if (!Number.isFinite(audioDuration)) {
    warnings.push("Audio duration unavailable; skipping extend mode.");
    return clips;
  }

  const clipDurations = await Promise.all(
    clips.map(async (clip) => {
      try {
        return await getClipDurationSeconds(clip);
      } catch (err) {
        return null;
      }
    })
  );

  if (clipDurations.some((value) => !Number.isFinite(value))) {
    warnings.push("Clip duration unavailable; skipping extend mode.");
    return clips;
  }

  const totalDuration = clipDurations.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(totalDuration) || totalDuration <= 0) {
    return clips;
  }

  if (audioDuration <= totalDuration + 0.05) {
    return clips;
  }

  if (mode === "loop") {
    const repeats = Math.ceil(audioDuration / totalDuration);
    return repeatClips(clips, repeats, warnings);
  }

  if (mode === "stretch") {
    const imageTotal = clips.reduce((sum, clip, index) => {
      if (clip.type === "image") {
        return sum + clipDurations[index];
      }
      return sum;
    }, 0);
    const videoTotal = totalDuration - imageTotal;
    const remaining = audioDuration - videoTotal;
    if (remaining <= 0 || imageTotal <= 0) {
      warnings.push("Stretch mode requires image clips; skipping.");
      return clips;
    }
    const factor = remaining / imageTotal;
    if (!Number.isFinite(factor) || factor <= 1) {
      return clips;
    }
    return clips.map((clip) => {
      if (clip.type !== "image") {
        return clip;
      }
      return { ...clip, duration: clip.duration * factor };
    });
  }

  warnings.push("Unknown extend mode; skipping.");
  return clips;
};

const renderVideo = async ({ media, clips, audio, wordTimings, format, extendMode, defaultEffect, textStyle }) => {
  if (!audio) {
    throw new Error("audio is required");
  }

  const size = FORMAT_SIZES[format] || FORMAT_SIZES[DEFAULT_FORMAT];
  const width = size.width;
  const height = size.height;

  const warnings = [];
  let normalizedClips = normalizeClips(clips, media);

  if (normalizedClips.length === 0) {
    normalizedClips = [{ path: ensureFallbackImage(), isFallback: true }];
  }

  const preparedClips = normalizedClips.map((clip) => {
    const normalized = normalizeClipInput(clip);
    const effect = normalizeEffect(normalized?.effect, defaultEffect);
    const textOverlay = normalizeTextOverlay(normalized?.textOverlay || normalized?.text);
    const duration = toNumber(normalized?.duration);
    return {
      ...normalized,
      effect,
      textOverlay,
      duration
    };
  });

  const resolvedClips = preparedClips.map((clip) => {
    const absolutePath = clip.path ? clip.path : resolveMediaPath(clip.src);
    const ext = path.extname(absolutePath).toLowerCase();
    let type = null;
    if (IMAGE_EXTS.has(ext)) {
      type = "image";
    } else if (VIDEO_EXTS.has(ext)) {
      type = "video";
    } else {
      throw new Error(`Unsupported media type: ${absolutePath}`);
    }
    const duration = type === "image"
      ? clampDuration(clip.duration, IMAGE_DURATION_SECONDS)
      : toNumber(clip.duration);
    return {
      ...clip,
      type,
      path: absolutePath,
      duration
    };
  });

  const audioPath = resolveMediaPath(audio);
  const finalClips = await applyExtendMode({
    clips: resolvedClips,
    audioPath,
    extendMode,
    warnings
  });
  const resolvedWordTimings = normalizeWordTimings(wordTimings);
  let safeWordTimings = resolvedWordTimings;
  if (resolvedWordTimings.length > RESOLVED_MAX_WORD_FILTERS) {
    safeWordTimings = resolvedWordTimings.slice(0, RESOLVED_MAX_WORD_FILTERS);
    warnings.push(
      `Word-by-word captions were limited to ${RESOLVED_MAX_WORD_FILTERS} words for render stability.`
    );
  }
  if (finalClips.length > 24 && safeWordTimings.length > 0) {
    safeWordTimings = [];
    warnings.push("Word-by-word captions were disabled for long clip sequences to avoid FFmpeg crashes.");
  }

  const outputName = `render-${uuidv4()}.mp4`;
  const outputPath = path.join(RENDERS_DIR, outputName);

  const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`;
  const filterParts = [];
  const tempTextFiles = [];
  const command = ffmpeg();

  const hasTextOverlays = finalClips.some(
    (clip) => clip.textOverlay && clip.textOverlay.value
  );
  const hasWordTimings = safeWordTimings.length > 0;
  const canDrawText = await resolveDrawtextAvailability();
  if (!canDrawText && (hasTextOverlays || hasWordTimings)) {
    warnings.push("Drawtext filter unavailable; text overlays skipped.");
  }

  finalClips.forEach((clip, index) => {
    const inputOptions = [];
    if (clip.type === "image") {
      inputOptions.push("-loop 1");
      if (Number.isFinite(clip.duration)) {
        inputOptions.push(`-t ${clip.duration}`);
      }
    } else if (clip.type === "video" && Number.isFinite(clip.duration)) {
      inputOptions.push(`-t ${clip.duration}`);
    }

    const input = command.input(clip.path);
    if (inputOptions.length > 0) {
      input.inputOptions(inputOptions);
    }

    const filterChain = [scaleFilter];
    const hasZoomEffect = clip.effect === "zoom-in" || clip.effect === "zoom-out";
    if (hasZoomEffect) {
      const clipDuration = Number.isFinite(clip.duration) ? clip.duration : 3;
      filterChain.push(buildZoomFilter(clip.effect, clipDuration, RESOLVED_FPS, width, height));
    } else {
      filterChain.push(`fps=${RESOLVED_FPS}`);
    }

    if (canDrawText && clip.textOverlay && clip.textOverlay.value && !hasWordTimings) {
      const textFilter = buildDrawTextFilter(clip.textOverlay, textStyle, clip.duration, tempTextFiles);
      if (textFilter) {
        filterChain.push(textFilter);
      }
    }

    filterParts.push(`[${index}:v]${filterChain.join(",")}[v${index}]`);
  });

  command.input(audioPath);

  const concatInputs = finalClips.map((_item, index) => `[v${index}]`).join("");
  if (canDrawText && hasWordTimings) {
    const wordFilters = buildWordLevelDrawTextFilters(safeWordTimings, textStyle, 0, tempTextFiles);
    if (wordFilters.length > 0) {
      filterParts.push(`${concatInputs}concat=n=${finalClips.length}:v=1:a=0[vbase]`);
      filterParts.push(`[vbase]${wordFilters.join(",")}[vout]`);
    } else {
      filterParts.push(`${concatInputs}concat=n=${finalClips.length}:v=1:a=0[vout]`);
    }
  } else {
    filterParts.push(`${concatInputs}concat=n=${finalClips.length}:v=1:a=0[vout]`);
  }

  return new Promise((resolve, reject) => {
    command
      .complexFilter(filterParts.join(";"))
      .outputOptions([
        "-map [vout]",
        `-map ${finalClips.length}:a`,
        "-c:v libx264",
        "-preset veryfast",
        "-pix_fmt yuv420p",
        "-c:a aac",
        `-af volume=${AUDIO_VOLUME}`,
        `-r ${RESOLVED_FPS}`,
        "-shortest",
        "-movflags +faststart"
      ])
      .on("end", () => {
        cleanupTempFiles(tempTextFiles);
        resolve({
          outputPath,
          outputUrl: toPublicPath("renders", outputName),
          format: format || DEFAULT_FORMAT,
          warnings
        });
      })
      .on("error", (err) => {
        cleanupTempFiles(tempTextFiles);
        reject(err);
      })
      .save(outputPath);
  });
};

module.exports = { renderVideo, FORMAT_SIZES };
