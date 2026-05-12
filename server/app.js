const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { ensureDirs } = require("./utils/ensureDirs");
const { UPLOADS_DIR, AUDIO_DIR, RENDERS_DIR } = require("./utils/paths");

const uploadRoutes = require("./routes/uploadRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const renderRoutes = require("./routes/renderRoutes");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./utils/swaggerDoc');

const app = express();

ensureDirs();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/audio", express.static(AUDIO_DIR));
app.use("/renders", express.static(RENDERS_DIR));

app.use("/api/upload", uploadRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/render", renderRoutes);

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
