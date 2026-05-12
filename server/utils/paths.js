const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const AUDIO_DIR = path.join(ROOT_DIR, "audio");
const RENDERS_DIR = path.join(ROOT_DIR, "renders");
const TMP_DIR = path.join(RENDERS_DIR, "tmp");

const toPublicPath = (dir, filename) => {
  if (!filename) {
    return null;
  }
  const base = path.basename(filename);
  return `/${dir}/${base}`;
};

const resolvePublicPath = (publicPath) => {
  if (!publicPath || typeof publicPath !== "string") {
    return null;
  }
  const trimmed = publicPath.replace(/^\/+/, "");
  const normalized = path.normalize(trimmed);
  const resolved = path.join(ROOT_DIR, normalized);
  if (!resolved.startsWith(ROOT_DIR)) {
    throw new Error("Invalid path");
  }
  return resolved;
};

module.exports = {
  ROOT_DIR,
  UPLOADS_DIR,
  AUDIO_DIR,
  RENDERS_DIR,
  TMP_DIR,
  toPublicPath,
  resolvePublicPath
};
