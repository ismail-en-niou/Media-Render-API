const fs = require("fs");
const { UPLOADS_DIR, AUDIO_DIR, IMAGES_DIR, RENDERS_DIR, TMP_DIR } = require("./paths");

const ensureDirs = () => {
  [UPLOADS_DIR, AUDIO_DIR, IMAGES_DIR, RENDERS_DIR, TMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

module.exports = { ensureDirs };
