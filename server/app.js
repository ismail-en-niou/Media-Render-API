const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { ensureDirs } = require("./utils/ensureDirs");
const { UPLOADS_DIR, AUDIO_DIR, IMAGES_DIR, RENDERS_DIR } = require("./utils/paths");

const uploadRoutes = require("./routes/uploadRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const renderRoutes = require("./routes/renderRoutes");
const imageRoutes = require("./routes/imageRoutes");
const downloadRoutes = require("./routes/downloadRoutes");
const renderJobRoutes = require("./routes/renderJobRoutes");
const videoGeneratorRoutes = require("./routes/videoGeneratorRoutes");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./utils/swaggerDoc');

const app = express();

ensureDirs();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/audio", express.static(AUDIO_DIR));
app.use("/images", express.static(IMAGES_DIR));
app.use("/renders", express.static(RENDERS_DIR));

app.use("/api/upload", uploadRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/render", renderRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/render-job", renderJobRoutes);
app.use("/api/video/generate", videoGeneratorRoutes);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api/docs.json', (_req, res) => res.json(swaggerDocument));

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

module.exports = app;
